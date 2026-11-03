/**
 * Factory `.factory/hooks.json` is keyed directly by event name
 * (`{ "PreToolUse": [...] }`). Only `settings.json` wraps the same map in a
 * top-level `hooks` key. PromptScript 1.27 and earlier wrote the wrapped shape
 * to hooks.json too, which droid ignores, so readers accept both shapes.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True for the old `{ "hooks": { ... } }` shape of hooks.json. No event is named `hooks`. */
export function isWrappedFactoryHooks(value: Record<string, unknown>): boolean {
  return isPlainObject(value['hooks']);
}

/** hooks.json content as `{ hooks: eventMap }`, whatever shape it was written in. */
export function wrapFactoryHooks(value: Record<string, unknown>): Record<string, unknown> {
  if (isWrappedFactoryHooks(value)) return value;
  return Object.keys(value).length === 0 ? {} : { hooks: value };
}

/**
 * The bare event map Factory reads from hooks.json. Other top-level keys an
 * old file carried are kept, so nothing the user wrote is lost.
 */
export function unwrapFactoryHooks(value: Record<string, unknown>): Record<string, unknown> {
  const { hooks, ...rest } = value;
  return isPlainObject(hooks) ? { ...rest, ...hooks } : rest;
}

export function isFactoryHooksPath(path: string): boolean {
  return path.replaceAll('\\', '/').endsWith('.factory/hooks.json');
}
