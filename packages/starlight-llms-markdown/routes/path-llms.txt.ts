import type { APIRoute, GetStaticPaths } from "astro";
import {
  config,
  getDocs,
  getListedDocs,
  renderDoc,
  textResponse,
  type DocEntry,
} from "../libs/docs";
import { buildLlmsTxt, getDirs } from "../libs/llms";

type Props = { dir: string } | { doc: DocEntry };

// An llms.txt at every path below the root: for a directory (e.g. /guides/llms.txt)
// an index of the pages under it, for any other page (e.g. /guides/example/llms.txt)
// that page's markdown.
export const getStaticPaths = (async () => {
  const dirs = getDirs(await getListedDocs());
  const paths: { params: { path: string }; props: Props }[] = [];
  if (config.sectionIndexes) {
    paths.push(...dirs.map((dir) => ({ params: { path: dir }, props: { dir } })));
  }
  if (config.pageLlmsTxt) {
    const taken = new Set(config.sectionIndexes ? dirs : []);
    for (const doc of await getDocs()) {
      if (doc.id === "index" || taken.has(doc.id)) continue;
      paths.push({ params: { path: doc.id }, props: { doc } });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props, site }) =>
  "dir" in props
    ? textResponse(buildLlmsTxt(await getListedDocs(), site, props.dir))
    : textResponse(renderDoc(props.doc, site));
