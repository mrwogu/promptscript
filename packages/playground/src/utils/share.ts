/**
 * URL sharing utilities for the playground.
 * Uses LZ-String compression for compact, shareable URLs.
 */

import LZString from 'lz-string';
import type { FileState, FormatterName, PlaygroundConfig, TargetSettings } from '../store';

/**
 * Partial config for URL - only stores non-default values.
 */
export interface PartialConfig {
  targets?: Partial<Record<FormatterName, Partial<TargetSettings>>>;
  formatting?: Partial<PlaygroundConfig['formatting']>;
  envVars?: Record<string, string>;
}

/**
 * Shareable state structure for URL encoding.
 */
export interface ShareableState {
  /** Files with their paths and content */
  files: Array<{ path: string; content: string }>;
  /** Entry file path */
  entry?: string;
  /** Active formatter */
  formatter?: FormatterName;
  /** Non-default config settings */
  config?: PartialConfig;
  /** Version for future compatibility */
  version: string;
}

const CURRENT_VERSION = '1';

/**
 * Default config values for comparison.
 */
const DEFAULT_CONFIG: PlaygroundConfig = {
  targets: {
    github: { enabled: true, version: 'full' },
    claude: { enabled: true, version: 'full' },
    cursor: { enabled: true, version: 'standard' },
    antigravity: { enabled: true, version: 'frontmatter' },
  },
  formatting: {
    tabWidth: 2,
    proseWrap: 'preserve',
    printWidth: 80,
  },
  envVars: {},
};

/**
 * Extract only non-default config values for compact URL storage.
 */
function getConfigDiff(config: PlaygroundConfig): PartialConfig | undefined {
  const diff: PartialConfig = {};

  // Check targets
  const targetsDiff: PartialConfig['targets'] = {};
  for (const [name, settings] of Object.entries(config.targets) as [
    FormatterName,
    TargetSettings,
  ][]) {
    const defaultSettings = DEFAULT_CONFIG.targets[name];
    const settingsDiff: Partial<TargetSettings> = {};

    if (settings.enabled !== defaultSettings.enabled) {
      settingsDiff.enabled = settings.enabled;
    }
    if (settings.version !== defaultSettings.version) {
      settingsDiff.version = settings.version;
    }
    if (settings.convention !== defaultSettings.convention) {
      settingsDiff.convention = settings.convention;
    }

    if (Object.keys(settingsDiff).length > 0) {
      targetsDiff[name] = settingsDiff;
    }
  }
  if (Object.keys(targetsDiff).length > 0) {
    diff.targets = targetsDiff;
  }

  // Check formatting
  const formattingDiff: Partial<PlaygroundConfig['formatting']> = {};
  if (config.formatting.tabWidth !== DEFAULT_CONFIG.formatting.tabWidth) {
    formattingDiff.tabWidth = config.formatting.tabWidth;
  }
  if (config.formatting.proseWrap !== DEFAULT_CONFIG.formatting.proseWrap) {
    formattingDiff.proseWrap = config.formatting.proseWrap;
  }
  if (config.formatting.printWidth !== DEFAULT_CONFIG.formatting.printWidth) {
    formattingDiff.printWidth = config.formatting.printWidth;
  }
  if (Object.keys(formattingDiff).length > 0) {
    diff.formatting = formattingDiff;
  }

  // Check envVars - include if any variables are defined
  if (config.envVars && Object.keys(config.envVars).length > 0) {
    diff.envVars = config.envVars;
  }

  return Object.keys(diff).length > 0 ? diff : undefined;
}

/**
 * Merge partial config with defaults to get full config.
 */
export function mergeConfigWithDefaults(partial?: PartialConfig): PlaygroundConfig {
  if (!partial) return { ...DEFAULT_CONFIG };

  const config: PlaygroundConfig = {
    targets: { ...DEFAULT_CONFIG.targets },
    formatting: { ...DEFAULT_CONFIG.formatting },
    envVars: { ...DEFAULT_CONFIG.envVars },
  };

  // Merge targets
  if (partial.targets) {
    for (const [name, settings] of Object.entries(partial.targets) as [
      FormatterName,
      Partial<TargetSettings>,
    ][]) {
      config.targets[name] = {
        ...config.targets[name],
        ...settings,
      };
    }
  }

  // Merge formatting
  if (partial.formatting) {
    config.formatting = {
      ...config.formatting,
      ...partial.formatting,
    };
  }

  // Merge envVars
  if (partial.envVars) {
    config.envVars = { ...partial.envVars };
  }

  return config;
}

/**
 * Encode playground state to a URL-safe compressed string.
 */
export function encodeState(
  files: FileState[],
  formatter?: FormatterName,
  entry?: string,
  config?: PlaygroundConfig
): string {
  const state: ShareableState = {
    files: files.map((f) => ({ path: f.path, content: f.content })),
    entry: entry ?? files[0]?.path,
    formatter,
    config: config ? getConfigDiff(config) : undefined,
    version: CURRENT_VERSION,
  };

  const json = JSON.stringify(state);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return compressed;
}

/**
 * Decode a compressed string back to playground state.
 */
export function decodeState(encoded: string): ShareableState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;

    const state = JSON.parse(json) as ShareableState;

    // Validate structure
    if (!state.files || !Array.isArray(state.files)) {
      return null;
    }

    // Ensure all files have required fields
    for (const file of state.files) {
      if (typeof file.path !== 'string' || typeof file.content !== 'string') {
        return null;
      }
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL from the current state.
 */
export function generateShareUrl(
  files: FileState[],
  formatter?: FormatterName,
  entry?: string,
  config?: PlaygroundConfig
): string {
  const encoded = encodeState(files, formatter, entry, config);
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  if (formatter) {
    url.searchParams.set('f', formatter);
  }
  return url.toString();
}

/**
 * Load state from the current URL if present.
 */
export function loadStateFromUrl(): ShareableState | null {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('s');

  if (!encoded) return null;

  const state = decodeState(encoded);
  if (!state) return null;

  // Override formatter if specified in URL
  const formatter = url.searchParams.get('f') as FormatterName | null;
  if (formatter) {
    state.formatter = formatter;
  }

  return state;
}

/**
 * Load example by ID from URL.
 */
export function getExampleIdFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get('e');
}

/**
 * Update the URL without reloading the page.
 */
export function updateUrlState(
  files: FileState[],
  formatter?: FormatterName,
  entry?: string,
  config?: PlaygroundConfig
): void {
  const encoded = encodeState(files, formatter, entry, config);
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  if (formatter) {
    url.searchParams.set('f', formatter);
  }
  // Remove example param when state is manually edited
  url.searchParams.delete('e');

  window.history.replaceState(null, '', url.toString());
}

/**
 * Clear state from URL.
 */
export function clearUrlState(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('s');
  url.searchParams.delete('f');
  url.searchParams.delete('e');
  window.history.replaceState(null, '', url.toString());
}

/**
 * Copy the share URL to clipboard.
 */
export async function copyShareUrl(
  files: FileState[],
  formatter?: FormatterName,
  entry?: string,
  config?: PlaygroundConfig
): Promise<boolean> {
  try {
    const url = generateShareUrl(files, formatter, entry, config);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
