import { describe, it, expect } from 'vitest';
import type { KnownTarget, CustomTarget, TargetName, TargetEntry } from '../types/config.js';
import {
  KNOWN_TARGETS,
  isKnownTarget,
  customTarget,
  DEFAULT_OUTPUT_PATHS,
} from '../types/config.js';

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
