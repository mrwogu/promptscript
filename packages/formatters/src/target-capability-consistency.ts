import {
  KNOWN_TARGETS,
  TARGET_DEFINITIONS,
  TARGET_DELEGATES,
  type KnownTarget,
  type Program,
} from '@promptscript/core';
import type { Formatter, FormatterClass, FormatterOutput } from './types.js';
import { BUILTIN_FORMATTERS } from './builtin-formatters.js';

const PROBE_LOCATION = { file: '<capability-probe>', line: 1, column: 1 };
const PROBE_SKILL_CONTENT = 'Capability probe skill content.';
const PROBE_MCP_URL = 'https://capability-probe.example/mcp';

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

    validateConditionalResources(target, formatter, versions, issues);
  }

  for (const [target, delegate] of Object.entries(TARGET_DELEGATES)) {
    const targetDefinition = TARGET_DEFINITIONS[target as KnownTarget];
    const delegateDefinition = TARGET_DEFINITIONS[delegate as KnownTarget];
    if (!targetDefinition || !delegateDefinition) continue;

    for (const [featureId, status] of Object.entries(delegateDefinition.featureSupport)) {
      if (targetDefinition.featureSupport[featureId] !== status) {
        issues.push(
          `${target}: feature "${featureId}" differs from delegated target "${delegate}"`
        );
      }
    }
  }

  return issues;
}

function validateConditionalResources(
  target: KnownTarget,
  formatter: Formatter,
  versions: Readonly<Record<string, unknown>>,
  issues: string[]
): void {
  const definition = TARGET_DEFINITIONS[target];
  const skillResource = definition.resources.find((resource) => resource.kind === 'skills');
  const mcpResource = definition.resources.find((resource) => resource.kind === 'mcp');
  const declaredSkillVersions = new Set(skillResource?.versions ?? []);
  const declaredMcpVersions = new Set(mcpResource?.versions ?? []);
  const actualSkillVersions = new Set<string>();
  const actualMcpVersions = new Set<string>();

  for (const version of Object.keys(versions)) {
    let output: FormatterOutput;
    try {
      output = formatter.format(createCapabilityProbeProgram(), { version });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`${target}: formatter probe for version "${version}" failed: ${message}`);
      continue;
    }

    const files = collectOutputFiles(output).slice(1);
    const skillFiles = files.filter((file) => file.content.includes(PROBE_SKILL_CONTENT));
    const mcpFiles = files.filter((file) => file.content.includes(PROBE_MCP_URL));

    if (skillFiles.length > 0) {
      actualSkillVersions.add(version);
      if (!skillResource || !definition.skillPath.basePath || !definition.skillPath.fileName) {
        issues.push(`${target}: formatter emits skills without canonical skill metadata`);
      } else {
        const expectedPrefix = `${definition.skillPath.basePath}/`;
        for (const file of skillFiles) {
          if (
            !file.path.startsWith(expectedPrefix) ||
            !file.path.endsWith(`/${definition.skillPath.fileName}`)
          ) {
            issues.push(`${target}: emitted skill path "${file.path}" differs from metadata`);
          }
        }
      }
    }

    if (mcpFiles.length > 0) {
      actualMcpVersions.add(version);
      if (!definition.mcpConfigPath || !mcpResource) {
        issues.push(`${target}: formatter emits MCP config without canonical MCP metadata`);
      } else {
        for (const file of mcpFiles) {
          if (file.path !== definition.mcpConfigPath) {
            issues.push(`${target}: MCP config path "${file.path}" differs from metadata`);
          }
          if (file.path !== mcpResource.path) {
            issues.push(`${target}: MCP config path "${file.path}" differs from resource metadata`);
          }
          const format = file.content.trimStart().startsWith('{') ? 'json' : 'toml';
          if (format !== definition.mcpConfigFormat) {
            issues.push(`${target}: MCP config format "${format}" differs from metadata`);
          }
        }
      }
    }
  }

  reportResourceVersionDrift(target, 'skills', declaredSkillVersions, actualSkillVersions, issues);
  reportResourceVersionDrift(target, 'mcp', declaredMcpVersions, actualMcpVersions, issues);
}

function reportResourceVersionDrift(
  target: KnownTarget,
  resourceKind: 'skills' | 'mcp',
  declaredVersions: ReadonlySet<string>,
  actualVersions: ReadonlySet<string>,
  issues: string[]
): void {
  for (const version of actualVersions) {
    if (!declaredVersions.has(version)) {
      issues.push(`${target}: ${resourceKind} resource omits emitted version "${version}"`);
    }
  }
  for (const version of declaredVersions) {
    if (!actualVersions.has(version)) {
      issues.push(`${target}: ${resourceKind} resource declares un-emitted version "${version}"`);
    }
  }
}

function collectOutputFiles(output: FormatterOutput): FormatterOutput[] {
  const files = [output];
  for (const additionalFile of output.additionalFiles ?? []) {
    files.push(...collectOutputFiles(additionalFile));
  }
  return files;
}

function createCapabilityProbeProgram(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc: PROBE_LOCATION,
    blocks: [
      {
        type: 'Block',
        name: 'skills',
        content: {
          type: 'ObjectContent',
          properties: {
            'capability-probe': {
              description: 'Capability probe skill',
              content: PROBE_SKILL_CONTENT,
            },
          },
          loc: PROBE_LOCATION,
        },
        loc: PROBE_LOCATION,
      },
      {
        type: 'Block',
        name: 'mcpServers',
        content: {
          type: 'ObjectContent',
          properties: {
            'capability-probe': { url: PROBE_MCP_URL },
          },
          loc: PROBE_LOCATION,
        },
        loc: PROBE_LOCATION,
      },
    ],
  };
}

/**
 * Narrow a string to a known target for callers validating external registries.
 */
export function isCanonicalTarget(value: string): value is KnownTarget {
  return (KNOWN_TARGETS as readonly string[]).includes(value);
}
