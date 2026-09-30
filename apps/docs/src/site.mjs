// Shared by astro.config.mjs and the llms.txt / Markdown endpoints.
export const SITE = 'https://getpromptscript.dev';

// Markdown sources, relative to apps/docs. Entry `filePath`s start with it.
export const DOCS_BASE = '../../docs';

// Top-level groups map to the header tabs in src/nav.ts.
export const SIDEBAR = [
  {
    label: 'Start',
    items: [
      { label: 'Getting Started', slug: 'getting-started' },
      { label: 'Tutorial', slug: 'tutorial' },
      { label: 'Real-Life Checkout Service', slug: 'examples/real-life-checkout-service' },
      { label: 'Why PromptScript', slug: 'guides/vs-manual' },
      { label: 'FAQ', slug: 'guides/faq' },
    ],
  },
  {
    label: 'Migrate',
    items: [
      { label: 'Import Existing Instructions', slug: 'guides/import' },
      { label: 'Migration Guide', slug: 'guides/migration' },
      { label: 'AI-Assisted Migration', slug: 'guides/ai-migration-best-practices' },
      { label: 'Upgrade 1.15 to 1.16', slug: 'guides/upgrade-1-15-to-1-16' },
    ],
  },
  {
    label: 'Agent Platform',
    items: [
      { label: 'Overview', slug: 'features' },
      { label: 'Agents', slug: 'features/agents' },
      { label: 'Skills and Resources', slug: 'features/skills' },
      { label: 'MCP Servers and Plugins', slug: 'features/integrations' },
      { label: 'Hooks and Workflows', slug: 'features/automation' },
      { label: 'Target Output Families', slug: 'features/target-platforms' },
      { label: 'AI Tool Hooks', slug: 'guides/hooks' },
      { label: 'Examples (Few-Shot)', slug: 'guides/examples' },
    ],
  },
  {
    label: 'Skills',
    collapsed: true,
    items: [
      { label: 'Building Skills', slug: 'guides/building-skills' },
      { label: 'Skill Composition', slug: 'guides/skill-composition' },
      { label: 'Skill Overlays', slug: 'guides/skill-overlays' },
      { label: 'Local Skills', slug: 'guides/local-skills' },
      { label: 'Skill Contracts', slug: 'guides/skill-contracts' },
      { label: 'Shared Resources', slug: 'guides/shared-resources' },
      { label: 'Using npx skills', slug: 'guides/npx-skills' },
    ],
  },
  {
    label: 'Compose and Reuse',
    collapsed: true,
    items: [
      { label: 'Overview', slug: 'guides' },
      { label: 'Inheritance', slug: 'guides/inheritance' },
      { label: 'Multi-File Organization', slug: 'guides/multi-file' },
      { label: 'Markdown Imports', slug: 'guides/markdown-imports' },
      { label: 'Build Your Registry', slug: 'guides/registry' },
    ],
  },
  {
    label: 'Scale to Organization',
    collapsed: true,
    items: [
      { label: 'Enterprise Setup', slug: 'guides/enterprise' },
      { label: 'Policy Engine', slug: 'guides/policy-engine' },
      { label: 'Guard Dependencies', slug: 'guides/guard-dependencies' },
      { label: 'Security', slug: 'guides/security' },
      { label: 'CI/CD Integration', slug: 'guides/ci' },
      { label: 'Docker', slug: 'guides/docker' },
      { label: 'User Configuration', slug: 'guides/user-config' },
    ],
  },
  {
    label: 'Targets',
    collapsed: true,
    items: [{ autogenerate: { directory: 'reference/formatters' } }],
  },
  {
    label: 'Reference',
    collapsed: true,
    items: [
      { label: 'Overview', slug: 'reference' },
      {
        label: 'Language',
        items: [
          { label: 'Overview', slug: 'reference/language' },
          { label: 'File Anatomy', slug: 'reference/language/file-anatomy' },
          {
            label: 'Values and Block Bodies',
            slug: 'reference/language/values-and-block-bodies',
          },
          { label: 'Composition and Precedence', slug: 'reference/language/composition' },
          { label: 'Execution Order', slug: 'reference/language/execution-order' },
          {
            label: 'Merge and Replacement',
            slug: 'reference/language/merge-and-replacement',
          },
          { label: 'Section Headers', slug: 'reference/language/section-headers' },
          {
            label: 'Versions and Diagnostics',
            slug: 'reference/language/versions-and-diagnostics',
          },
          { label: 'Block Shapes', slug: 'reference/block-shapes' },
        ],
      },
      {
        label: 'CLI',
        items: [
          { label: 'Commands', slug: 'reference/cli' },
          { label: 'Hook Management', slug: 'reference/cli/hooks' },
          { label: 'Hook Runtime', slug: 'reference/cli/hook' },
        ],
      },
      { label: 'Configuration', slug: 'reference/config' },
      { label: 'Model Catalog', slug: 'reference/models' },
      { label: 'Telemetry', slug: 'reference/telemetry' },
    ],
  },
  {
    label: 'Examples',
    collapsed: true,
    items: [
      { label: 'Overview', slug: 'examples' },
      { label: 'Minimal', slug: 'examples/minimal' },
      { label: 'Composition and Order', slug: 'examples/composition-and-order' },
      { label: 'Merge vs Replace', slug: 'examples/merge-vs-replace' },
      { label: 'Fix Block Shapes', slug: 'examples/fix-block-shapes' },
      { label: 'Custom Section Headers', slug: 'examples/custom-section-headers' },
      { label: 'Portable Hooks', slug: 'examples/portable-hooks' },
      { label: 'Migrate Factory Hooks', slug: 'examples/migrate-factory-hooks' },
      { label: 'Agent Platform', slug: 'examples/agent-platform' },
      { label: 'Agents', slug: 'examples/agents' },
      { label: 'Team Setup', slug: 'examples/team-setup' },
      { label: 'Enterprise', slug: 'examples/enterprise' },
      { label: 'Skills and Local', slug: 'examples/skills-and-local' },
      { label: 'Git Registry', slug: 'examples/git-registry' },
    ],
  },
  {
    label: 'Contributing',
    collapsed: true,
    items: [
      { label: 'API Reference', link: '/api-reference/' },
      { label: 'Formatter Architecture', slug: 'guides/formatter-architecture' },
      { label: 'Testing', slug: 'testing' },
      { label: 'Parity Testing', slug: 'testing/parity-testing' },
      { label: 'Feature Coverage', slug: 'testing/feature-coverage' },
    ],
  },
];
