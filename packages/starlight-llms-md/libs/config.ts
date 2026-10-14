export interface LlmsLink {
  /** Link text. */
  title: string;
  /** Absolute URL, or a path relative to the site root. */
  url: string;
  /** Optional notes shown after the link. */
  description?: string;
}

export interface StarlightLlmsMdUserConfig {
  /**
   * Summary shown as the blockquote at the top of llms.txt.
   * Defaults to Starlight's `description` option.
   */
  description?: string;
  /**
   * Extra markdown placed between the summary and the page lists in llms.txt.
   * Must not contain headings (llmstxt.org reserves them for the file lists).
   */
  details?: string;
  /**
   * Page ids to leave out of every output, e.g. `['index', 'internal/*']`.
   * `*` matches anything except `/`, `**` matches anything.
   * @default []
   */
  exclude?: string[];
  /**
   * Section headings for top-level directories, e.g. `{ guides: 'How-to guides' }`.
   * Unlisted directories get a title-cased version of their name.
   */
  sectionLabels?: Record<string, string>;
  /**
   * Heading for pages that are not inside a directory.
   * @default 'Docs'
   */
  rootSectionLabel?: string;
  /**
   * Also serve each page at `/<slug>/index.md`, the exact form llmstxt.org
   * gives for URLs ending in `/`. Pages are always served at `/<slug>.md`.
   * @default true
   */
  indexMd?: boolean;
  /**
   * Generate `/llms-full.txt` with every page concatenated, linked from
   * the `## Optional` section of llms.txt.
   * @default true
   */
  full?: boolean;
  /** Extra links for the `## Optional` section of llms.txt. */
  optionalLinks?: LlmsLink[];
}

export type StarlightLlmsMdConfig = Required<
  Omit<StarlightLlmsMdUserConfig, "description" | "details">
> &
  Pick<StarlightLlmsMdUserConfig, "description" | "details">;

export function parseConfig(userConfig: StarlightLlmsMdUserConfig): StarlightLlmsMdConfig {
  if (userConfig.details && /^#{1,6}\s/m.test(userConfig.details)) {
    throw new Error("[starlight-llms-md] `details` must not contain markdown headings.");
  }
  return {
    exclude: [],
    sectionLabels: {},
    rootSectionLabel: "Docs",
    indexMd: true,
    full: true,
    optionalLinks: [],
    ...userConfig,
  };
}

/** Config exposed to the routes through the virtual module. */
export interface ResolvedConfig extends StarlightLlmsMdConfig {
  title: string;
  trailingSlash: boolean;
}
