import { TARGET_DEFINITIONS } from '@promptscript/core';
import { afterEach, describe, expect, it } from 'vitest';
import { BUILTIN_FORMATTERS } from '../builtin-formatters.js';
import {
  isCanonicalTarget,
  validateBuiltinFormatterCapabilities,
} from '../target-capability-consistency.js';

const target = 'github';
const definition = TARGET_DEFINITIONS[target];
const formatter = BUILTIN_FORMATTERS[target];
const formatterRegistry = BUILTIN_FORMATTERS as unknown as Record<string, unknown>;
const originalOutputPath = definition.outputPath;
const originalVersions = definition.versions;
const originalSkillPath = { ...definition.skillPath };
const originalReferencesMode = definition.referencesMode;

afterEach(() => {
  Object.assign(definition, {
    outputPath: originalOutputPath,
    versions: originalVersions,
    referencesMode: originalReferencesMode,
  });
  Object.assign(definition.skillPath, originalSkillPath);
  formatterRegistry[target] = formatter;
});

describe('built-in formatter capability metadata', () => {
  it('matches every registered formatter', () => {
    expect(validateBuiltinFormatterCapabilities()).toEqual([]);
  });

  it('reports missing formatter registrations', () => {
    formatterRegistry[target] = undefined;

    expect(validateBuiltinFormatterCapabilities()).toEqual([
      `${target}: formatter registration is missing`,
    ]);
  });

  it('reports version drift between metadata and formatter', () => {
    const versions = { ...originalVersions };
    const simple = versions['simple'];
    const full = versions['full'];
    if (!simple || !full) {
      throw new Error('GitHub formatter versions are incomplete');
    }
    delete versions['full'];
    versions['simple'] = { ...simple, outputPath: 'metadata.md' };
    versions['metadataOnly'] = { ...full, name: 'metadataOnly', outputPath: 'metadata.md' };
    Object.assign(definition, { versions });

    expect(validateBuiltinFormatterCapabilities()).toEqual([
      `${target}: version "metadataOnly" is missing from the formatter`,
      `${target}: formatter version "full" is missing from metadata`,
      `${target}: version "simple" output path differs`,
    ]);
  });

  it('reports formatter metadata field drift', () => {
    Object.assign(definition, {
      outputPath: 'formatter.md',
      referencesMode: originalReferencesMode === 'directory' ? 'inline' : 'directory',
    });
    Object.assign(definition.skillPath, {
      basePath: '.other/skills',
      fileName: 'skill.md',
    });

    expect(validateBuiltinFormatterCapabilities()).toEqual([
      `${target}: formatter output path differs from metadata`,
      `${target}: skill base path differs from metadata`,
      `${target}: skill file name differs from metadata`,
      `${target}: reference mode differs from metadata`,
    ]);
  });
});

describe('isCanonicalTarget', () => {
  it('accepts canonical targets and rejects custom targets', () => {
    expect(isCanonicalTarget(target)).toBe(true);
    expect(isCanonicalTarget('custom-target')).toBe(false);
  });
});
