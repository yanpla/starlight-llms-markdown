import type { APIRoute } from "astro";
import {
  absolute,
  config,
  getListedDocs,
  markdownPath,
  sectionLabel,
  textResponse,
  withBase,
  type DocEntry,
} from "../libs/docs";

// Site index in the https://llmstxt.org/ format: H1 title, blockquote summary,
// optional details, then H2 sections of `- [name](url): notes` links.
export const GET: APIRoute = async ({ site }) => {
  const docs = await getListedDocs();

  // Group pages by their top-level directory; root-level pages come first.
  const sections = new Map<string | undefined, DocEntry[]>([[undefined, []]]);
  for (const doc of docs) {
    const dir = doc.id.includes("/") ? doc.id.split("/")[0] : undefined;
    sections.set(dir, [...(sections.get(dir) ?? []), doc]);
  }

  const lines = [`# ${config.title}`, ""];
  if (config.description) lines.push(`> ${config.description}`, "");
  if (config.details) lines.push(config.details.trim(), "");

  for (const [dir, entries] of sections) {
    if (!entries.length) continue;
    lines.push(`## ${sectionLabel(dir)}`, "");
    for (const doc of entries) {
      const notes = doc.data.description ? `: ${doc.data.description}` : "";
      lines.push(`- [${doc.data.title}](${absolute(markdownPath(doc), site)})${notes}`);
    }
    lines.push("");
  }

  // "Optional" is the spec's section for links an agent can skip when context is short.
  const optional = [...config.optionalLinks];
  if (config.full) {
    optional.unshift({
      title: "Full documentation",
      url: "/llms-full.txt",
      description: "Every page above in one file",
    });
  }
  if (optional.length) {
    lines.push("## Optional", "");
    for (const link of optional) {
      const url = absolute(link.url.startsWith("/") ? withBase(link.url) : link.url, site);
      lines.push(`- [${link.title}](${url})${link.description ? `: ${link.description}` : ""}`);
    }
    lines.push("");
  }

  return textResponse(lines.join("\n"));
};
