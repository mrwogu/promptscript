import { describe, it, expect } from 'vitest';
import type { KnownTarget, CustomTarget, TargetName, TargetEntry } from '../types/config.js';
import {
  KNOWN_TARGETS,
  isKnownTarget,
  customTarget,
  DEFAULT_OUTPUT_PATHS,
} from '../types/config.js';
import {
  TARGET_DEFINITIONS,
  getDefaultOutputPath,
  getTargetDefinition,
  validateTargetDefinitionConsistency,
  getTargetFeatures,
  getTargetSkillPath,
  getTargetCapability,
  assertTargetDefinitionConsistency,
  type TargetDefinition,
} from '../target-catalog.js';
import {
  assertValidTargetCapabilities,
  getTargetFeatureStatus,
  getTargetSectionCapability,
  resolveTargetVersion,
  validateTargetCapabilities,
  type TargetCapability,
} from '../target-capabilities.js';

describe('TargetName branded type', () => {
  describe('KnownTarget', () => {
    it('should accept all known target literals', () => {
      // Arrange & Act
      const targets: KnownTarget[] = [
        'github',
        'claude',
        'cursor',
        'antigravity',
        'factory',
        'opencode',
        'gemini',
        'windsurf',
        'cline',
        'roo',
        'codex',
        'continue',
        'augment',
        'goose',
        'kilo',
        'amp',
        'trae',
        'junie',
        'kiro',
        'cortex',
        'crush',
        'command-code',
        'kode',
        'mcpjam',
        'mistral-vibe',
        'mux',
        'openhands',
        'pi',
        'qoder',
        'qwen-code',
        'zencoder',
        'neovate',
        'pochi',
        'adal',
        'iflow',
        'openclaw',
        'codebuddy',
        // AGENTS.md-only targets
        'aider',
        'amazon-q',
        'warp',
        'zed',
        'jules',
        'devin',
        // Grok Build
        'grok',
        // Priority B CLI agents
        'kimi',
        'mimo',
        'deep-agents',
        'forgecode',
        'hermes',
      ];

      // Assert
      expect(targets).toHaveLength(KNOWN_TARGETS.length);
    });

    it('should be assignable to TargetName', () => {
      // Arrange
      const known: KnownTarget = 'github';

      // Act
      const target: TargetName = known;

      // Assert
      expect(target).toBe('github');
    });
  });

  describe('CustomTarget', () => {
    it('should be creatable via customTarget()', () => {
      // Arrange & Act
      const custom: CustomTarget = customTarget('my-custom-tool');

      // Assert
      expect(custom).toBe('my-custom-tool');
    });

    it('should be assignable to TargetName', () => {
      // Arrange
      const custom: CustomTarget = customTarget('my-tool');

      // Act
      const target: TargetName = custom;

      // Assert
      expect(target).toBe('my-tool');
    });

    it('should work as a string at runtime', () => {
      // Arrange
      const custom = customTarget('my-formatter');

      // Act & Assert
      expect(custom.toLowerCase()).toBe('my-formatter');
      expect(custom.length).toBe(12);
      expect(`target: ${custom}`).toBe('target: my-formatter');
    });
  });

  describe('TargetName', () => {
    it('should accept known targets directly', () => {
      // Arrange & Act
      const target: TargetName = 'claude';

      // Assert
      expect(target).toBe('claude');
    });

    it('should accept custom targets via customTarget()', () => {
      // Arrange & Act
      const target: TargetName = customTarget('enterprise-tool');

      // Assert
      expect(target).toBe('enterprise-tool');
    });

    it('should work in TargetEntry as a string', () => {
      // Arrange & Act
      const entries: TargetEntry[] = ['github', 'claude', customTarget('my-tool')];

      // Assert
      expect(entries).toHaveLength(3);
    });

    it('should work in TargetEntry as an object key', () => {
      // Arrange & Act
      const entries: TargetEntry[] = [
        { github: { convention: 'xml' } },
        { claude: { output: 'custom/CLAUDE.md' } },
      ];

      // Assert
      expect(entries).toHaveLength(2);
    });
  });

  describe('KNOWN_TARGETS', () => {
    it('should contain all known target names', () => {
      // Arrange & Act & Assert
      expect(KNOWN_TARGETS).toContain('github');
      expect(KNOWN_TARGETS).toContain('claude');
      expect(KNOWN_TARGETS).toContain('cursor');
      expect(KNOWN_TARGETS).toContain('antigravity');
      expect(KNOWN_TARGETS).toContain('factory');
      expect(KNOWN_TARGETS).toContain('opencode');
      expect(KNOWN_TARGETS).toContain('gemini');
    });

    it('should contain tier 1 targets', () => {
      // Assert
      expect(KNOWN_TARGETS).toContain('windsurf');
      expect(KNOWN_TARGETS).toContain('cline');
      expect(KNOWN_TARGETS).toContain('roo');
      expect(KNOWN_TARGETS).toContain('codex');
      expect(KNOWN_TARGETS).toContain('continue');
    });

    it('should contain tier 2 targets', () => {
      // Assert
      expect(KNOWN_TARGETS).toContain('augment');
      expect(KNOWN_TARGETS).toContain('goose');
      expect(KNOWN_TARGETS).toContain('kilo');
      expect(KNOWN_TARGETS).toContain('amp');
      expect(KNOWN_TARGETS).toContain('trae');
      expect(KNOWN_TARGETS).toContain('junie');
      expect(KNOWN_TARGETS).toContain('kiro');
    });

    it('should contain tier 3 targets', () => {
      // Assert
      expect(KNOWN_TARGETS).toContain('cortex');
      expect(KNOWN_TARGETS).toContain('crush');
      expect(KNOWN_TARGETS).toContain('command-code');
      expect(KNOWN_TARGETS).toContain('kode');
      expect(KNOWN_TARGETS).toContain('codebuddy');
    });

    it('should be readonly', () => {
      // Assert - the array should not be mutable at runtime
      expect(Object.isFrozen(KNOWN_TARGETS)).toBe(false); // as const doesn't freeze
      expect(Array.isArray(KNOWN_TARGETS)).toBe(true);
    });

    it('should have a corresponding DEFAULT_OUTPUT_PATHS entry for each known target', () => {
      // Arrange & Act & Assert
      for (const target of KNOWN_TARGETS) {
        expect(DEFAULT_OUTPUT_PATHS[target]).toBeDefined();
      }
    });
  });

  describe('isKnownTarget', () => {
    it('should return true for known targets', () => {
      // Arrange & Act & Assert
      expect(isKnownTarget('github')).toBe(true);
      expect(isKnownTarget('claude')).toBe(true);
      expect(isKnownTarget('cursor')).toBe(true);
      expect(isKnownTarget('windsurf')).toBe(true);
      expect(isKnownTarget('codebuddy')).toBe(true);
    });

    it('should return false for custom/unknown targets', () => {
      // Arrange & Act & Assert
      expect(isKnownTarget('my-custom-tool')).toBe(false);
      expect(isKnownTarget('enterprise-formatter')).toBe(false);
      expect(isKnownTarget('')).toBe(false);
      expect(isKnownTarget('GITHUB')).toBe(false); // case-sensitive
    });

    it('should narrow TargetName to KnownTarget', () => {
      // Arrange
      const target: TargetName = 'github';

      // Act & Assert
      if (isKnownTarget(target)) {
        // TypeScript should narrow this to KnownTarget
        const known: KnownTarget = target;
        expect(known).toBe('github');
      } else {
        // Should not reach here for 'github'
        expect.unreachable('github should be a known target');
      }
    });

    it('should identify custom targets as not known', () => {
      // Arrange
      const target: TargetName = customTarget('my-tool');

      // Act & Assert
      if (isKnownTarget(target)) {
        expect.unreachable('custom target should not be known');
      } else {
        expect(target).toBe('my-tool');
      }
    });
  });

  describe('customTarget', () => {
    it('should create a CustomTarget from a string', () => {
      // Arrange & Act
      const result = customTarget('my-formatter');

      // Assert
      expect(result).toBe('my-formatter');
    });

    it('should preserve the string value', () => {
      // Arrange
      const name = 'enterprise-ai-tool';

      // Act
      const result = customTarget(name);

      // Assert
      expect(result).toBe(name);
      expect(typeof result).toBe('string');
    });

    it('should work with registerFormatter-style usage', () => {
      // Arrange - simulate how a user would register a custom formatter
      const customName = customTarget('my-tool');
      const registry: Record<string, string> = {};

      // Act
      registry[customName] = 'formatter-instance';

      // Assert
      expect(registry['my-tool']).toBe('formatter-instance');
    });
  });

  describe('backward compatibility', () => {
    it('should allow known target strings in TargetEntry arrays', () => {
      // Arrange & Act - this pattern is used throughout the codebase
      const targets: TargetEntry[] = ['github', 'claude', 'cursor'];

      // Assert
      expect(targets).toHaveLength(3);
    });

    it('should allow object entries with known target keys', () => {
      // Arrange & Act
      const targets: TargetEntry[] = [
        { github: { enabled: true } },
        { claude: { convention: 'xml' } },
      ];

      // Assert
      expect(targets).toHaveLength(2);
    });

    it('should allow mixed string and object targets', () => {
      // Arrange & Act
      const targets: TargetEntry[] = ['github', { claude: { convention: 'xml' } }, 'cursor'];

      // Assert
      expect(targets).toHaveLength(3);
    });

    it('should allow custom targets in TargetEntry via customTarget()', () => {
      // Arrange & Act
      const targets: TargetEntry[] = ['github', customTarget('my-tool')];

      // Assert
      expect(targets).toHaveLength(2);
    });
  });
});

