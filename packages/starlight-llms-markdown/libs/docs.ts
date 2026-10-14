import { getCollection, type CollectionEntry } from "astro:content";
import config from "virtual:starlight-llms-markdown/config";
import { mdxToPlainMarkdown } from "./mdx";

export type DocEntry = CollectionEntry<"docs">;

export { config };

function globToRegExp(glob: string): RegExp {
  const source = glob
    .split("**")
    .map((part) =>
      part
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*"),
    )
    .join(".*");
  return new RegExp(`^${source}$`);
}

const excluded = config.exclude.map(globToRegExp);

/** All published, non-excluded docs, sorted by id. */
export async function getDocs(): Promise<DocEntry[]> {
  const docs = await getCollection(
    "docs",
    ({ id, data }) => !data.draft && !excluded.some((re) => re.test(id)),
  );
  return docs.sort((a, b) => a.id.localeCompare(b.id));
}

/** Docs worth listing: those with an actual body (skips e.g. splash pages with only a hero). */
export async function getListedDocs(): Promise<DocEntry[]> {
  return (await getDocs()).filter((doc) => doc.body?.trim());
}

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

/** Public path of the HTML page, e.g. `/guides/example/`. */
export function pagePath(entry: DocEntry): string {
  if (entry.id === "index") return withBase("/");
  return withBase(`/${entry.id}${config.trailingSlash ? "/" : ""}`);
}

/** Path of the page's markdown version, e.g. `/guides/example.md`. */
export function markdownPath(entry: DocEntry): string {
  return withBase(entry.id === "index" ? "/index.md" : `/${entry.id}.md`);
}

/** Resolve a site-relative path (base already applied) or URL against `site`. */
export function absolute(pathOrUrl: string, site?: URL): string {
  return site ? new URL(pathOrUrl, site).href : pathOrUrl;
}

/** Render a doc as standalone markdown with a title header. */
export function renderDoc(entry: DocEntry, site?: URL): string {
  const { title, description } = entry.data;
  const parts = [`# ${title}`];
  if (description) parts.push(`> ${description}`);
  parts.push(`Source: ${absolute(pagePath(entry), site)}`);
  const body = entry.filePath?.endsWith(".mdx")
    ? mdxToPlainMarkdown(entry.body ?? "")
    : entry.body?.trim();
  if (body) parts.push(body);
  return parts.join("\n\n") + "\n";
}

export function sectionLabel(dir: string | undefined): string {
  if (!dir) return config.rootSectionLabel;
  return (
    config.sectionLabels[dir] ?? dir.charAt(0).toUpperCase() + dir.slice(1).replace(/[-_]/g, " ")
  );
}

export function textResponse(body: string, type = "text/plain"): Response {
  return new Response(body, { headers: { "Content-Type": `${type}; charset=utf-8` } });
}
