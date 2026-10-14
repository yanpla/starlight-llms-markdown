import type { ViteUserConfig } from "astro";
import type { ResolvedConfig } from "./config";

const moduleId = "virtual:starlight-llms-markdown/config";
const resolvedModuleId = `\0${moduleId}`;

type VitePlugin = NonNullable<ViteUserConfig["plugins"]>[number];

/** Exposes the resolved plugin config to the injected routes. */
export function vitePluginStarlightLlmsMarkdown(config: ResolvedConfig): VitePlugin {
  return {
    name: "vite-plugin-starlight-llms-markdown",
    resolveId(id) {
      if (id === moduleId) return resolvedModuleId;
    },
    load(id) {
      if (id === resolvedModuleId) return `export default ${JSON.stringify(config)};`;
    },
  };
}
