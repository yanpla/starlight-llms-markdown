import type { APIRoute } from 'astro';
import { config, getListedDocs, renderDoc, textResponse } from '../libs/docs';

// Every listed page concatenated into one file.
export const GET: APIRoute = async ({ site }) => {
	const docs = await getListedDocs();
	const header = [`# ${config.title}`, config.description && `> ${config.description}`].filter(Boolean).join('\n\n');
	return textResponse([`${header}\n`, ...docs.map((doc) => renderDoc(doc, site))].join('\n---\n\n'));
};
