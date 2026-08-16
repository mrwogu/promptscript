import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isPromptScriptHookCommand } from '../hooks/tool-configs/claude.js';
import type { FormatterOutput } from '@promptscript/compiler';

export interface LegacyFactoryMigrationResult {
  canonical: Record<string, unknown>;
  legacy: Record<string, unknown>;
  migrated: number;
  ambiguous: string[];
  changed: boolean;
}

export interface LegacyFactoryMigrationOptions {
  preserveInstalledHooks?: boolean;
  rejectMixedOwnership?: boolean;
}

export interface LegacyFactoryMigrationPlan {
  settingsPath: string;
  hooksPath: string;
  expectedSettingsContent: string;
  migration: LegacyFactoryMigrationResult;
}

export async function prepareLegacyFactoryMigration(
  outputs: Map<string, FormatterOutput>,
  outputRoot: string
): Promise<LegacyFactoryMigrationPlan | undefined> {
  const factoryOutput = outputs.get('.factory/hooks.json');
  const plan = await planLegacyFactoryHooksMigration(outputRoot, factoryOutput?.content);
  if (!plan) return undefined;
  if (plan.migration.ambiguous.length > 0) {
    throw new Error(
      `Cannot migrate legacy Factory hooks safely. Review these entries in ${plan.settingsPath}: ` +
        plan.migration.ambiguous.join(', ')
    );
  }
  if (!plan.migration.changed) return undefined;

  const content = JSON.stringify(plan.migration.canonical, null, 2) + '\n';
  if (factoryOutput) {
    factoryOutput.content = content;
  } else {
    outputs.set('.factory/hooks.json', {
      path: '.factory/hooks.json',
      content,
    });
  }
  return plan;
}

const LEGACY_EVENT_NAMES: Readonly<Record<string, string>> = {
  PreToolUse: 'PreToolUse',
  preToolUse: 'PreToolUse',
  'pre-tool-use': 'PreToolUse',
  PostToolUse: 'PostToolUse',
  postToolUse: 'PostToolUse',
  'post-tool-use': 'PostToolUse',
  SessionStart: 'SessionStart',
  sessionStart: 'SessionStart',
  'session-start': 'SessionStart',
  Setup: 'Setup',
  setup: 'Setup',
  Notification: 'Notification',
  notification: 'Notification',
  Stop: 'Stop',
  stop: 'Stop',
};
const LEGACY_ENTRY_FIELDS = new Set(['matcher', 'commandRegex', 'hooks']);
const LEGACY_HANDLER_FIELDS = new Set(['type', 'command', 'timeout', 'statusMessage']);

/**
 * Detect a legacy `.factory/settings.json` that still carries a `hooks` key.
 *
 * PromptScript versions before 1.16 wrote language-level `@hooks` into
 * `.factory/settings.json`. Factory falls back to that file when
 * `.factory/hooks.json` is absent, so a stale `hooks` section silently
 * reactivates old commands. Fully PromptScript-owned hook files (including
 * legacy CLI-installed commands) are managed elsewhere and do not need this
 * warning.
 *
 * Returns the absolute settings path when a non-owned `hooks` key is present
 * and `.factory/hooks.json` is absent (only then does the legacy section
 * actually take effect), or undefined when there is nothing to migrate.
 */
export async function detectLegacyFactorySettingsHooks(
  outputRoot: string,
  includeOwned = false
): Promise<string | undefined> {
  const hooksPath = resolve(outputRoot, '.factory', 'hooks.json');
  try {
    await readFile(hooksPath, 'utf-8');
    // hooks.json exists - Factory ignores the legacy settings.json fallback.
    return undefined;
  } catch {
    // hooks.json absent - legacy settings hooks would take effect.
  }

  const settingsPath = resolve(outputRoot, '.factory', 'settings.json');

  let content: string;
  try {
    content = await readFile(settingsPath, 'utf-8');
  } catch {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return undefined;
  }
  if (!Object.prototype.hasOwnProperty.call(parsed, 'hooks')) {
    return undefined;
  }
  if (
    !includeOwned &&
    hasOnlyOwnedLegacyFactoryHooks((parsed as Record<string, unknown>)['hooks'])
  ) {
    return undefined;
  }

  return settingsPath;
}

function hasOnlyOwnedLegacyFactoryHooks(value: unknown): boolean {
  const scan = (current: unknown): { found: boolean; valid: boolean } => {
    if (Array.isArray(current)) {
      return current.reduce(
        (result, item) => {
          const itemScan = scan(item);
          return {
            found: result.found || itemScan.found,
            valid: result.valid && itemScan.valid,
          };
        },
        { found: false, valid: true }
      );
    }
    if (typeof current !== 'object' || current === null) {
      return { found: false, valid: true };
    }

    const object = current as Record<string, unknown>;
    if (typeof object['command'] === 'string') {
      return {
        found: true,
        valid:
          isPromptScriptHookCommand(object['command']) ||
          /# promptscript-generated:[A-Za-z0-9._-]+\s*$/.test(object['command']),
      };
    }
    return scan(Object.values(object));
  };

  const result = scan(value);
  return result.found && result.valid;
}

