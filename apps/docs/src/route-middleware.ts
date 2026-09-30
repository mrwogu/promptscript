import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { findActiveTab, sidebarForTab } from './nav';

// Show only the sidebar groups of the active header tab.
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const tab = findActiveTab(route.sidebar, context.url.pathname);
  route.sidebar = sidebarForTab(route.sidebar, tab);
});
