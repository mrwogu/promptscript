import type { BuildProfileConfig, PromptScriptConfig } from '@promptscript/core';

function isBuildProfile(value: unknown): value is BuildProfileConfig {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getBuildProfiles(config: PromptScriptConfig): Record<string, BuildProfileConfig> {
  const builds: unknown = config.builds;
  if (builds === undefined) {
    return {};
  }
  if (builds === null || typeof builds !== 'object' || Array.isArray(builds)) {
    throw new Error('config.builds must be an object');
  }

  const profiles = Object.create(null) as Record<string, BuildProfileConfig>;
  for (const [name, profile] of Object.entries(builds as Record<string, unknown>)) {
    if (!isBuildProfile(profile)) {
      throw new Error(`Build profile "${name}" must be an object`);
    }
    profiles[name] = profile;
  }
  return profiles;
}

export function getBuildProfile(
  config: PromptScriptConfig,
  buildName: string | undefined
): BuildProfileConfig | undefined {
  if (buildName === undefined) return undefined;

  const builds = getBuildProfiles(config);
  if (!Object.hasOwn(builds, buildName)) {
    const available = Object.keys(builds);
    const suffix =
      available.length > 0 ? ` Available build profiles: ${available.join(', ')}.` : '';
    throw new Error(`Unknown build profile: ${buildName}.${suffix}`);
  }

  return builds[buildName]!;
}

export function getEffectiveEntryPaths(config: PromptScriptConfig): string[] {
  const configuredDefaultEntry = config.input?.entry;
  const defaultEntry =
    typeof configuredDefaultEntry === 'string' && configuredDefaultEntry.trim().length > 0
      ? configuredDefaultEntry
      : '.promptscript/project.prs';
  const entries = new Set<string>();

  if ((config.targets?.length ?? 0) > 0) {
    entries.add(defaultEntry);
  }

  for (const profile of Object.values(config.builds ?? {})) {
    if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
      if (profile.entry === undefined) {
        entries.add(defaultEntry);
      } else if (typeof profile.entry === 'string' && profile.entry.trim().length > 0) {
        entries.add(profile.entry);
      }
    }
  }

  if (entries.size === 0) {
    entries.add(defaultEntry);
  }

  return [...entries];
}