/**
 * Move unowned legacy Factory hook entries into the canonical hooks file.
 *
 * The migration is deliberately all-or-nothing for user entries. Unknown event
 * names or malformed hook arrays are left in settings.json and reported as
 * ambiguous so a partial migration cannot silently disable a user's hook.
 */
export function migrateLegacyFactoryHooks(
  legacy: Record<string, unknown>,
  canonical: Record<string, unknown>,
  options: LegacyFactoryMigrationOptions = {}
): LegacyFactoryMigrationResult {
  const legacyHooksValue = legacy['hooks'];
  if (legacyHooksValue === undefined) {
    return { canonical, legacy, migrated: 0, ambiguous: [], changed: false };
  }
  const legacyHooks = getObject(legacyHooksValue);
  if (!legacyHooks) {
    return {
      canonical,
      legacy,
      migrated: 0,
      ambiguous: ['hooks'],
      changed: false,
    };
  }

  const canonicalHooksValue = canonical['hooks'];
  const canonicalHooks = canonicalHooksValue === undefined ? {} : getObject(canonicalHooksValue);
  if (!canonicalHooks) {
    return {
      canonical,
      legacy,
      migrated: 0,
      ambiguous: ['canonical.hooks'],
      changed: false,
    };
  }
  const malformedCanonicalEvents = Object.entries(canonicalHooks)
    .filter(([, value]) => !Array.isArray(value))
    .map(([eventName]) => `canonical.hooks.${eventName}`);
  if (malformedCanonicalEvents.length > 0) {
    return {
      canonical,
      legacy,
      migrated: 0,
      ambiguous: malformedCanonicalEvents,
      changed: false,
    };
  }
  const migratedByEvent: Record<string, unknown[]> = {};
  const remainingLegacyHooks: Record<string, unknown> = {};
  const ambiguous: string[] = [];
  let migrated = 0;

  for (const [eventName, value] of Object.entries(legacyHooks)) {
    const nativeEvent = LEGACY_EVENT_NAMES[eventName];
    const entries = Array.isArray(value) ? value : undefined;
    if (!nativeEvent || !entries) {
      ambiguous.push(`hooks.${eventName}`);
      remainingLegacyHooks[eventName] = value;
      continue;
    }

    for (const [index, entry] of entries.entries()) {
      const migration = splitLegacyEntry(entry, options);
      if (migration.ambiguous) {
        ambiguous.push(`hooks.${eventName}[${index}]`);
        continue;
      }
      if (migration.userEntry !== undefined) {
        const target = migratedByEvent[nativeEvent] ?? [];
        target.push(migration.userEntry);
        migratedByEvent[nativeEvent] = target;
        migrated++;
      }
    }
  }

  if (ambiguous.length > 0) {
    return { canonical, legacy, migrated: 0, ambiguous, changed: false };
  }

  const mergedHooks: Record<string, unknown> = { ...canonicalHooks };
  for (const [eventName, entries] of Object.entries(migratedByEvent)) {
    const existingValue = mergedHooks[eventName];
    const existing = Array.isArray(existingValue) ? existingValue : [];
    mergedHooks[eventName] = appendUnique(existing, entries);
  }

  const nextLegacy = { ...legacy };
  if (Object.keys(remainingLegacyHooks).length === 0) {
    delete nextLegacy['hooks'];
  } else {
    nextLegacy['hooks'] = remainingLegacyHooks;
  }

  const nextCanonical = { ...canonical, hooks: mergedHooks };
  return {
    canonical: nextCanonical,
    legacy: nextLegacy,
    migrated,
    ambiguous,
    changed:
      migrated > 0 ||
      JSON.stringify(nextLegacy) !== JSON.stringify(legacy) ||
      JSON.stringify(nextCanonical) !== JSON.stringify(canonical),
  };
}

