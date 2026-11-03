import type { TargetSettingsConfig } from '@promptscript/core';
import type { FormatterWarning } from './types.js';

type SettingsKey = keyof TargetSettingsConfig;

const SETTINGS_KEYS: readonly SettingsKey[] = ['model', 'permissions', 'env', 'enabledPlugins'];

/**
 * Pick the configured settings keys a target supports.
 * Unsupported keys are reported as warnings and left out.
 *
 * @internal
 */
export function pickTargetSettings(
  config: TargetSettingsConfig | undefined,
  supported: readonly SettingsKey[],
  target: string,
  settingsPath: string
): { settings: Record<string, unknown>; warnings: FormatterWarning[] } {
  const settings: Record<string, unknown> = {};
  const warnings: FormatterWarning[] = [];
  if (!config) return { settings, warnings };

  for (const key of SETTINGS_KEYS) {
    const value = config[key];
    if (value === undefined) continue;
    if (!supported.includes(key)) {
      warnings.push({
        code: 'PS4002',
        message: `Target "${target}" does not support settings.${key}; it is not written to ${settingsPath}.`,
        suggestion: `Remove settings.${key} from the ${target} target or move it to a target that supports it.`,
      });
      continue;
    }
    if (key === 'permissions') {
      const permissions = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(([, rules]) => rules !== undefined)
      );
      if (Object.keys(permissions).length > 0) settings[key] = permissions;
      continue;
    }
    settings[key] = value;
  }

  return { settings, warnings };
}
