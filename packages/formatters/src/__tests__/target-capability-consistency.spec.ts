import { TARGET_DEFINITIONS, TARGET_DELEGATES } from '@promptscript/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_FORMATTERS } from '../builtin-formatters.js';
import {
  isCanonicalTarget,
  validateBuiltinFormatterCapabilities,
} from '../target-capability-consistency.js';

const target = 'github';
const definition = TARGET_DEFINITIONS[target];
const formatter = BUILTIN_FORMATTERS[target];
const formatterRegistry = BUILTIN_FORMATTERS as unknown as Record<string, unknown>;
const delegateRegistry = TARGET_DELEGATES as unknown as Record<string, string>;
const originalOutputPath = definition.outputPath;
const originalVersions = definition.versions;
const originalResources = definition.resources;
const originalSkillPath = { ...definition.skillPath };
const originalReferencesMode = definition.referencesMode;
const originalMcpConfigPath = definition.mcpConfigPath;
const originalMcpConfigFormat = definition.mcpConfigFormat;
const grokDefinition = TARGET_DEFINITIONS.grok;
const originalGrokFeatureSupport = grokDefinition.featureSupport;

afterEach(() => {
  Object.assign(definition, {
    outputPath: originalOutputPath,
    versions: originalVersions,
    resources: originalResources,
    referencesMode: originalReferencesMode,
    mcpConfigPath: originalMcpConfigPath,
    mcpConfigFormat: originalMcpConfigFormat,
  });
  Object.assign(definition.skillPath, originalSkillPath);
  Object.assign(grokDefinition, { featureSupport: originalGrokFeatureSupport });
  formatterRegistry[target] = formatter;
  delete delegateRegistry['not-a-known-target'];
  vi.restoreAllMocks();
});

function withoutMcpResource(): void {
  Object.assign(definition, {
    resources: definition.resources.filter((resource) => resource.kind !== 'mcp'),
  });
}

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

  it('skips delegate entries that are not canonical targets', () => {
    delegateRegistry['not-a-known-target'] = 'claude';

    expect(validateBuiltinFormatterCapabilities()).toEqual([]);
  });

  it('reports a formatter probe that throws an error', () => {
    vi.spyOn(formatter.prototype, 'format').mockImplementation(() => {
      throw new Error('probe exploded');
    });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: formatter probe for version "simple" failed: probe exploded`
    );
  });

  it('reports a formatter probe that throws a non-error value', () => {
    vi.spyOn(formatter.prototype, 'format').mockImplementation(() => {
      throw 'probe rejected';
    });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: formatter probe for version "simple" failed: probe rejected`
    );
  });

  it('reports emitted skills that have no canonical skill metadata', () => {
    Object.assign(definition.skillPath, { basePath: '' });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: formatter emits skills without canonical skill metadata`
    );
  });

  it('reports emitted MCP config that has no canonical MCP metadata', () => {
    Object.assign(definition, { mcpConfigPath: undefined });
    withoutMcpResource();

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: formatter emits MCP config without canonical MCP metadata`
    );
  });

  it('reports an MCP config path that differs from the target definition', () => {
    Object.assign(definition, { mcpConfigPath: '.other/mcp.json' });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: MCP config path ".vscode/mcp.json" differs from metadata`
    );
  });

  it('reports an MCP config format that differs from metadata', () => {
    Object.assign(definition, { mcpConfigFormat: 'toml' });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: MCP config format "json" differs from metadata`
    );
  });

  it('reports resource versions declared but never emitted', () => {
    const resources = definition.resources.map((resource) =>
      resource.kind === 'mcp'
        ? { ...resource, versions: [...resource.versions, 'simple'] }
        : resource
    );
    Object.assign(definition, { resources });

    expect(validateBuiltinFormatterCapabilities()).toContain(
      `${target}: mcp resource declares un-emitted version "simple"`
    );
  });
});

describe('isCanonicalTarget', () => {
  it('accepts canonical targets and rejects custom targets', () => {
    expect(isCanonicalTarget(target)).toBe(true);
    expect(isCanonicalTarget('custom-target')).toBe(false);
  });
});