describe('Target catalog integrity', () => {
  it('should expose target catalog values through accessors', () => {
    expect(getTargetDefinition('claude')).toEqual(TARGET_DEFINITIONS.claude);
    expect(getDefaultOutputPath('claude')).toBe('CLAUDE.md');
    expect(getTargetSkillPath('claude')).toEqual({
      basePath: '.claude/skills',
      fileName: 'SKILL.md',
    });
    expect(getTargetFeatures('claude')).toEqual({
      defaultEnabled: true,
      defaultVersion: 'full',
      hasSkills: true,
      hasAgents: true,
      hasCommands: true,
    });
  });

  it('should reject unknown targets through the catalog accessor', () => {
    const unknownTarget = 'unknown-target' as unknown as KnownTarget;

    expect(() => getTargetDefinition(unknownTarget)).toThrow('Unknown target: unknown-target');
  });

  it('should have a TARGET_DEFINITIONS entry for every KNOWN_TARGET', () => {
    for (const target of KNOWN_TARGETS) {
      expect(TARGET_DEFINITIONS[target], `Missing catalog entry for ${target}`).toBeDefined();
    }
  });

  it('should have a non-empty outputPath for every target', () => {
    for (const target of KNOWN_TARGETS) {
      const def = TARGET_DEFINITIONS[target];
      expect(def.outputPath.length, `${target} has empty outputPath`).toBeGreaterThan(0);
    }
  });

  it('should have a valid family for every target', () => {
    const validFamilies = ['base', 'markdown-instruction', 'simple', 'agents-md-only'];
    for (const target of KNOWN_TARGETS) {
      const def = TARGET_DEFINITIONS[target];
      expect(validFamilies, `${target} has invalid family`).toContain(def.family);
    }
  });

  it('should have a default feature profile for every target', () => {
    for (const target of KNOWN_TARGETS) {
      const def = TARGET_DEFINITIONS[target];
      expect(def.features.defaultEnabled, `${target} missing defaultEnabled`).toBeDefined();
      expect(def.features.defaultVersion, `${target} missing defaultVersion`).toBeDefined();
      expect(typeof def.features.hasSkills).toBe('boolean');
      expect(typeof def.features.hasAgents).toBe('boolean');
      expect(typeof def.features.hasCommands).toBe('boolean');
    }
  });

  it('should have DEFAULT_OUTPUT_PATHS consistent with TARGET_DEFINITIONS', () => {
    const mismatches: string[] = [];
    for (const target of KNOWN_TARGETS) {
      const catalogPath = TARGET_DEFINITIONS[target].outputPath;
      const configPath = DEFAULT_OUTPUT_PATHS[target];
      if (configPath !== catalogPath) {
        mismatches.push(`${target}: catalog=${catalogPath} config=${configPath}`);
      }
    }
    expect(mismatches, `Path mismatches:\n${mismatches.join('\n')}`).toHaveLength(0);
  });

  it('should have no extra entries in TARGET_DEFINITIONS beyond KNOWN_TARGETS', () => {
    const catalogKeys = Object.keys(TARGET_DEFINITIONS);
    expect(catalogKeys).toHaveLength(KNOWN_TARGETS.length);
  });

  it('should have complete and consistent capability metadata', () => {
    expect(validateTargetCapabilities(TARGET_DEFINITIONS)).toEqual([]);
    expect(validateTargetDefinitionConsistency()).toEqual([]);
  });

  it('should resolve version aliases through the capability contract', () => {
    const capability = getTargetCapability('cursor');

    expect(resolveTargetVersion(capability, 'standard')).toBe('modern');
    expect(resolveTargetVersion(capability, undefined)).toBe('modern');
    expect(resolveTargetVersion(capability, 'unknown')).toBe('modern');
    expect(getTargetFeatureStatus(capability, 'missing')).toBe('not-supported');
    expect(getTargetSectionCapability(capability, 'commands')?.support).toBe('required');
    expect(getTargetSectionCapability(capability, 'missing')).toBeUndefined();
  });

  it('should reject incomplete resource contracts', () => {
    const incomplete = {
      ...TARGET_DEFINITIONS.github,
      resources: [],
    };

    const issues = validateTargetCapabilities({
      ...TARGET_DEFINITIONS,
      github: incomplete,
    });

    expect(issues).toContain('github: main output resource is missing');
    expect(issues).toContain('github: MCP config resource is missing');
    expect(issues).toContain('github: hook config resource is missing');
  });

  it('should report each malformed capability category', () => {
    const malformed = {
      ...TARGET_DEFINITIONS.github,
      defaultVersion: 'missing',
      versions: {},
      versionAliases: { stale: 'missing' },
      featureSupport: { invalid: 'invalid' },
      sections: {},
      resources: [
        { kind: 'skills' as const, path: '', versions: [] },
        { kind: 'skills' as const, path: '', versions: ['missing', 'missing'] },
      ],
      mcpConfigPath: '.missing/mcp.json',
      mcpConfigFormat: 'json' as const,
      hooks: {
        ...TARGET_DEFINITIONS.github.hooks,
        configPath: '.missing/hooks.json',
      },
    } as unknown as TargetCapability;
    const missingHook = {
      ...TARGET_DEFINITIONS.claude,
      hooks: undefined,
    } as unknown as TargetCapability;
    const malformedMcpFormat = {
      ...TARGET_DEFINITIONS.gemini,
      mcpConfigPath: null,
      mcpConfigFormat: 'json' as const,
    };
    const capabilities = {
      ...TARGET_DEFINITIONS,
      github: malformed,
      claude: missingHook,
      gemini: malformedMcpFormat,
    };

    const issues = validateTargetCapabilities(capabilities);

    expect(issues).toContain('github: no versions are declared');
    expect(issues).toContain('github: default version "missing" is not declared');
    expect(issues).toContain('github: version alias "stale" points to "missing"');
    expect(issues).toContain('github: feature "invalid" has invalid status "invalid"');
    expect(issues).toContain('github: feature "markdown-output" is missing');
    expect(issues).toContain('github: section "project-identity" is missing');
    expect(issues).toContain('github: resource paths are duplicated');
    expect(issues).toContain('github: main output resource is missing');
    expect(issues).toContain('github: skills resource path is empty');
    expect(issues).toContain('github: skills resource has no versions');
    expect(issues).toContain('github: skills resource versions are duplicated');
    expect(issues).toContain('github: skills resource uses unknown version "missing"');
    expect(issues).toContain('github: MCP config resource is missing');
    expect(issues).toContain('github: hook config resource is missing');
    expect(issues).toContain('claude: hook capability is missing');
    expect(issues).toContain('gemini: MCP config format is declared without a path');
    expect(validateTargetCapabilities({})).toContain('github: capability entry is missing');
    expect(() => assertValidTargetCapabilities(capabilities)).toThrow(
      'Invalid target capability registry'
    );
  });

  it('should report contradictory target definitions', () => {
    const definition = TARGET_DEFINITIONS.github;
    const brokenDefinition = {
      ...definition,
      name: 'claude' as KnownTarget,
      outputPath: 'wrong.md',
      skillPath: { basePath: '.github/skills', fileName: 'SKILL.md' },
      features: {
        ...definition.features,
        hasSkills: false,
        hasAgents: false,
        hasCommands: false,
        defaultVersion: 'missing',
      },
      versions: {},
      featureSupport: {
        ...definition.featureSupport,
        skills: 'supported' as const,
        'agent-instructions': 'supported' as const,
        'slash-commands': 'supported' as const,
      },
    };
    const definitions = {
      ...TARGET_DEFINITIONS,
      github: brokenDefinition,
    };

    const typedDefinitions = definitions as unknown as Readonly<
      Record<KnownTarget, TargetDefinition>
    >;
    const issues = validateTargetDefinitionConsistency(typedDefinitions);

    expect(issues).toContain('github: definition name is "claude"');
    expect(issues).toContain('github: output path does not match the canonical path map');
    expect(issues).toContain('github: skill feature flag does not match the skill path');
    expect(issues).toContain('github: default version "missing" is not supported');
    expect(issues).toContain('github: skills are marked supported without a skill path');
    expect(issues).toContain(
      'github: agent instructions are marked supported without agent output'
    );
    expect(issues).toContain('github: slash commands are marked supported without command output');
    expect(() => assertTargetDefinitionConsistency(typedDefinitions)).toThrow(
      'Inconsistent target catalog'
    );
  });
});
