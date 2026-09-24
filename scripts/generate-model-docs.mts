/**
 * Generate the model catalog reference from the built-in model profiles.
 *
 * Writes the catalog summary, floating aliases, target model names, and
 * profile tables into docs/reference/models.md, between
 * <!-- generated:start:<id> --> / <!-- generated:end:<id> --> markers.
 *
 * Usage: pnpm docs:models
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FLOATING_MODEL_ALIASES,
  INHERIT_MODEL,
  MODEL_PROFILES,
  MODEL_TARGET_SCHEMES,
  getModelCatalog,
  mapModelToTarget,
  validateModelCatalog,
  type ModelProfile,
  type TargetModel,
} from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const PAGE_PATH = join(ROOT, 'docs', 'reference', 'models.md');
const PROFILES_SOURCE = join(ROOT, 'packages', 'core', 'src', 'model-profiles.ts');

const PROVIDER_NAMES: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
};

const TARGET_NAMES: Record<string, string> = {
  claude: 'Claude Code',
  grok: 'Grok Build',
  github: 'GitHub Copilot',
  factory: 'Factory AI',
  codex: 'Codex',
  cursor: 'Cursor',
};

// Together these show every naming rule: floating aliases, inherit, a pinned
// Claude release with a dated API id, and providers some targets cannot run.
const EXAMPLE_REFERENCES = [
  ...Object.keys(FLOATING_MODEL_ALIASES),
  INHERIT_MODEL,
  'claude-sonnet-4-5',
  'gpt-5.3-codex',
  'gemini-3.1-pro-preview',
];

const catalog = getModelCatalog();

function code(value: string): string {
  return `\`${value}\``;
}

function cell(value: string): string {
  return value.replaceAll('|', String.raw`\|`);
}

function table(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

function nameOf(names: Record<string, string>, key: string, kind: string): string {
  const name = names[key];
  if (!name) {
    throw new Error(
      `No display name for ${kind} "${key}". Add it to scripts/generate-model-docs.mts.`
    );
  }
  return name;
}

function checkedDate(): string {
  const source = readFileSync(PROFILES_SOURCE, 'utf-8');
  const date = /Checked on (\d{4}-\d{2}-\d{2})/.exec(source)?.[1];
  if (!date) {
    throw new Error(`No "Checked on YYYY-MM-DD" line in the ${PROFILES_SOURCE} header.`);
  }
  return date;
}

function generateSummary(): string {
  const providers = new Set(MODEL_PROFILES.map((profile) => profile.provider));
  return (
    `This version ships ${MODEL_PROFILES.length} profiles from ${providers.size} providers. ` +
    `They were last checked against the provider documentation on ${checkedDate()}.`
  );
}

function generateFloatingAliases(): string {
  const rows = Object.entries(FLOATING_MODEL_ALIASES).map(([alias, family]) => {
    const latest = catalog.getLatest(family);
    if (!latest) throw new Error(`Floating alias "${alias}" has no release in family "${family}".`);
    return [code(alias), code(family), code(latest.id), latest.displayName];
  });
  return table(['Alias', 'Family', 'Current release', 'Display name'], rows);
}

function targetCell(reference: string, target: string): string {
  const mapped: TargetModel = mapModelToTarget(reference, target, catalog);
  if (mapped.value !== undefined) return code(mapped.value);
  if (mapped.issue === 'unsupported-provider') return 'omitted (PS4004)';
  if (mapped.issue === undefined) return 'omitted';
  throw new Error(`Example "${reference}" maps to issue "${mapped.issue}" on target "${target}".`);
}

function generateTargetNames(): string {
  for (const reference of EXAMPLE_REFERENCES) {
    if (!catalog.resolve(reference)) {
      throw new Error(`Example "${reference}" is not in the model catalog. Pick another example.`);
    }
  }

  // Targets that write the same names for every example share a column.
  const columns: Array<{ target: string; names: string[]; signature: string }> = [];
  for (const target of Object.keys(MODEL_TARGET_SCHEMES)) {
    const signature = EXAMPLE_REFERENCES.map((reference) => targetCell(reference, target)).join(
      '\n'
    );
    const name = nameOf(TARGET_NAMES, target, 'target');
    const same = columns.find((column) => column.signature === signature);
    if (same) same.names.push(name);
    else columns.push({ target, names: [name], signature });
  }

  const header = ['Written in `.prs`', ...columns.map((column) => column.names.join(', '))];
  const rows = EXAMPLE_REFERENCES.map((reference) => [
    code(reference),
    ...columns.map((column) => targetCell(reference, column.target)),
  ]);
  return table(header, rows);
}

function describeStatus(profile: ModelProfile): string {
  if (!profile.retirementDate) return profile.status;
  return profile.status === 'retired'
    ? `retired on ${profile.retirementDate}`
    : `${profile.status}, retires ${profile.retirementDate}`;
}

function generateProfiles(): string {
  const byProvider = new Map<string, ModelProfile[]>();
  for (const profile of MODEL_PROFILES) {
    const group = byProvider.get(profile.provider) ?? [];
    group.push(profile);
    byProvider.set(profile.provider, group);
  }

  const sections = [...byProvider].map(([provider, profiles]) => {
    const rows = profiles.map((profile) => [
      code(profile.id),
      profile.displayName,
      code(profile.apiId),
      profile.aliases.length > 0 ? profile.aliases.map(code).join(', ') : '-',
      describeStatus(profile),
      profile.releaseDate ?? '-',
      profile.successor ? code(profile.successor) : '-',
    ]);
    return [
      `### ${nameOf(PROVIDER_NAMES, provider, 'provider')}`,
      '',
      table(
        ['Profile id', 'Display name', 'API id', 'Aliases', 'Status', 'Released', 'Successor'],
        rows
      ),
    ].join('\n');
  });
  return sections.join('\n\n');
}

function replaceGeneratedSection(content: string, id: string, replacement: string): string {
  const startMarker = `<!-- generated:start:${id} -->`;
  const endMarker = `<!-- generated:end:${id} -->`;
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Markers for "${id}" are missing or out of order in ${PAGE_PATH}.`);
  }

  const block = [
    startMarker,
    '<!-- Auto-generated by `pnpm docs:models`. Do not edit manually. -->',
    '',
    replacement,
    '',
    endMarker,
  ].join('\n');
  return content.slice(0, start) + block + content.slice(end + endMarker.length);
}

function main(): void {
  const issues = validateModelCatalog();
  if (issues.length > 0) {
    throw new Error(`The built-in model catalog is inconsistent:\n- ${issues.join('\n- ')}`);
  }

  const sections: Record<string, string> = {
    'catalog-summary': generateSummary(),
    'floating-aliases': generateFloatingAliases(),
    'target-names': generateTargetNames(),
    profiles: generateProfiles(),
  };

  const content = Object.entries(sections).reduce(
    (page, [id, replacement]) => replaceGeneratedSection(page, id, replacement),
    readFileSync(PAGE_PATH, 'utf-8')
  );
  writeFileSync(PAGE_PATH, content, 'utf-8');
  console.log('Generated sections written to docs/reference/models.md');
}

main();
