import { describe, expect, it } from 'vitest';
import {
  llmsFull,
  llmsIndex,
  llmsSections,
  markdownUrl,
  pageMarkdown,
  type DocPage,
  type SidebarItem,
} from './llms';

const page = (id: string, extra: Partial<DocPage> = {}): DocPage => ({
  id,
  body: `# ${id}\n\nBody of ${id}.`,
  filePath: `../../docs/${id}.md`,
  data: { title: `Title ${id}`, description: `About ${id}` },
  ...extra,
});

const SIDEBAR: SidebarItem[] = [
  { label: 'Start', items: [{ label: 'Intro', slug: 'getting-started' }] },
  {
    label: 'Targets',
    items: [{ autogenerate: { directory: 'reference/formatters' } }],
  },
  {
    label: 'Reference',
    items: [
      { label: 'CLI', items: [{ label: 'Commands', slug: 'reference/cli' }] },
      { label: 'API', link: '/api-reference/' },
    ],
  },
];

describe('markdownUrl', () => {
  it('points at the index.md next to each HTML page', () => {
    expect(markdownUrl('guides/ci')).toBe('https://getpromptscript.dev/guides/ci/index.md');
    expect(markdownUrl('index')).toBe('https://getpromptscript.dev/index.md');
  });
});

describe('pageMarkdown', () => {
  it('rewrites relative doc links to absolute Markdown URLs and keeps the hash', () => {
    const source = page('guides/ci', {
      body: '# CI\n\nSee [config](../reference/config.md#targets) and [faq](faq.md).',
    });

    expect(pageMarkdown(source)).toBe(
      '# CI\n\nSee [config](https://getpromptscript.dev/reference/config/index.md#targets) and [faq](https://getpromptscript.dev/guides/faq/index.md).'
    );
  });

  it('keeps external, absolute and outside-docs links usable', () => {
    const source = page('guides/ci', {
      body: '# CI\n\n[a](https://x.dev/a.md) [b](/b.md) [c](../../CONTRIBUTING.md)',
    });

    expect(pageMarkdown(source)).toBe(
      '# CI\n\n[a](https://x.dev/a.md) [b](/b.md) [c](https://github.com/mrwogu/promptscript/blob/main/CONTRIBUTING.md)'
    );
  });

  it('adds the title as H1 when the body has none', () => {
    const source = page('guides/ci', { body: 'Just text.' });

    expect(pageMarkdown(source)).toBe('# Title guides/ci\n\nJust text.');
  });
});

describe('llmsSections', () => {
  const pages = [
    page('getting-started'),
    page('reference/cli'),
    page('reference/formatters/zed', { data: { title: 'Zed' } }),
    page('reference/formatters/claude', { data: { title: 'Claude', sidebar: { order: 1 } } }),
    page('reference/formatters/aider', { data: { title: 'Aider' } }),
    page('guides/hidden'),
    page('api-reference/core'),
    page('404'),
  ];

  it('follows the sidebar, sorts generated groups, and collects the rest', () => {
    const sections = llmsSections(pages, SIDEBAR);

    expect(sections.map((s) => [s.label, s.pages.map((p) => p.id)])).toEqual([
      ['Start', ['getting-started']],
      [
        'Targets',
        ['reference/formatters/claude', 'reference/formatters/aider', 'reference/formatters/zed'],
      ],
      ['Reference', ['reference/cli']],
      ['More', ['guides/hidden']],
    ]);
  });

  it('builds an index with descriptions and a full dump with every page', () => {
    const sections = llmsSections(pages, SIDEBAR);

    const index = llmsIndex(sections);
    const full = llmsFull(sections);

    expect(index).toContain(
      '- [Title getting-started](https://getpromptscript.dev/getting-started/index.md): About getting-started'
    );
    expect(index).toContain(
      '- [Zed](https://getpromptscript.dev/reference/formatters/zed/index.md)\n'
    );
    expect(index).toContain('## Optional');
    expect(full).toContain('Body of guides/hidden.');
    expect(full).not.toContain('api-reference');
  });
});
