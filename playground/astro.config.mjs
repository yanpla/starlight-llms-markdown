// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsMarkdown from "starlight-llms-markdown";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    starlight({
      title: "Playground",
      description: "Test site for starlight-llms-markdown.",
      plugins: [
        starlightLlmsMarkdown({
          details: "This site exists to exercise the plugin.",
          exclude: ["guides/secret"],
          sectionLabels: { guides: "How-to guides" },
          optionalLinks: [
            { title: "Astro docs", url: "https://docs.astro.build", description: "Upstream docs" },
          ],
        }),
      ],
    }),
  ],
});
