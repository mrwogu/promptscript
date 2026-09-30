import { describe, expect, it } from 'vitest';
import {
  cardsToMarkdown,
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

describe('cardsToMarkdown', () => {
  it('turns hub cards into a plain list of Markdown links', () => {
    const body = [
      '<div class="ref-list">',
      '',
      '<a href="registry/" class="ref-item">',
      '  <div class="ref-item__icon"><svg viewBox="0 0 24 24"><path d="M1"/></svg></div>',
      '  <div class="ref-item__content">',
      '    <h3>Registry</h3>',
      '    <p>Share configs.</p>',
      '  </div>',
      '</a>',
      '',
      '<a href="../features/" class="ref-item">',
      '  <h3>Features</h3>',
      '</a>',
      '',
      '</div>',
    ].join('\n');

    expect(cardsToMarkdown(body, 'guides').trim()).toBe(
      [
        '- [Registry](https://getpromptscript.dev/guides/registry/index.md): Share configs.',
        '- [Features](https://getpromptscript.dev/features/index.md)',
      ].join('\n')
    );
  });

  it('describes formatter cards by output file and tags', () => {
    const body = [
      '<a href="claude/" class="formatter-card">',
      '  <span class="formatter-card__name">Claude Code</span>',
      '  <code class="formatter-card__output">CLAUDE.md</code>',
      '  <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>',
      '  <span class="formatter-card__tag formatter-card__tag--yes">Agents</span>',
      '</a>',
    ].join('\n');

    expect(cardsToMarkdown(body, 'reference/formatters')).toBe(
      '- [Claude Code](https://getpromptscript.dev/reference/formatters/claude/index.md): `CLAUDE.md` - Skills, Agents'
    );
  });

  it('keeps the hash of a card link and unwraps HTML subtitles', () => {
    const body = [
      '<p class="subtitle">Compiles to <strong>50 targets</strong>.</p>',
      '',
      '<a href="../../features/x/#modes" class="ref-item"><h3>X</h3></a>',
    ].join('\n');

    expect(cardsToMarkdown(body, 'reference/formatters')).toBe(
      'Compiles to **50 targets**.\n\n- [X](https://getpromptscript.dev/features/x/index.md#modes)'
    );
  });

  it('drops demo terminals with all nested markup', () => {
    const body = [
      'Before.',
      '<!-- prettier-ignore -->',
      '<div class="init-demo" id="x">',
      '<div class="a">',
      'text',
      '</div>',
      '</div>',
      'After.',
    ].join('\n');

    expect(cardsToMarkdown(body, 'getting-started')).toBe('Before.\nAfter.');
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
