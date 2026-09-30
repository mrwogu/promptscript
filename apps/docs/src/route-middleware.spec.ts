import { describe, expect, it, vi } from 'vitest';

vi.mock('@astrojs/starlight/route-data', () => ({
  defineRouteMiddleware: (fn: unknown) => fn,
}));

const { onRequest } = await import('./route-middleware');

interface TestRoute {
  entry: { id: string; data: { title: string; description?: string; lastUpdated?: boolean } };
  sidebar: unknown[];
  head: { tag: string; attrs?: Record<string, string>; content?: string }[];
  editUrl?: URL;
  lastUpdated?: Date;
  pagination?: { prev?: unknown; next?: unknown };
}

function run(pathname: string, id: string): TestRoute {
  const route: TestRoute = {
    entry: { id, data: { title: 'Page', description: 'About' } },
    sidebar: [
      {
        type: 'group',
        label: 'Start',
        entries: [{ type: 'link', label: 'Page', isCurrent: true }],
      },
      { type: 'group', label: 'Reference', entries: [] },
    ],
    head: [],
    editUrl: new URL('https://github.com/mrwogu/promptscript/edit/main/docs/x.md'),
  };
  const handler = onRequest as unknown as (context: unknown) => void;
  handler({
    locals: { starlightRoute: route },
    url: new URL(pathname, 'https://getpromptscript.dev'),
  });
  return route;
}

describe('route middleware', () => {
  it('filters the sidebar and adds Markdown link, date and JSON-LD to docs pages', () => {
    const route = run('/tutorial/', 'tutorial');

    expect(route.sidebar).toHaveLength(1);
    expect(route.pagination).toEqual({ prev: undefined, next: undefined });
    expect(route.head[0].attrs).toEqual({
      rel: 'alternate',
      type: 'text/markdown',
      href: 'https://getpromptscript.dev/tutorial/index.md',
    });
    expect(route.lastUpdated).toBeInstanceOf(Date);
    const graph = JSON.parse(route.head[1].content ?? '')['@graph'];
    expect(graph[1].itemListElement.map((crumb: { name: string }) => crumb.name)).toEqual([
      'PromptScript',
      'Get Started',
      'Page',
    ]);
  });

  it('leaves the homepage and 404 page without page structured data', () => {
    expect(run('/', 'index').head).toEqual([]);
    expect(run('/404/', '404').head).toEqual([]);
  });

  it('drops the edit link on generated API pages', () => {
    expect(run('/api-reference/core/', 'api-reference/core').editUrl).toBeUndefined();
  });
});
