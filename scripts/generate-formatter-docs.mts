/**
 * Generate formatter documentation sections from source code metadata.
 *
 * Reads canonical target capabilities for output paths, feature flags,
 * skill paths, and hooks. Writes generated sections into doc files using
 * <!-- generated:start --> / <!-- generated:end --> markers.
 *
 * Usage: pnpm docs:formatters [--check]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FEATURE_MATRIX, type ToolName } from '@promptscript/formatters';
import {
  TARGET_CAPABILITIES,
  TARGET_DEFINITIONS,
  type TargetResourceCapability,
} from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs', 'reference', 'formatters');
const FORMATTERS_SRC = join(ROOT, 'packages', 'formatters', 'src', 'formatters');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormatterInfo {
  name: string;
  displayName: string;
  tier: 'custom' | 'tier-1' | 'tier-2' | 'tier-3';
  outputPath: string;
  dotDir: string;
  skillBasePath: string | null;
  hasSkills: boolean;
  hasAgents: boolean;
  hasCommands: boolean;
  hasLocal: boolean;
  skillFileName: string;
  hasDedicatedPage: boolean;
  hookConfigPath: string | null;
  hookVersions: readonly string[];
  resources: readonly TargetResourceCapability[];
}

// ---------------------------------------------------------------------------
// Parse formatter metadata from source files
// ---------------------------------------------------------------------------

/**
 * Extract formatter config from a createSimpleMarkdownFormatter() call.
 * Returns null for custom formatters that don't use the factory.
 */
/**
 * Determine tier from index.ts comments (// Tier 1, // Tier 2, // Tier 3).
 * Extracts formatter names from the `from './xxx.js'` import paths which
 * match the actual source file names (e.g. 'github', 'opencode', 'codebuddy').
 */
function parseTiersFromIndex(indexSource: string): Record<string, FormatterInfo['tier']> {
  const tiers: Record<string, FormatterInfo['tier']> = {};
  let currentTier: FormatterInfo['tier'] = 'custom';

  for (const line of indexSource.split('\n')) {
    if (line.includes('// Tier 1')) currentTier = 'tier-1';
    else if (line.includes('// Tier 2')) currentTier = 'tier-2';
    else if (line.includes('// Tier 3')) currentTier = 'tier-3';

    // Match: from './github.js' or from './command-code.js'
    const fromMatch = line.match(/from\s+'\.\/([^.]+)\.js'/);
    if (fromMatch && line.includes('Formatter')) {
      tiers[fromMatch[1]] = currentTier;
    }
  }
  return tiers;
}

/** Display names for formatters that differ from auto-generated title case. */
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  github: 'GitHub Copilot',
  claude: 'Claude Code',
  opencode: 'OpenCode',
  antigravity: 'Antigravity',
  factory: 'Factory AI',
  gemini: 'Gemini CLI',
  roo: 'Roo Code',
  kilo: 'Kilo Code',
  kiro: 'Kiro CLI',
  'command-code': 'Command Code',
  'mistral-vibe': 'Mistral Vibe',
  openhands: 'OpenHands',
  'qwen-code': 'Qwen Code',
  openclaw: 'OpenClaw',
  codebuddy: 'CodeBuddy',
  mcpjam: 'MCPJam',
  iflow: 'iFlow',
  forgecode: 'ForgeCode',
  hermes: 'Hermes Agent',
};

const DEDICATED_PAGES = new Set([
  'claude',
  'github',
  'cursor',
  'antigravity',
  'factory',
  'opencode',
  'gemini',
]);

function getHookMetadata(name: string): Pick<FormatterInfo, 'hookConfigPath' | 'hookVersions'> {
  const capability = TARGET_CAPABILITIES[name as keyof typeof TARGET_CAPABILITIES]?.hooks;
  return {
    hookConfigPath: capability?.configPath ?? null,
    hookVersions: capability?.nativeVersions ?? [],
  };
}

/**
 * Build the full formatter registry from canonical target metadata.
 */