export async function planLegacyFactoryHooksMigration(
  outputRoot: string,
  generatedCanonicalContent?: string
): Promise<LegacyFactoryMigrationPlan | undefined> {
  const hooksPath = resolve(outputRoot, '.factory', 'hooks.json');
  try {
    await readFile(hooksPath, 'utf-8');
    return undefined;
  } catch (error) {
    if (!isFileNotFound(error)) throw error;
  }

  const settingsPath = resolve(outputRoot, '.factory', 'settings.json');
  let expectedSettingsContent: string;
  try {
    expectedSettingsContent = await readFile(settingsPath, 'utf-8');
  } catch (error) {
    if (isFileNotFound(error)) return undefined;
    throw error;
  }

  const legacy = parseJsonObject(expectedSettingsContent, settingsPath);
  if (!Object.prototype.hasOwnProperty.call(legacy, 'hooks')) return undefined;
  const canonical =
    generatedCanonicalContent === undefined
      ? {}
      : parseJsonObject(generatedCanonicalContent, 'generated .factory/hooks.json');
  const migration = migrateLegacyFactoryHooks(legacy, canonical, {
    preserveInstalledHooks: true,
    rejectMixedOwnership: true,
  });
  return {
    settingsPath,
    hooksPath,
    expectedSettingsContent,
    migration,
  };
}

function splitLegacyEntry(
  entry: unknown,
  options: LegacyFactoryMigrationOptions
): { userEntry?: unknown; ambiguous: boolean } {
  const object = getObject(entry);
  if (!object) return { ambiguous: true };

  const handlers = object['hooks'];
  if (!Array.isArray(handlers)) {
    if (isGeneratedCommandObject(object)) return { ambiguous: false };
    if (options.preserveInstalledHooks && isInstalledCommandObject(object)) {
      return { userEntry: object, ambiguous: false };
    }
    return isInstalledCommandObject(object) ? { ambiguous: false } : { ambiguous: true };
  }
  if (!hasOnlyFields(object, LEGACY_ENTRY_FIELDS)) return { ambiguous: true };
  if (object['matcher'] !== undefined && typeof object['matcher'] !== 'string') {
    return { ambiguous: true };
  }
  if (object['commandRegex'] !== undefined && typeof object['commandRegex'] !== 'string') {
    return { ambiguous: true };
  }
  if (handlers.length === 0) return { ambiguous: true };

  const generatedHandlers = handlers.filter(isGeneratedCommandObject);
  const installedHandlers = handlers.filter(isInstalledCommandObject);
  const userHandlers = handlers.filter(
    (handler) =>
      !isGeneratedCommandObject(handler) &&
      !isInstalledCommandObject(handler) &&
      isCommandObject(handler)
  );
  const hasAmbiguousHandler = handlers.some((handler) => !isCommandObject(handler));
  if (hasAmbiguousHandler) return { ambiguous: true };
  if (
    options.rejectMixedOwnership &&
    ((generatedHandlers.length > 0 && installedHandlers.length + userHandlers.length > 0) ||
      (installedHandlers.length > 0 && userHandlers.length > 0))
  ) {
    return { ambiguous: true };
  }
  const migratedHandlers = handlers.filter(
    (handler) =>
      userHandlers.includes(handler) ||
      (options.preserveInstalledHooks && installedHandlers.includes(handler))
  );
  if (migratedHandlers.length === 0) return { ambiguous: false };

  return {
    userEntry: { ...object, hooks: migratedHandlers },
    ambiguous: false,
  };
}

function appendUnique(existing: unknown[], additions: unknown[]): unknown[] {
  const result = [...existing];
  for (const addition of additions) {
    const serialized = stableSerialize(addition);
    if (!result.some((item) => stableSerialize(item) === serialized)) result.push(addition);
  }
  return result;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? String(value);
}

function isCommandObject(value: unknown): boolean {
  const object = getObject(value);
  if (
    !object ||
    object['type'] !== 'command' ||
    typeof object['command'] !== 'string' ||
    object['command'].trim().length === 0 ||
    !hasOnlyFields(object, LEGACY_HANDLER_FIELDS)
  ) {
    return false;
  }
  const timeout = object['timeout'];
  if (timeout !== undefined && (typeof timeout !== 'number' || !Number.isFinite(timeout))) {
    return false;
  }
  return object['statusMessage'] === undefined || typeof object['statusMessage'] === 'string';
}

function isGeneratedCommandObject(value: unknown): boolean {
  const object = getObject(value);
  return (
    typeof object?.['command'] === 'string' &&
    isCommandObject(object) &&
    /# promptscript-generated:[A-Za-z0-9._-]+\s*$/.test(object['command'])
  );
}

function isInstalledCommandObject(value: unknown): boolean {
  const object = getObject(value);
  return (
    typeof object?.['command'] === 'string' &&
    isCommandObject(object) &&
    !isGeneratedCommandObject(object) &&
    isPromptScriptHookCommand(object['command'])
  );
}

function parseJsonObject(content: string, path: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(content);
    const object = getObject(parsed);
    if (!object) throw new Error('expected a JSON object');
    return object;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse Factory hooks file ${path}: ${message}`, { cause: error });
  }
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String(error.code) === 'ENOENT'
  );
}

function hasOnlyFields(object: Record<string, unknown>, fields: ReadonlySet<string>): boolean {
  return Object.keys(object).every((key) => fields.has(key));
}

function getObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
