# starlight-llms-md

A [Starlight](https://starlight.astro.build) plugin that makes your docs readable by LLMs, following the [llms.txt standard](https://llmstxt.org/).

For every site it generates:

| URL | Contents |
| --- | --- |
| `/llms.txt` | Index in the llmstxt.org format: H1 title, blockquote summary, H2 sections linking each page's markdown |
| `/<slug>.md` | Clean markdown of each page, e.g. `/guides/install.md` |
| `/<slug>/index.md` | Same markdown at the exact path llmstxt.org gives for URLs ending in `/` (disable with `indexMd: false`) |
| `/llms-full.txt` | Every page in one file, linked from the `## Optional` section (disable with `full: false`) |

New pages are picked up automatically. Drafts are skipped, and pages with no body (such as a splash homepage) are not listed in `llms.txt`.

## Install

```sh
npm install starlight-llms-md
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsMd from 'starlight-llms-md';

export default defineConfig({
  site: 'https://example.com', // needed for absolute links in llms.txt
  integrations: [
    starlight({
      title: 'My Docs',
      description: 'Used as the llms.txt summary.',
      plugins: [starlightLlmsMd()],
    }),
  ],
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `description` | `string` | Starlight's `description` | Blockquote summary at the top of `llms.txt` |
| `details` | `string` | — | Extra markdown after the summary. No headings allowed (the spec reserves them for link sections) |
| `exclude` | `string[]` | `[]` | Page ids to leave out, e.g. `['internal/**']`. `*` matches within a path segment, `**` across segments |
| `sectionLabels` | `Record<string, string>` | `{}` | Headings for top-level directories, e.g. `{ guides: 'How-to guides' }` |
| `rootSectionLabel` | `string` | `'Docs'` | Heading for pages not inside a directory |
| `indexMd` | `boolean` | `true` | Also emit `/<slug>/index.md` |
| `full` | `boolean` | `true` | Emit `/llms-full.txt` |
| `optionalLinks` | `{ title, url, description? }[]` | `[]` | Extra links for the `## Optional` section. Paths starting with `/` get the site `base` applied |

## Limitations

- MDX pages are output as their source, so component tags appear as-is rather than rendered.
- Multilingual sites get every locale listed together; there is no per-locale `llms.txt` yet.

## License

MIT
