import type { APIRoute } from "astro";
import { getListedDocs, textResponse } from "../libs/docs";
import { buildLlmsTxt } from "../libs/llms";

// Site-wide index in the https://llmstxt.org/ format.
export const GET: APIRoute = async ({ site }) =>
  textResponse(buildLlmsTxt(await getListedDocs(), site));
