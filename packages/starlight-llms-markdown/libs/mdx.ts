import type { Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown, gfmToMarkdown } from "mdast-util-gfm";
import { type MdxJsxFlowElement, type MdxJsxTextElement, mdxFromMarkdown } from "mdast-util-mdx";
import { toMarkdown } from "mdast-util-to-markdown";
import { directive } from "micromark-extension-directive";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";

type JsxElement = MdxJsxFlowElement | MdxJsxTextElement;

const phrasingTypes = new Set([
  "text",
  "emphasis",
  "strong",
  "delete",
  "inlineCode",
  "break",
  "link",
  "linkReference",
  "image",
  "imageReference",
  "footnoteReference",
  "html",
  "textDirective",
  "mdxJsxTextElement",
  "mdxTextExpression",
]);

const asideTypes = new Set(["note", "tip", "caution", "danger"]);

/** String constants declared in the page's own `export const` statements. */
let constants = new Map<string, string>();

/**
 * Turn an MDX body into plain markdown: imports, exports and expressions are
 * dropped, Starlight's built-in components become their markdown equivalent,
 * and any other component is replaced by its children.
 */
export function mdxToPlainMarkdown(source: string): string {
  const tree = fromMarkdown(source, {
    extensions: [mdxjs(), gfm(), directive()],
    mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown(), directiveFromMarkdown()],
  });
  constants = new Map();
  for (const node of tree.children) {
    if (node.type !== "mdxjsEsm") continue;
    const declarations = node.value.matchAll(
      /\bconst\s+([\w$]+)\s*=\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`)/g,
    );
    for (const [, name, literal] of declarations) {
      const value = stringLiteral(literal);
      if (value !== undefined) constants.set(name, value);
    }
  }
  const root: Root = { type: "root", children: transformAll(tree.children, true) };
  return toMarkdown(root, {
    // No MDX serializer: every MDX node is gone, and its escaping would turn `{` into `\{`.
    extensions: [gfmToMarkdown(), directiveToMarkdown()],
    bullet: "-",
    emphasis: "_",
    fences: true,
    listItemIndent: "one",
    rule: "-",
  }).trim();
}

function transformAll(nodes: RootContent[], flow: boolean): RootContent[] {
  const out = nodes.flatMap((node) => transform(node));
  return flow ? wrapPhrasing(out) : out;
}

function transform(node: RootContent): RootContent[] {
  switch (node.type) {
    case "mdxjsEsm":
    case "mdxFlowExpression":
      return [];
    case "mdxTextExpression": {
      // `{'{'}` and similar are used to escape characters; keep string literals.
      const literal = stringLiteral(node.value);
      return literal === undefined ? [] : [{ type: "text", value: literal }];
    }
    case "mdxJsxFlowElement":
      return wrapPhrasing(convertElement(node));
    case "mdxJsxTextElement":
      return convertElement(node);
  }
  if ("children" in node) {
    const flow = !node.children.every(isPhrasing);
    let children = transformAll(node.children as RootContent[], flow);
    if (!flow) {
      // A component on one line, like `<Aside>Note</Aside>`, parses as inline
      // but may convert to a block: split the paragraph around it.
      if (node.type === "paragraph") return wrapPhrasing(children);
      children = mergeText(children.filter(isPhrasing));
    }
    return [{ ...node, children } as RootContent];
  }
  return [node];
}

function convertElement(node: JsxElement): RootContent[] {
  const flow = node.type === "mdxJsxFlowElement";
  const children = () => transformAll(node.children as RootContent[], flow);
  const text = (value: string): PhrasingContent => ({ type: "text", value });
  const strong = (value: string): Paragraph => ({
    type: "paragraph",
    children: [{ type: "strong", children: [text(value)] }],
  });

  switch (node.name) {
    case "Aside": {
      // Same `:::type[title]` syntax Starlight uses for asides in plain markdown.
      const type = attr(node, "type") ?? "note";
      const title = attr(node, "title");
      const label: Paragraph[] = title
        ? [{ type: "paragraph", data: { directiveLabel: true }, children: [text(title)] }]
        : [];
      return [
        {
          type: "containerDirective",
          name: asideTypes.has(type) ? type : "note",
          attributes: {},
          children: [...label, ...wrapPhrasing(children())] as never,
        },
      ];
    }
    case "TabItem":
    case "Card": {
      const title = attr(node, "label") ?? attr(node, "title");
      return title ? [strong(title), ...children()] : children();
    }
    case "LinkCard": {
      const href = attr(node, "href");
      const title = attr(node, "title") ?? href;
      if (!title) return [];
      const description = attr(node, "description");
      const link: PhrasingContent = href
        ? { type: "link", url: href, children: [text(title)] }
        : text(title);
      return [
        { type: "paragraph", children: [link, ...(description ? [text(`: ${description}`)] : [])] },
      ];
    }
    case "LinkButton":
    case "a": {
      const href = attr(node, "href");
      const inner = children().filter(isPhrasing);
      if (!href) return inner;
      return [{ type: "link", url: href, children: inner.length ? inner : [text(href)] }];
    }
    case "Badge": {
      const value = attr(node, "text");
      return value ? [text(value)] : children();
    }
    case "Code": {
      const value = attr(node, "code");
      if (value === undefined) return [];
      const title = attr(node, "title");
      return [
        {
          type: "code",
          lang: attr(node, "lang") ?? null,
          meta: title ? `title=${JSON.stringify(title)}` : null,
          value: value.replace(/\n$/, ""),
        },
      ];
    }
    case "Image":
    case "img": {
      const src = attr(node, "src");
      return src ? [{ type: "image", url: src, alt: attr(node, "alt") ?? "" }] : [];
    }
    case "Icon":
    case "br":
      return [];
    default:
      // Tabs, Steps, CardGrid, FileTree and unknown components: keep the content.
      return children();
  }
}

/** A string attribute value, or a string literal or page constant inside `attr={...}`. */
function attr(node: JsxElement, name: string): string | undefined {
  for (const attribute of node.attributes) {
    if (attribute.type !== "mdxJsxAttribute" || attribute.name !== name) continue;
    const { value } = attribute;
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      return stringLiteral(value.value) ?? constants.get(value.value.trim());
    }
  }
  return undefined;
}

function stringLiteral(expression: string): string | undefined {
  const match = /^\s*(["'`])([\s\S]*)\1\s*$/.exec(expression);
  if (!match || (match[1] === "`" && match[2].includes("${"))) return undefined;
  const [, quote, body] = match;
  if (quote === "`") return body;
  try {
    return JSON.parse(`"${body.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`);
  } catch {
    return body;
  }
}

function isPhrasing(node: RootContent): node is PhrasingContent {
  return phrasingTypes.has(node.type);
}

/** Join adjacent text nodes, collapsing the double space a removed inline component leaves. */
function mergeText(nodes: PhrasingContent[]): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  for (const node of nodes) {
    const last = out.at(-1);
    if (node.type === "text" && last?.type === "text") {
      const value = /\s$/.test(last.value) ? node.value.replace(/^[ \t]+/, "") : node.value;
      out[out.length - 1] = { type: "text", value: last.value + value };
    } else {
      out.push(node);
    }
  }
  return out;
}

/** Group loose phrasing nodes into paragraphs so they are valid in block context. */
function wrapPhrasing(nodes: RootContent[]): RootContent[] {
  const out: RootContent[] = [];
  let run: PhrasingContent[] = [];
  const flush = () => {
    // Skips paragraphs that only held removed components or expressions.
    if (run.some((n) => n.type !== "text" || n.value.trim())) {
      const children = mergeText(run);
      // Trim whitespace left at the edges where a block was split out.
      const first = children[0];
      if (first.type === "text") children[0] = { ...first, value: first.value.trimStart() };
      const last = children.at(-1)!;
      if (last.type === "text") {
        children[children.length - 1] = { ...last, value: last.value.trimEnd() };
      }
      out.push({ type: "paragraph", children });
    }
    run = [];
  };
  for (const node of nodes) {
    if (isPhrasing(node)) run.push(node);
    else {
      flush();
      out.push(node);
    }
  }
  flush();
  return out;
}
