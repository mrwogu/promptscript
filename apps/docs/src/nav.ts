// Top-level sections shown as tabs under the header. Each tab owns some
// sidebar groups; on a page inside a tab the sidebar shows only those groups.

export interface NavTab {
  label: string;
  href: string;
  /** Sidebar group labels from astro.config.mjs that belong to this tab. */
  groups?: readonly string[];
  /** Pages outside the sidebar that still belong to this tab. */
  pathPrefix?: string;
  external?: boolean;
}

export const NAV_TABS: readonly NavTab[] = [
  { label: 'Get Started', href: '/getting-started/', groups: ['Start', 'Migrate'] },
  {
    label: 'Guides',
    href: '/features/',
    groups: ['Core Features', 'Skills', 'Compose and Reuse', 'Teams and Enterprise'],
  },
  { label: 'Targets', href: '/reference/formatters/', groups: ['Targets'] },
  { label: 'Reference', href: '/reference/', groups: ['Reference'] },
  { label: 'Examples', href: '/examples/', groups: ['Examples'] },
  {
    label: 'Contributing',
    href: '/guides/formatter-architecture/',
    groups: ['Contributing'],
    pathPrefix: '/api-reference/',
  },
  { label: 'Playground', href: '/playground/' },
  {
    label: 'Changelog',
    href: 'https://github.com/mrwogu/promptscript/releases',
    external: true,
  },
];

/** The part of Starlight's sidebar entry shape this module needs. */
export interface SidebarNode {
  type: 'link' | 'group';
  label: string;
  isCurrent?: boolean;
  entries?: readonly SidebarNode[];
}

function containsCurrent(node: SidebarNode): boolean {
  if (node.type === 'link') return node.isCurrent === true;
  return (node.entries ?? []).some(containsCurrent);
}

/** Tab of the current page, by its sidebar group or by path for pages outside the sidebar. */
export function findActiveTab(
  sidebar: readonly SidebarNode[],
  pathname: string
): NavTab | undefined {
  const currentGroup = sidebar.find((node) => node.type === 'group' && containsCurrent(node));
  if (currentGroup) {
    return NAV_TABS.find((tab) => tab.groups?.includes(currentGroup.label));
  }
  return NAV_TABS.find((tab) => tab.pathPrefix && pathname.startsWith(tab.pathPrefix));
}

/** Sidebar limited to the groups of one tab. Without a tab the sidebar stays as is. */
export function sidebarForTab<T extends SidebarNode>(
  sidebar: readonly T[],
  tab: NavTab | undefined
): T[] {
  if (!tab?.groups) return [...sidebar];
  return sidebar.filter((node) => node.type === 'group' && tab.groups?.includes(node.label));
}

/** Previous and next page inside the given sidebar, so paging stays inside one tab. */
export function paginationIn<T extends SidebarNode>(sidebar: readonly T[]): { prev?: T; next?: T } {
  const flat = (node: SidebarNode): SidebarNode[] =>
    node.type === 'link' ? [node] : (node.entries ?? []).flatMap(flat);
  const links = sidebar.flatMap(flat) as T[];
  const index = links.findIndex((link) => link.isCurrent);
  if (index === -1) return {};
  return { prev: links[index - 1], next: links[index + 1] };
}
