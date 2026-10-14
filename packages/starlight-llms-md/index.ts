import type { StarlightPlugin } from '@astrojs/starlight/types';
import { type StarlightLlmsMdUserConfig, parseConfig } from './libs/config';
import { vitePluginStarlightLlmsMd } from './libs/vite';

export type { StarlightLlmsMdUserConfig } from './libs/config';

/**
 * Generates an llms.txt index and a clean markdown copy of every page,
 * following https://llmstxt.org/.
 */
export default function starlightLlmsMd(userConfig: StarlightLlmsMdUserConfig = {}): StarlightPlugin {
	const config = parseConfig(userConfig);

	return {
		name: 'starlight-llms-md',
		hooks: {
			'config:setup'({ addIntegration, config: starlightConfig, astroConfig, logger }) {
				if (!astroConfig.site) {
					logger.warn('`site` is not set in your Astro config; llms.txt will contain relative links.');
				}

				const title =
					typeof starlightConfig.title === 'string'
						? starlightConfig.title
						: (starlightConfig.title[starlightConfig.defaultLocale ?? 'root'] ??
							Object.values(starlightConfig.title)[0] ??
							'Documentation');

				addIntegration({
					name: 'starlight-llms-md-integration',
					hooks: {
						'astro:config:setup'({ injectRoute, updateConfig }) {
							const routes = 'starlight-llms-md/routes';

							injectRoute({ pattern: '/llms.txt', entrypoint: `${routes}/llms.txt.ts`, prerender: true });
							if (config.full) {
								injectRoute({ pattern: '/llms-full.txt', entrypoint: `${routes}/llms-full.txt.ts`, prerender: true });
							}
							injectRoute({ pattern: '/[...slug].md', entrypoint: `${routes}/page.md.ts`, prerender: true });
							if (config.indexMd) {
								injectRoute({ pattern: '/[...slug]/index.md', entrypoint: `${routes}/index.md.ts`, prerender: true });
							}

							updateConfig({
								vite: {
									plugins: [
										vitePluginStarlightLlmsMd({
											...config,
											title,
											description: config.description ?? starlightConfig.description,
											trailingSlash: astroConfig.trailingSlash !== 'never',
										}),
									],
								},
							});
						},
					},
				});
			},
		},
	};
}
