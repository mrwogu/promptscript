import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isPromptScriptHookCommand } from '../hooks/tool-configs/claude.js';

export interface LegacyFactoryMigrationResult {
  canonical: Record<string, unknown>;
  legacy: Record<string, unknown>;
  migrated: number;
  ambiguous: string[];
  changed: boolean;
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
const LEGACY_ENTRY_FIELDS = new Set(['matcher', 'hooks']);
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
  outputRoot: string
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
  if (hasOnlyOwnedLegacyFactoryHooks((parsed as Record<string, unknown>)['hooks'])) {
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
  canonical: Record<string, unknown>
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

    const remainingEntries: unknown[] = [];
    for (const [index, entry] of entries.entries()) {
      const migration = splitLegacyEntry(entry);
      if (migration.ambiguous) {
        ambiguous.push(`hooks.${eventName}[${index}]`);
        remainingEntries.push(entry);
        continue;
      }
      if (migration.userEntry !== undefined) {
        const target = migratedByEvent[nativeEvent] ?? [];
        target.push(migration.userEntry);
        migratedByEvent[nativeEvent] = target;
        migrated++;
      }
    }
    if (remainingEntries.length > 0) remainingLegacyHooks[eventName] = remainingEntries;
  }

  if (ambiguous.length > 0) {
    return { canonical, legacy, migrated: 0, ambiguous, changed: false };
  }

  const mergedHooks: Record<string, unknown> = { ...canonicalHooks };
  for (const [eventName, entries] of Object.entries(migratedByEvent)) {
    const existingValue = mergedHooks[eventName];
    if (existingValue !== undefined && !Array.isArray(existingValue)) {
      ambiguous.push(`canonical.hooks.${eventName}`);
      continue;
    }
    const existing = existingValue ?? [];
    mergedHooks[eventName] = appendUnique(existing, entries);
  }
  if (ambiguous.length > 0) {
    return { canonical, legacy, migrated: 0, ambiguous, changed: false };
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

function splitLegacyEntry(entry: unknown): { userEntry?: unknown; ambiguous: boolean } {
  const object = getObject(entry);
  if (!object) return { ambiguous: true };

  const handlers = object['hooks'];
  if (!Array.isArray(handlers)) {
    return isOwnedCommandObject(object) ? { ambiguous: false } : { ambiguous: true };
  }
  if (!hasOnlyFields(object, LEGACY_ENTRY_FIELDS)) return { ambiguous: true };
  if (handlers.length === 0) return { ambiguous: true };

  const userHandlers = handlers.filter((handler) => !isOwnedCommandObject(handler));
  const hasAmbiguousHandler = handlers.some(
    (handler) => !isOwnedCommandObject(handler) && !isCommandObject(handler)
  );
  if (hasAmbiguousHandler) return { ambiguous: true };
  if (userHandlers.length === 0) return { ambiguous: false };

  return {
    userEntry: { ...object, hooks: userHandlers },
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
  return object !== undefined && typeof object['command'] === 'string';
}

function isOwnedCommandObject(value: unknown): boolean {
  const object = getObject(value);
  if (!object) return false;
  if (typeof object['command'] === 'string') {
    if (object['type'] !== 'command' || !hasOnlyFields(object, LEGACY_HANDLER_FIELDS)) {
      return false;
    }
    return (
      /# promptscript-generated:[A-Za-z0-9._-]+\s*$/.test(object['command']) ||
      isPromptScriptHookCommand(object['command'])
    );
  }
  const handlers = object['hooks'];
  return (
    Array.isArray(handlers) &&
    handlers.length > 0 &&
    handlers.every((handler) => isOwnedCommandObject(handler))
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