function buildFormatterRegistry(): FormatterInfo[] {
  const indexSource = readFileSync(join(FORMATTERS_SRC, 'index.ts'), 'utf-8');
  const tiers = parseTiersFromIndex(indexSource);
  const formatters = Object.values(TARGET_DEFINITIONS).map((definition): FormatterInfo => {
    const name = definition.name;
    const displayName =
      DISPLAY_NAME_OVERRIDES[definition.name] ??
      definition.name
        .split('-')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
    const skillBasePath = definition.skillPath.basePath;
    const outputRoot = definition.outputPath.split('/')[0];
    // Placeholder fallback for AGENTS.md-only targets; retained for latent generic docs paths.
    const dotDir = outputRoot.startsWith('.') ? outputRoot : `.${name}`;
    const hookMetadata = getHookMetadata(definition.name);

    return {
      name: definition.name,
      displayName,
      tier: tiers[definition.name] ?? 'tier-3',
      outputPath: definition.outputPath,
      dotDir,
      skillBasePath,
      hasSkills: definition.features.hasSkills,
      hasAgents: definition.features.hasAgents,
      hasCommands: definition.features.hasCommands,
      hasLocal: definition.name === 'claude',
      skillFileName: definition.skillPath.fileName ?? 'SKILL.md',
      hasDedicatedPage: DEDICATED_PAGES.has(definition.name),
      resources: definition.resources,
      ...hookMetadata,
    };
  });

  // Sort: custom first, then tier-1, tier-2, tier-3; alphabetical within each tier
  const tierOrder = { custom: 0, 'tier-1': 1, 'tier-2': 2, 'tier-3': 3 };
  formatters.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || a.name.localeCompare(b.name));

  return formatters;
}

