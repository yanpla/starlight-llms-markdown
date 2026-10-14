import type { APIRoute, GetStaticPaths } from "astro";
import { getDocs, renderDoc, textResponse, type DocEntry } from "../libs/docs";

// Markdown version of every page at /<slug>/index.md, the form llmstxt.org
// gives for URLs ending in `/`. The homepage becomes /index.md.
export const getStaticPaths = (async () => {
  const docs = await getDocs();
  return docs.map((doc) => ({
    params: { slug: doc.id === "index" ? undefined : doc.id },
    props: { doc },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ doc: DocEntry }> = ({ props, site }) =>
  textResponse(renderDoc(props.doc, site), "text/markdown");
