import { describe, expect, it } from 'vitest';
import { NAV_TABS, findActiveTab, sidebarForTab, type SidebarNode } from './nav';

function sidebar(currentLabel?: string): SidebarNode[] {
  const link = (label: string): SidebarNode => ({
    type: 'link',
    label,
    isCurrent: label === currentLabel,
  });
  return [
    { type: 'group', label: 'Start', entries: [link('Getting Started')] },
    { type: 'group', label: 'Migrate', entries: [link('Migration Guide')] },
    {
      type: 'group',
      label: 'Reference',
      entries: [link('Overview'), { type: 'group', label: 'CLI', entries: [link('Commands')] }],
    },
    { type: 'group', label: 'Contributing', entries: [link('Testing')] },
  ];
}

describe('findActiveTab', () => {
  it('finds the tab of the group holding the current page, also in nested groups', () => {
    expect(findActiveTab(sidebar('Migration Guide'), '/guides/migration/')?.label).toBe(
      'Get Started'
    );
    expect(findActiveTab(sidebar('Commands'), '/reference/cli/')?.label).toBe('Reference');
  });

  it('falls back to the path for pages outside the sidebar', () => {
    expect(findActiveTab(sidebar(), '/api-reference/core/src/')?.label).toBe('Contributing');
    expect(findActiveTab(sidebar(), '/')).toBeUndefined();
  });
});

describe('sidebarForTab', () => {
  it('keeps only the groups of the tab', () => {
    const tab = NAV_TABS.find((item) => item.label === 'Get Started');

    const labels = sidebarForTab(sidebar('Getting Started'), tab).map((node) => node.label);

    expect(labels).toEqual(['Start', 'Migrate']);
  });

  it('keeps the whole sidebar without a tab', () => {
    expect(sidebarForTab(sidebar(), undefined)).toHaveLength(4);
  });
});

describe('NAV_TABS', () => {
  it('assigns each sidebar group to one tab only', () => {
    const groups = NAV_TABS.flatMap((tab) => tab.groups ?? []);

    expect(new Set(groups).size).toBe(groups.length);
  });
});
