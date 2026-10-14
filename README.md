# starlight-llms-markdown

A [Starlight](https://starlight.astro.build) plugin that makes your docs readable by LLMs, following the [llms.txt standard](https://llmstxt.org/).

On build it generates:

| File               | Contents                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `/llms.txt`        | Index of every page: H1 title, blockquote summary, then H2 sections of `- [Title](url): description` links |
| `/<slug>.md`       | Clean markdown version of each page, e.g. `/guides/example.md`                                             |
| `/<slug>/index.md` | The same markdown at the exact path llmstxt.org specifies for URLs ending in `/`                           |
| `/llms-full.txt`   | Every page in one file, linked from the `## Optional` section of `llms.txt`                                |

New pages are picked up automatically. Drafts are skipped.

## Install

```sh
npm install starlight-llms-markdown
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsMarkdown from "starlight-llms-markdown";

export default defineConfig({
  site: "https://example.com", // needed for absolute links in llms.txt
  integrations: [
    starlight({
      title: "My Docs",
      description: "Shown as the summary in llms.txt.",
      plugins: [starlightLlmsMarkdown()],
    }),
  ],
});
```

## Options

| Option             | Type                             | Default                   | Description                                                                                       |
| ------------------ | -------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `description`      | `string`                         | Starlight's `description` | Blockquote summary at the top of `llms.txt`                                                       |
| `details`          | `string`                         | —                         | Extra markdown after the summary. Must not contain headings                                       |
| `exclude`          | `string[]`                       | `[]`                      | Page ids to leave out, e.g. `['internal/**']`. `*` matches within a segment, `**` across segments |
| `sectionLabels`    | `Record<string, string>`         | `{}`                      | Heading per top-level directory, e.g. `{ guides: 'How-to guides' }`                               |
| `rootSectionLabel` | `string`                         | `'Docs'`                  | Heading for pages not inside a directory                                                          |
| `indexMd`          | `boolean`                        | `true`                    | Also emit `/<slug>/index.md`                                                                      |
| `full`             | `boolean`                        | `true`                    | Emit `/llms-full.txt`                                                                             |
| `optionalLinks`    | `{ title, url, description? }[]` | `[]`                      | Extra links for the `## Optional` section                                                         |

## Notes

- Pages with an empty body (such as a splash homepage with only a hero) still get a `.md` file but are left out of `llms.txt` and `llms-full.txt`.
- `.mdx` pages are converted to plain markdown: imports, exports and `{expressions}` are removed, Starlight's built-in components (`Aside`, `Tabs`, `Steps`, `Card`, `LinkCard`, `FileTree`, `Code`, `Badge`, ...) become their markdown equivalent, and other components are replaced by their content.
- `base` and `trailingSlash` from your Astro config are respected.
- Multilingual sites currently get every locale listed together in one `llms.txt`.

## License

MIT

## Development

This repo is an npm workspace:

- `packages/starlight-llms-markdown`: the plugin
- `playground`: a Starlight site that uses it

```sh
npm install
npm run dev     # playground dev server
npm run build   # build the playground; output in playground/dist
npm run check   # astro check
```
