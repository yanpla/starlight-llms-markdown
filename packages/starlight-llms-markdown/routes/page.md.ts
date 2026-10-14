import type { APIRoute, GetStaticPaths } from "astro";
import { getDocs, renderDoc, textResponse, type DocEntry } from "../libs/docs";

// Markdown version of every page at /<slug>.md, e.g. /guides/example.md.
// The homepage is served at /index.md by index.md.ts instead.
export const getStaticPaths = (async () => {
  const docs = await getDocs();
  return docs
    .filter((doc) => doc.id !== "index")
    .map((doc) => ({ params: { slug: doc.id }, props: { doc } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ doc: DocEntry }> = ({ props, site }) =>
  textResponse(renderDoc(props.doc, site), "text/markdown");
