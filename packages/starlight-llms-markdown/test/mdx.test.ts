import { describe, expect, it } from "vite-plus/test";
import { mdxToPlainMarkdown } from "../libs/mdx";

const convert = (source: string) => mdxToPlainMarkdown(source.replace(/^\n/, ""));

describe("mdxToPlainMarkdown", () => {
  it("drops imports, exports and comments", () => {
    expect(
      convert(`
import { Aside } from "@astrojs/starlight/components";
export const x = 1;

{/* hidden */}

Hello.
`),
    ).toBe("Hello.");
  });

  it("turns asides into Starlight's markdown aside syntax", () => {
    expect(convert(`<Aside type="danger" title="Careful">\n  Body **text**.\n</Aside>`)).toBe(
      ":::danger[Careful]\nBody **text**.\n:::",
    );
    expect(convert(`<Aside>One line.</Aside>`)).toBe(":::note\nOne line.\n:::");
  });

  it("keeps markdown asides as they are", () => {
    expect(convert(`:::tip\nHi\n:::`)).toBe(":::tip\nHi\n:::");
  });

  it("labels tab contents", () => {
    expect(
      convert(`
<Tabs>
  <TabItem label="npm">

\`\`\`sh
npm i x
\`\`\`

  </TabItem>
</Tabs>
`),
    ).toBe("**npm**\n\n```sh\nnpm i x\n```");
  });

  it("unwraps Steps and FileTree", () => {
    expect(convert(`<Steps>\n\n1. One\n2. Two\n\n</Steps>`)).toBe("1. One\n2. Two");
    expect(convert(`<FileTree>\n\n- src/\n  - a.ts\n\n</FileTree>`)).toBe("- src/\n  - a.ts");
  });

  it("converts cards and link cards", () => {
    expect(convert(`<Card title="Fast" icon="rocket">\n  Quick.\n</Card>`)).toBe(
      "**Fast**\n\nQuick.",
    );
    expect(convert(`<LinkCard title="Docs" href="/docs/" description="Read more." />`)).toBe(
      "[Docs](/docs/): Read more.",
    );
  });

  it("renders Code from literals and page constants, and skips unknown values", () => {
    expect(convert(`<Code code="a()" lang="js" title="x.js" />`)).toBe(
      '```js title="x.js"\na()\n```',
    );
    expect(convert('export const src = `b()`;\n\n<Code code={src} lang="js" />')).toBe(
      "```js\nb()\n```",
    );
    expect(convert(`import src from "./x.js?raw";\n\n<Code code={src} lang="js" />`)).toBe("");
  });

  it("handles inline components", () => {
    expect(convert(`A <Badge text="New" /> b <Icon name="star" /> c.`)).toBe("A New b c.");
    expect(convert(`See <LinkButton href="/x/">this</LinkButton>.`)).toBe("See [this](/x/).");
    expect(convert(`Literal {"{braces}"}.`)).toBe("Literal {braces}.");
  });

  it("keeps the children of unknown components", () => {
    expect(convert(`<Custom prop={1}>\n\n## Heading\n\nText.\n\n</Custom>\n\n<Empty />`)).toBe(
      "## Heading\n\nText.",
    );
  });
});
