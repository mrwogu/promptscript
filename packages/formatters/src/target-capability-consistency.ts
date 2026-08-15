import { KNOWN_TARGETS, TARGET_DEFINITIONS, type KnownTarget } from '@promptscript/core';
import type { FormatterClass } from './types.js';
import { BUILTIN_FORMATTERS } from './builtin-formatters.js';

/**
 * Find drift between canonical target metadata and formatter registrations.
 *
 * The returned messages are intended for CI assertions and include the target
 * and metadata field that needs correction.
 */
export function validateBuiltinFormatterCapabilities(): string[] {
  const issues: string[] = [];

  for (const target of KNOWN_TARGETS) {
    const definition = TARGET_DEFINITIONS[target];
    const formatterClass = BUILTIN_FORMATTERS[target] as FormatterClass | undefined;

    if (!formatterClass) {
      issues.push(`${target}: formatter registration is missing`);
      continue;
    }

    const formatter = new formatterClass();
    const versions = formatterClass.getSupportedVersions();
    const declaredVersions = new Set(Object.keys(definition.versions));
    const formatterVersions = new Set(Object.keys(versions));

    for (const version of declaredVersions) {
      if (!formatterVersions.has(version)) {
        issues.push(`${target}: version "${version}" is missing from the formatter`);
      }
    }
    for (const version of formatterVersions) {
      if (!declaredVersions.has(version)) {
        issues.push(`${target}: formatter version "${version}" is missing from metadata`);
      }
    }

    for (const version of formatterVersions) {
      const formatterVersion = versions[version];
      const declaredVersion = definition.versions[version];
      if (!formatterVersion || !declaredVersion) continue;
      if (formatterVersion.outputPath !== declaredVersion.outputPath) {
        issues.push(`${target}: version "${version}" output path differs`);
      }
    }

    if (formatter.outputPath !== definition.outputPath) {
      issues.push(`${target}: formatter output path differs from metadata`);
    }
    if (formatter.getSkillBasePath() !== definition.skillPath.basePath) {
      issues.push(`${target}: skill base path differs from metadata`);
    }
    if (formatter.getSkillFileName() !== definition.skillPath.fileName) {
      issues.push(`${target}: skill file name differs from metadata`);
    }
    if (formatter.referencesMode() !== definition.referencesMode) {
      issues.push(`${target}: reference mode differs from metadata`);
    }
  }

  return issues;
}

/**
 * Narrow a string to a known target for callers validating external registries.
 */
export function isCanonicalTarget(value: string): value is KnownTarget {
  return (KNOWN_TARGETS as readonly string[]).includes(value);
}
