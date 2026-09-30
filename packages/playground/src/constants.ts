/**
 * Playground constants.
 */

declare const __APP_VERSION__: string;

/** Version injected from @promptscript/cli package.json at build time */
export const VERSION = __APP_VERSION__;

export const GITHUB_URL = 'https://github.com/mrwogu/promptscript';

export const DOCS_URL = 'https://getpromptscript.dev/';

/** Same sections as the tabs in the docs header, so both sites feel like one. */
export const DOCS_LINKS = [
  { label: 'Get Started', href: `${DOCS_URL}getting-started/` },
  { label: 'Guides', href: `${DOCS_URL}features/` },
  { label: 'Targets', href: `${DOCS_URL}reference/formatters/` },
  { label: 'Reference', href: `${DOCS_URL}reference/` },
  { label: 'Examples', href: `${DOCS_URL}examples/` },
] as const;
