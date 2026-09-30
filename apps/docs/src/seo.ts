// Structured data (schema.org JSON-LD) for search engines and AI answer engines.
import { SITE } from './site.mjs';

export const SITE_DESCRIPTION =
  'Prompt-as-Code for Enterprise AI. Standardize, audit, and deploy instructions across any AI coding assistant.';

export interface HeadTag {
  tag: 'script';
  attrs: Record<string, string>;
  content: string;
}

export interface Crumb {
  name: string;
  url: string;
}

export interface ArticleInfo {
  title: string;
  description?: string;
  url: string;
  dateModified?: Date;
}

const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: 'PromptScript',
  url: `${SITE}/`,
  description: SITE_DESCRIPTION,
  inLanguage: 'en',
  publisher: {
    '@type': 'Organization',
    name: 'PromptScript',
    url: `${SITE}/`,
    logo: `${SITE}/assets/images/logo.svg`,
    sameAs: ['https://github.com/mrwogu/promptscript', 'https://www.npmjs.com/org/promptscript'],
  },
};

/** One JSON-LD script tag. `<` is escaped so page text can never close the tag. */
export function jsonLdTag(graph: readonly object[]): HeadTag {
  return {
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    content: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll(
      '<',
      String.raw`\u003c`
    ),
  };
}

export function homeJsonLd(version: string): HeadTag {
  return jsonLdTag([
    WEBSITE,
    {
      '@type': 'SoftwareApplication',
      name: 'PromptScript',
      description:
        'Compiler and CLI that turns .prs files into native instructions, skills, agents, MCP config, and hooks for 50 AI coding agents.',
      url: `${SITE}/`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'macOS, Linux, Windows',
      softwareVersion: version,
      license: 'https://opensource.org/licenses/MIT',
      downloadUrl: 'https://www.npmjs.com/package/@promptscript/cli',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      sameAs: ['https://github.com/mrwogu/promptscript'],
    },
  ]);
}

export function pageJsonLd(article: ArticleInfo, crumbs: readonly Crumb[]): HeadTag {
  return jsonLdTag([
    {
      '@type': 'TechArticle',
      headline: article.title,
      ...(article.description ? { description: article.description } : {}),
      url: article.url,
      ...(article.dateModified ? { dateModified: article.dateModified.toISOString() } : {}),
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: WEBSITE.publisher,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  ]);
}
