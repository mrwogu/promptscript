/**
 * Compare the built-in model catalog with OpenRouter's model list.
 *
 * `--check` prints the drift and exits non-zero when new releases of
 * known families show up. `--apply` drafts those releases into
 * packages/core/src/model-profiles.ts: new entries after their family,
 * a successor on the release each one displaces, and a bumped Checked on
 * date. Retirement dates beyond what OpenRouter carries, the naming of
 * new families, and target-specific names stay manual; the printed
 * checklist covers them.
 *
 * Usage: pnpm models:drift | pnpm models:drift:apply
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODEL_PROFILES,
  detectModelDrift,
  displacedProfile,
  formatProfileEntry,
  parseOpenRouterModels,
  type ModelDriftCandidate,
  type ModelDriftReport,
  type ModelProfile,
} from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const PROFILES_SOURCE = join(ROOT, 'packages', 'core', 'src', 'model-profiles.ts');
const OPENROUTER_MODELS_URL =
  process.env['OPENROUTER_MODELS_URL'] ?? 'https://openrouter.ai/api/v1/models';

async function fetchOpenRouterModels(): Promise<ReturnType<typeof parseOpenRouterModels>> {
  const response = await fetch(OPENROUTER_MODELS_URL);
  if (!response.ok) throw new Error(`OpenRouter responded with ${response.status}`);
  return parseOpenRouterModels(await response.json());
}

function printReport(report: ModelDriftReport): void {
  if (report.candidates.length === 0) {
    console.log('No new releases of known families.');
  } else {
    console.log('New releases of known families:');
    for (const candidate of report.candidates) {
      console.log(`  ${candidate.id} (${candidate.displayName}, listed ${candidate.releaseDate})`);
    }
  }
  if (report.unmatched.length > 0) {
    console.log('OpenRouter models with no catalog family match:');
    for (const slug of report.unmatched) console.log(`  ${slug}`);
  }
  if (report.absent.length > 0) {
    console.log('Catalog releases OpenRouter does not list:');
    for (const id of report.absent) console.log(`  ${id}`);
  }
}

/** The call the profile helper for one family starts with. */
function familySignature(provider: string, family: string): string {
  return provider === 'anthropic'
    ? `claude('${family.slice('claude-'.length)}',`
    : `${provider}('${family}',`;
}

/** Insert a drafted entry after the last entry of its family. */
function insertFamilyEntry(
  source: string,
  provider: string,
  family: string,
  entry: string
): string {
  const signature = familySignature(provider, family);
  const lines = source.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trimStart().startsWith(signature)) start = i;
  }
  if (start < 0) throw new Error(`model-profiles.ts has no entry for family "${family}"`);
  let end = start;
  while (end < lines.length) {
    const line = (lines[end] ?? '').trim();
    // Entries end with a `}),` line, an inline `),`, or a final `);`.
    if (line.endsWith(');') || line.endsWith('),') || line === '}),') break;
    end++;
  }
  if (end >= lines.length) throw new Error(`no end found for the "${family}" family entry`);
  lines.splice(end + 1, 0, ...entry.split('\n'));
  return lines.join('\n');
}

/** Give the displaced release a successor field, inline or multiline. */
function addSuccessor(source: string, displaced: ModelProfile, successorId: string): string {
  const signature = familySignature(displaced.provider, displaced.family);
  const lines = source.split('\n');
  const index = lines.findIndex((line) =>
    line.trimStart().startsWith(`${signature} '${displaced.version}',`)
  );
  if (index < 0) throw new Error(`no entry found for ${displaced.id}`);
  const line = lines[index] ?? '';
  const brace = line.indexOf('{');
  if (brace >= 0) {
    lines[index] =
      line.slice(0, brace + 1) + ` successor: '${successorId}',` + line.slice(brace + 1);
    return lines.join('\n');
  }
  const close = line.includes(');') ? line.lastIndexOf(');') : line.lastIndexOf('),');
  if (close < 0) throw new Error(`no fields or parameter list on the ${displaced.id} entry`);
  lines[index] = line.slice(0, close) + `, { successor: '${successorId}' }` + line.slice(close);
  return lines.join('\n');
}

/** A minimal profile for entries the current run drafted. */
function draftedProfile(candidate: ModelDriftCandidate): ModelProfile {
  return {
    id: candidate.id,
    provider: candidate.provider,
    family: candidate.family,
    version: candidate.version,
    displayName: candidate.displayName,
    apiId: candidate.apiId ?? candidate.id,
    aliases: [],
    status: 'current',
    targets: {},
  };
}

function apply(report: ModelDriftReport): void {
  if (report.candidates.length === 0) {
    console.log('Model catalog is in sync with OpenRouter; nothing to draft.');
    return;
  }
  let source = readFileSync(PROFILES_SOURCE, 'utf8');
  const profiles: ModelProfile[] = [...MODEL_PROFILES];
  for (const candidate of report.candidates) {
    source = insertFamilyEntry(
      source,
      candidate.provider,
      candidate.family,
      formatProfileEntry(candidate)
    );
    const displaced = displacedProfile(candidate, profiles);
    if (displaced !== undefined) {
      source = addSuccessor(source, displaced, candidate.id);
    }
    profiles.push(draftedProfile(candidate));
  }
  const checkedOn = new Date().toISOString().slice(0, 10);
  source = source.replace(/Checked on \d{4}-\d{2}-\d{2}/, `Checked on ${checkedOn}`);
  writeFileSync(PROFILES_SOURCE, source);
  console.log(`Drafted ${report.candidates.length} release(s) into model-profiles.ts.`);
  console.log();
  console.log('Manual checklist before merging:');
  console.log('- Verify release dates against the provider pages; OpenRouter');
  console.log('  reports the day it listed the model, not the release day.');
  console.log('- Verify retirement dates and statuses; OpenRouter rarely carries them.');
  console.log('- Check successors across families and floating aliases');
  console.log('  (opus, sonnet, haiku, fable), then sweep the docs, run');
  console.log('  pnpm docs:validate --update-outputs, ./scripts/sync-skill.sh, and');
  console.log('  pnpm prs compile when an alias moved.');
  console.log('- Check target-specific names against the tool pages; set');
  console.log('  targets in MODEL_TARGET_SCHEMES or promptscript.yaml when they differ.');
  console.log('- The core catalog tests fail on the drafted state until you update');
  console.log('  the hardcoded expectations (floating aliases, replacements, pinned');
  console.log('  snapshots) with the values you verified.');
  console.log(
    '- Run the model catalog pipeline: pnpm nx run-many -t test -p core,formatters,validator'
  );
  console.log('  and pnpm docs:models.');
}

async function main(): Promise<void> {
  const report = detectModelDrift(await fetchOpenRouterModels(), MODEL_PROFILES);
  if (process.argv.includes('--apply')) {
    apply(report);
    return;
  }
  printReport(report);
  if (report.candidates.length > 0) process.exitCode = 1;
}

void main();
