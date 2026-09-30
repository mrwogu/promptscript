import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  docIdFromEntry,
  remarkMkdocsCompat,
  rewriteDocLink,
  rewriteDocLinkFrom,
} from './remark-mkdocs-compat.mjs';

const DOCS = resolve(__dirname, '../../../../docs');

describe('docIdFromEntry', () => {
  it('maps index and README pages to their directory', () => {
    expect(docIdFromEntry('index.md')).toBe('index');
    expect(docIdFromEntry('guides/index.md')).toBe('guides');
    expect(docIdFromEntry('api-reference/core/src/README.md')).toBe('api-reference/core/src');
    expect(docIdFromEntry('reference/cli/hooks.md')).toBe('reference/cli/hooks');
  });
});

describe('rewriteDocLinkFrom', () => {
  it('resolves links from a docs-relative page path', () => {
    expect(rewriteDocLinkFrom('../reference/cli.md#deno', 'guides/ci.md')).toBe(
      '/reference/cli/#deno'
    );
    expect(rewriteDocLinkFrom('../../SECURITY.md', 'guides/ci.md')).toBe(
      'https://github.com/mrwogu/promptscript/blob/main/SECURITY.md'
    );
  });
});

describe('rewriteDocLink', () => {
  const from = resolve(DOCS, 'guides/inheritance.md');

  it('turns relative .md links into site URLs and keeps the hash', () => {
    expect(rewriteDocLink('../reference/config.md#models', from)).toBe('/reference/config/#models');
    expect(rewriteDocLink('index.md', from)).toBe('/guides/');
    expect(rewriteDocLink('../index.md', from)).toBe('/');
  });

  it('points links outside docs/ to GitHub', () => {
    expect(rewriteDocLink('../../README.md', from)).toBe(
      'https://github.com/mrwogu/promptscript/blob/main/README.md'
    );
  });

  it('leaves absolute, external and non-markdown links alone', () => {
    expect(rewriteDocLink('https://example.com/a.md', from)).toBe('https://example.com/a.md');
    expect(rewriteDocLink('/playground/', from)).toBe('/playground/');
    expect(rewriteDocLink('#local', from)).toBe('#local');
  });
});

describe('remarkMkdocsCompat', () => {
  it('drops the body H1, rewrites links and builds tabs', () => {
    // Arrange
    const link = { type: 'link', url: 'multi-file.md', children: [] };
    const tabs = {
      type: 'containerDirective',
      name: 'tabs',
      children: [
        {
          type: 'containerDirective',
          name: 'tab',
          children: [
            {
              type: 'paragraph',
              data: { directiveLabel: true },
              children: [{ type: 'text', value: 'npm' }],
            },
            { type: 'paragraph', children: [{ type: 'text', value: 'body' }] },
          ],
        },
      ],
    };
    const tree = {
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Title' }] },
        { type: 'paragraph', children: [link] },
        tabs,
      ],
    };
    const file = {
      path: resolve(DOCS, 'guides/inheritance.md'),
      data: { astro: { frontmatter: {} } },
    };

    // Act
    remarkMkdocsCompat()(tree, file);

    // Assert
    expect(tree.children.some((c) => c.type === 'heading')).toBe(false);
    expect(link.url).toBe('/guides/multi-file/');
    expect(file.data.astro.frontmatter).toEqual({ slug: 'guides/inheritance' });
    const html = tabs.children.map((c) => (c as { data: { hName: string } }).data.hName);
    expect(html).toEqual(['input', 'label', 'div']);
  });
});
