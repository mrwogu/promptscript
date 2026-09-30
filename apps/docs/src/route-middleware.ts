import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { markdownUrl } from './llms';
import { gitLastModified } from './plugins/git-lastmod.mjs';
import { findActiveTab, paginationIn, sidebarForTab } from './nav';
import { pageJsonLd, type Crumb } from './seo';
import { SITE } from './site.mjs';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const { pathname } = context.url;

  // Show only the sidebar groups of the active header tab.
  const tab = findActiveTab(route.sidebar, pathname);
  route.sidebar = sidebarForTab(route.sidebar, tab);
  // Previous/next links would otherwise jump into another tab.
  if (tab?.groups) route.pagination = paginationIn(route.sidebar) as typeof route.pagination;

  // TypeDoc pages are generated in CI, there is no source file to edit.
  if (route.entry.id.startsWith('api-reference')) route.editUrl = undefined;

  // The homepage sets its own structured data, the 404 page gets none.
  if (pathname === '/' || route.entry.id === '404') return;
  const modified = gitLastModified().get(pathname);
  if (modified && route.entry.data.lastUpdated !== false) route.lastUpdated = new Date(modified);
  const url = new URL(pathname, SITE).href;
  const crumbs: Crumb[] = [{ name: 'PromptScript', url: `${SITE}/` }];
  if (tab && !tab.external && tab.href !== pathname) {
    crumbs.push({ name: tab.label, url: new URL(tab.href, SITE).href });
  }
  crumbs.push({ name: route.entry.data.title, url });
  route.head.push(
    {
      tag: 'link',
      attrs: { rel: 'alternate', type: 'text/markdown', href: markdownUrl(route.entry.id) },
    },
    pageJsonLd(
      {
        title: route.entry.data.title,
        description: route.entry.data.description,
        url,
        dateModified: route.lastUpdated,
      },
      crumbs
    )
  );
});
