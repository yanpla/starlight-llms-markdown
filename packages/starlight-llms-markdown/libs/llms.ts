import type { LlmsLink } from "./config";
import { absolute, config, markdownPath, sectionLabel, withBase, type DocEntry } from "./docs";

/** Directories that contain listed docs at any depth, e.g. `guides` and `guides/advanced`. */
export function getDirs(docs: DocEntry[]): string[] {
  const dirs = new Set<string>();
  for (const doc of docs) {
    const segments = doc.id.split("/").slice(0, -1);
    segments.forEach((_, i) => dirs.add(segments.slice(0, i + 1).join("/")));
  }
  return [...dirs].sort();
}

/** Public path of a directory's llms.txt, e.g. `/guides/llms.txt`. */
export function llmsTxtPath(dir?: string): string {
  return withBase(dir ? `/${dir}/llms.txt` : "/llms.txt");
}

/**
 * Index in the https://llmstxt.org/ format: H1 title, blockquote summary,
 * optional details, then H2 sections of `- [name](url): notes` links.
 * Without `dir` it covers the whole site; with `dir` only the pages under it.
 */
export function buildLlmsTxt(allDocs: DocEntry[], site: URL | undefined, dir?: string): string {
  const docs = dir
    ? allDocs.filter((doc) => doc.id === dir || doc.id.startsWith(`${dir}/`))
    : allDocs;

  // Group pages by the next directory level; pages directly in `dir` come first.
  // A directory's own index page (id `guides` for guides/index.md) goes with that directory.
  const prefix = dir ? `${dir}/` : "";
  const dirs = new Set(getDirs(docs));
  const sections = new Map<string | undefined, DocEntry[]>([[dir, []]]);
  for (const doc of docs) {
    const child = doc.id === dir ? undefined : prefix + doc.id.slice(prefix.length).split("/")[0];
    const key = child && dirs.has(child) ? child : dir;
    sections.set(key, [...(sections.get(key) ?? []), doc]);
  }

  const lines: string[] = [];
  if (dir) {
    // The directory's own index page (e.g. guides/index.md has id `guides`) provides the summary.
    const description = docs.find((doc) => doc.id === dir)?.data.description;
    lines.push(`# ${config.title}: ${sectionLabel(dir)}`, "");
    if (description) lines.push(`> ${description}`, "");
  } else {
    lines.push(`# ${config.title}`, "");
    if (config.description) lines.push(`> ${config.description}`, "");
    if (config.details) lines.push(config.details.trim(), "");
  }

  for (const [key, entries] of sections) {
    if (!entries.length) continue;
    lines.push(`## ${sectionLabel(key)}`, "");
    for (const doc of entries) {
      const notes = doc.data.description ? `: ${doc.data.description}` : "";
      lines.push(`- [${doc.data.title}](${absolute(markdownPath(doc), site)})${notes}`);
    }
    lines.push("");
  }

  // "Optional" is the spec's section for links an agent can skip when context is short.
  const optional: LlmsLink[] = [];
  if (dir) {
    optional.push({
      title: config.title,
      url: "/llms.txt",
      description: "Index of the whole site",
    });
  } else {
    if (config.full) {
      optional.push({
        title: "Full documentation",
        url: "/llms-full.txt",
        description: "Every page above in one file",
      });
    }
    if (config.sectionIndexes) {
      for (const sub of getDirs(docs).filter((d) => !d.includes("/"))) {
        optional.push({
          title: sectionLabel(sub),
          url: `/${sub}/llms.txt`,
          description: "Index of this section only",
        });
      }
    }
    optional.push(...config.optionalLinks);
  }
  if (optional.length) {
    lines.push("## Optional", "");
    for (const link of optional) {
      const url = absolute(link.url.startsWith("/") ? withBase(link.url) : link.url, site);
      lines.push(`- [${link.title}](${url})${link.description ? `: ${link.description}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
