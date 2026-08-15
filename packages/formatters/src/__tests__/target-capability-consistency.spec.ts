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
const originalResources = definition.resources;
const originalSkillPath = { ...definition.skillPath };
const originalReferencesMode = definition.referencesMode;
const grokDefinition = TARGET_DEFINITIONS.grok;
const originalGrokFeatureSupport = grokDefinition.featureSupport;

afterEach(() => {
  Object.assign(definition, {
    outputPath: originalOutputPath,
    versions: originalVersions,
    resources: originalResources,
    referencesMode: originalReferencesMode,
  });
  Object.assign(definition.skillPath, originalSkillPath);
  Object.assign(grokDefinition, { featureSupport: originalGrokFeatureSupport });
  formatterRegistry[target] = formatter;
});

describe('built-in formatter capability metadata', () => {
  it('matches formatter paths, conditional resources, and feature metadata', () => {
    expect(validateBuiltinFormatterCapabilities()).toEqual([]);
  });

  it('matches every emitted MCP config to canonical metadata', () => {
    expect(validateBuiltinFormatterCapabilities()).toEqual([]);
  });

  it('matches declared skill support to formatter emission', () => {
    expect(validateBuiltinFormatterCapabilities()).toEqual([]);
  });

  it('requires canonical MCP metadata for emitted config files', () => {
    const resources = definition.resources.map((resource) =>
      resource.kind === 'mcp' ? { ...resource, path: '.wrong/mcp.json' } : resource
    );
    Object.assign(definition, { resources });

    const issues = validateBuiltinFormatterCapabilities();
    expect(issues).toContain(
      `${target}: MCP config path ".vscode/mcp.json" differs from resource metadata`
    );
  });

  it('requires resource versions to match formatter emission', () => {
    const resources = definition.resources.map((resource) =>
      resource.kind === 'mcp' ? { ...resource, versions: [] } : resource
    );
    Object.assign(definition, { resources });

    const issues = validateBuiltinFormatterCapabilities();
    expect(issues).toContain(`${target}: mcp resource omits emitted version "full"`);
  });

  it('requires delegated targets to inherit feature flags', () => {
    Object.assign(grokDefinition, {
      featureSupport: {
        ...grokDefinition.featureSupport,
        workflows: 'not-supported',
      },
    });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      'grok: feature "workflows" differs from delegated target "claude"'
    );
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
      `${target}: emitted skill path ".github/skills/capability-probe/SKILL.md" differs from metadata`,
    ]);
  });
});

describe('isCanonicalTarget', () => {
  it('accepts canonical targets and rejects custom targets', () => {
    expect(isCanonicalTarget(target)).toBe(true);
    expect(isCanonicalTarget('custom-target')).toBe(false);
  });
});