function validateAgainstTargetCatalog(formatters: FormatterInfo[]): void {
  const registryNames = formatters.map((formatter) => formatter.name);
  const uniqueNames = new Set(registryNames);
  const catalog = Object.values(TARGET_DEFINITIONS);
  const catalogNames = new Set(catalog.map((definition) => definition.name));
  const catalogByName = new Map(catalog.map((definition) => [definition.name, definition]));
  const duplicates = registryNames.filter((name, index) => registryNames.indexOf(name) !== index);
  const missing = [...catalogNames].filter((name) => !uniqueNames.has(name));
  const unknown = [...uniqueNames].filter((name) => !catalogNames.has(name));
  const outputMismatches = formatters
    .filter((formatter) => catalogByName.get(formatter.name)?.outputPath !== formatter.outputPath)
    .map((formatter) => formatter.name);

  if (
    duplicates.length > 0 ||
    missing.length > 0 ||
    unknown.length > 0 ||
    outputMismatches.length > 0
  ) {
    throw new Error(
      [
        duplicates.length > 0 ? `duplicate targets: ${[...new Set(duplicates)].join(', ')}` : '',
        missing.length > 0 ? `missing targets: ${missing.join(', ')}` : '',
        unknown.length > 0 ? `unknown targets: ${unknown.join(', ')}` : '',
        outputMismatches.length > 0 ? `output path mismatches: ${outputMismatches.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; ')
    );
  }
}

/**
 * Validate that our registry matches the ToolName type from feature-matrix.ts.
 */
function validateAgainstFeatureMatrix(formatters: FormatterInfo[]): void {
  // Extract all ToolName values from FEATURE_MATRIX entries
  const matrixTools = new Set<string>();
  for (const feature of FEATURE_MATRIX) {
    for (const tool of Object.keys(feature.tools)) {
      matrixTools.add(tool);
    }
  }

  const registryNames = new Set(formatters.map((f) => f.name));
  const missingFromRegistry = [...matrixTools].filter((t) => !registryNames.has(t));
  const missingFromMatrix = [...registryNames].filter((t) => !matrixTools.has(t));

  if (missingFromRegistry.length > 0) {
    console.warn(
      `Warning: These tools are in feature-matrix.ts but not in formatter source files: ${missingFromRegistry.join(', ')}`
    );
  }
  if (missingFromMatrix.length > 0) {
    // Not a warning - tier 2/3 formatters may not have feature matrix entries yet
    console.log(
      `Note: These formatters have no feature-matrix entries: ${missingFromMatrix.join(', ')}`
    );
  }
}

// ---------------------------------------------------------------------------
// Marker replacement
// ---------------------------------------------------------------------------

/**
 * Replace content between generated markers in a file.
 * Markers look like: <!-- generated:start:id --> ... <!-- generated:end:id -->
 */
function replaceGeneratedSection(content: string, id: string, replacement: string): string {
  const startMarker = `<!-- generated:start:${id} -->`;
  const endMarker = `<!-- generated:end:${id} -->`;
  const pattern = new RegExp(`${escapeRegex(startMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`, 'g');

  const newBlock = [
    startMarker,
    `<!-- Auto-generated by \`pnpm docs:formatters\`. Do not edit manually. -->`,
    '',
    replacement,
    '',
    endMarker,
  ].join('\n');

  if (!content.includes(startMarker)) {
    console.warn(`  Warning: marker "${startMarker}" not found, skipping`);
    return content;
  }

  return content.replace(pattern, newBlock);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

function yn(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function tierLabel(tier: FormatterInfo['tier']): string {
  switch (tier) {
    case 'custom':
      return 'Custom';
    case 'tier-1':
      return 'Tier 1';
    case 'tier-2':
      return 'Tier 2';
    case 'tier-3':
      return 'Tier 3';
  }
}

function skillPath(f: FormatterInfo): string {
  return `${f.skillBasePath ?? `${f.dotDir}/skills`}/<name>/${f.skillFileName}`;
}

function agentPath(f: FormatterInfo): string {
  return (
    f.resources.find((resource) => resource.kind === 'agents')?.path ??
    `${f.dotDir}/agents/<name>.md`
  );
}

function commandPath(f: FormatterInfo): string {
  return (
    f.resources.find((resource) => resource.kind === 'commands')?.path ??
    `${f.dotDir}/commands/<name>.md`
  );
}

function generateFormatterTable(formatters: FormatterInfo[]): string {
  const lines: string[] = [
    '| Formatter | Tier | Output File | Skills | Agents | Local | Commands |',
    '|-----------|------|-------------|--------|--------|-------|----------|',
  ];

  for (const f of formatters) {
    const nameCell = f.hasDedicatedPage ? `[${f.displayName}](${f.name}.md)` : f.displayName;
    lines.push(
      `| ${nameCell} | ${tierLabel(f.tier)} | \`${f.outputPath}\` | ${yn(f.hasSkills)} | ${yn(f.hasAgents)} | ${yn(f.hasLocal)} | ${yn(f.hasCommands)} |`
    );
  }

  return lines.join('\n');
}

function generateOverview(f: FormatterInfo): string {
  const lines = [
    `| Property | Value |`,
    `|----------|-------|`,
    `| **Tier** | ${tierLabel(f.tier)} |`,
    `| **Main output** | \`${f.outputPath}\` |`,
    `| **Dot directory** | \`${f.dotDir}/\` |`,
    `| **Skills** | ${yn(f.hasSkills)}${f.hasSkills ? ` (\`${skillPath(f)}\`)` : ''} |`,
    `| **Agents** | ${yn(f.hasAgents)}${f.hasAgents ? ` (\`${agentPath(f)}\`)` : ''} |`,
    `| **Commands** | ${yn(f.hasCommands)}${f.hasCommands ? ` (\`${commandPath(f)}\`)` : ''} |`,
    `| **Local files** | ${yn(f.hasLocal)}${f.hasLocal ? ' (`CLAUDE.local.md`)' : ''} |`,
  ];
  return lines.join('\n');
}

function generateOutputFiles(f: FormatterInfo): string {
  const lines = [
    '| File | Path | Purpose |',
    '|------|------|---------|',
    `| Main instructions | \`${f.outputPath}\` | Primary rule file |`,
  ];

  if (f.name === 'factory') {
    lines.push(
      `| Always-on rules | \`.factory/rules/**/*.md\` | Split rule files when \`rulesMode: split\` |`
    );
  }

  if (f.hookConfigPath && f.hookVersions.length > 0) {
    const modeLabel =
      f.hookVersions.length === 1
        ? `\`${f.hookVersions[0]}\` mode`
        : `${f.hookVersions.map((version) => `\`${version}\``).join(' and ')} modes`;
    const purpose =
      f.name === 'github'
        ? `Copilot CLI and cloud agent hooks in ${modeLabel}`
        : `Project hooks in ${modeLabel}`;
    lines.push(`| Lifecycle hooks | \`${f.hookConfigPath}\` | ${purpose} |`);
  }

  if (f.hasLocal) {
    lines.push(`| Local overrides | \`CLAUDE.local.md\` | Private instructions (gitignored) |`);
  }

  if (f.hasSkills) {
    lines.push(`| Skills | \`${skillPath(f)}\` | Reusable skill definitions |`);
  }

  if (f.hasCommands) {
    const label =
      f.name === 'github' ? 'Prompts' : f.name === 'antigravity' ? 'Workflows' : 'Commands';
    const purpose =
      f.name === 'antigravity'
        ? 'Workflow shortcuts; simple commands remain inline'
        : 'Slash commands';
    lines.push(`| ${label} | \`${commandPath(f)}\` | ${purpose} |`);
  }

  if (f.hasAgents) {
    lines.push(`| Agents | \`${agentPath(f)}\` | Agent configurations |`);

    // GitHub also has top-level AGENTS.md
    if (f.name === 'github') {
      lines.push(`| Agents index | \`AGENTS.md\` | Top-level agents file |`);
    }
  }

  return lines.join('\n');
}

function generateFeatures(f: FormatterInfo): string {
  const toolName = f.name as ToolName;

  const statusEmoji = (status: string | undefined): string => {
    switch (status) {
      case 'supported':
        return 'Yes';
      case 'partial':
        return 'Partial';
      case 'planned':
        return 'Planned';
      default:
        return 'No';
    }
  };

  const lines = ['| Feature | Supported |', '|---------|-----------|'];

  for (const feature of FEATURE_MATRIX) {
    const status = feature.tools[toolName];
    // Only show features that have an entry for this tool
    if (status !== undefined) {
      lines.push(`| ${feature.name} | ${statusEmoji(status)} |`);
    }
  }

  // Add features from formatter config that aren't in the matrix
  // (matrix only tracks original 7, so add skill/agent/command info for all)
  if (!FEATURE_MATRIX.some((feat) => feat.tools[toolName] !== undefined)) {
    // Fallback for formatters not in the feature matrix
    lines.push(`| Skills | ${f.hasSkills ? 'Yes' : 'No'} |`);
    lines.push(`| Agents | ${f.hasAgents ? 'Yes' : 'No'} |`);
    lines.push(`| Commands | ${f.hasCommands ? 'Yes' : 'No'} |`);
    lines.push(`| Local files | ${f.hasLocal ? 'Yes' : 'No'} |`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const checkMode = process.argv.includes('--check');
  let hasChanges = false;

  // 0. Build registry from source and validate
  const FORMATTERS = buildFormatterRegistry();
  validateAgainstTargetCatalog(FORMATTERS);
  validateAgainstFeatureMatrix(FORMATTERS);
  console.log(`Found ${FORMATTERS.length} formatters in the target registry\n`);

  // 1. Generate index page table
  const indexPath = join(DOCS_DIR, 'index.md');
  if (existsSync(indexPath)) {
    console.log('Generating: formatters/index.md');
    let content = readFileSync(indexPath, 'utf-8');
    const original = content;
    content = replaceGeneratedSection(
      content,
      'formatter-table',
      generateFormatterTable(FORMATTERS)
    );

    if (content !== original) {
      hasChanges = true;
      if (!checkMode) {
        writeFileSync(indexPath, content, 'utf-8');
        console.log('  Updated formatter table');
      } else {
        console.log('  Would update formatter table');
      }
    } else {
      console.log('  No changes');
    }
  }

  // 2. Generate dedicated formatter pages
  const dedicatedFormatters = FORMATTERS.filter((f) => f.hasDedicatedPage);
  for (const f of dedicatedFormatters) {
    const pagePath = join(DOCS_DIR, `${f.name}.md`);
    if (!existsSync(pagePath)) {
      console.warn(`  Skipping ${f.name}.md - file does not exist`);
      continue;
    }

    console.log(`Generating: formatters/${f.name}.md`);
    let content = readFileSync(pagePath, 'utf-8');
    const original = content;

    content = replaceGeneratedSection(content, 'overview', generateOverview(f));
    content = replaceGeneratedSection(content, 'output-files', generateOutputFiles(f));
    content = replaceGeneratedSection(content, 'features', generateFeatures(f));

    if (content !== original) {
      hasChanges = true;
      if (!checkMode) {
        writeFileSync(pagePath, content, 'utf-8');
        console.log('  Updated generated sections');
      } else {
        console.log('  Would update generated sections');
      }
    } else {
      console.log('  No changes');
    }
  }

  if (checkMode && hasChanges) {
    console.error('\nFormatter docs are out of date. Run `pnpm docs:formatters` to update.');
    process.exit(1);
  }

  if (!checkMode) {
    console.log('\nDone. Generated sections updated.');
  } else {
    console.log('\nAll formatter docs are up to date.');
  }
}

main();
