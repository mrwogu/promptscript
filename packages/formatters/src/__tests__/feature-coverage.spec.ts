import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { GitHubFormatter } from '../formatters/github.js';
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
import type { Formatter } from '../types.js';
import {
  FEATURE_MATRIX,
  getToolFeatures,
  getFeatureCoverage,
  toolSupportsFeature,
  getPlannedFeatures,
  getFeaturesByCategory,
  getToolComparison,
  identifyFeatureGaps,
  generateFeatureMatrixReport,
  type ToolName,
} from '../feature-matrix.js';

/**
 * Feature Coverage Tests
 *
 * These tests verify that formatters correctly implement
 * the features defined in the Feature Coverage Matrix.
 */

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

function createTestAST(): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc: createLoc(),
    meta: {
      type: 'MetaBlock',
      fields: {
        id: 'test-project',
        syntax: '1.0.0',
        name: 'Test Project',
        description: 'A test project for feature coverage',
      },
      loc: createLoc(),
    },
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'You are a TypeScript developer.',
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'context',
        content: {
          type: 'MixedContent',
          properties: {
            languages: ['typescript'],
            runtime: 'Node.js 20+',
          },
          text: {
            type: 'TextContent',
            value: `## Architecture

\`\`\`mermaid
flowchart TB
  A --> B --> C
\`\`\``,
            loc: createLoc(),
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'guards',
        content: {
          type: 'ObjectContent',
          properties: {
            globs: ['*.ts', '*.tsx'],
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'shortcuts',
        content: {
          type: 'ObjectContent',
          properties: {
            '/test': 'Run tests',
            '/deploy': {
              description: 'Deploy workflow',
              steps: ['Build', 'Test', 'Deploy'],
            },
          },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'restrictions',
        content: {
          type: 'ArrayContent',
          elements: ['Never use any type'],
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };
}

describe('Feature Coverage Matrix', () => {
  describe('Matrix Integrity', () => {
    it('should have unique feature IDs', () => {
      const ids = FEATURE_MATRIX.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields for each feature', () => {
      for (const feature of FEATURE_MATRIX) {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
        expect(feature.description).toBeDefined();
        expect(feature.category).toBeDefined();
        expect(feature.tools).toBeDefined();
        expect(feature.tools.github).toBeDefined();
        expect(feature.tools.cursor).toBeDefined();
        expect(feature.tools.claude).toBeDefined();
        expect(feature.tools.antigravity).toBeDefined();
      }
    });

    it('should have valid status values', () => {
      const validStatuses = ['supported', 'not-supported', 'planned', 'partial'];

      for (const feature of FEATURE_MATRIX) {
        for (const [tool, status] of Object.entries(feature.tools)) {
          expect(
            validStatuses,
            `Invalid status "${status}" for ${feature.id} in ${tool}`
          ).toContain(status);
        }
      }
    });
  });

  describe('Coverage Summary', () => {
    it.each(['github', 'cursor', 'claude', 'antigravity'] as ToolName[])(
      '%s should have valid coverage summary',
      (tool) => {
        const coverage = getFeatureCoverage(tool);

        expect(coverage.tool).toBe(tool);
        expect(coverage.total).toBe(FEATURE_MATRIX.length);
        expect(
          coverage.supported + coverage.partial + coverage.planned + coverage.notSupported
        ).toBe(coverage.total);
        expect(coverage.coveragePercent).toBeGreaterThanOrEqual(0);
        expect(coverage.coveragePercent).toBeLessThanOrEqual(100);
      }
    );

    it('cursor should have highest feature coverage (most features)', () => {
      const cursorCoverage = getFeatureCoverage('cursor');
      const githubCoverage = getFeatureCoverage('github');

      expect(cursorCoverage.supported).toBeGreaterThanOrEqual(githubCoverage.supported);
    });
  });
});

describe('Feature Implementation Tests', () => {
  const formatters: Map<ToolName, Formatter> = new Map();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    formatters.clear();
    formatters.set('github', new GitHubFormatter());
    formatters.set('claude', new ClaudeFormatter());
    formatters.set('cursor', new CursorFormatter());
    formatters.set('antigravity', new AntigravityFormatter());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('markdown-output', () => {
    it.each(['github', 'cursor', 'claude', 'antigravity'] as ToolName[])(
      '%s should produce valid markdown',
      (tool) => {
        if (!toolSupportsFeature(tool, 'markdown-output')) return;

        const formatter = formatters.get(tool)!;
        const result = formatter.format(createTestAST());

        // Should have headers
        expect(result.content).toMatch(/^#|##/m);

        // Should have content
        expect(result.content.length).toBeGreaterThan(100);
      }
    );
  });

  describe('code-blocks', () => {
    it.each(['github', 'cursor', 'claude', 'antigravity'] as ToolName[])(
      '%s should support code blocks',
      (tool) => {
        if (!toolSupportsFeature(tool, 'code-blocks')) return;

        const formatter = formatters.get(tool)!;
        const ast = createTestAST();

        // Add knowledge with code block
        ast.blocks.push({
          type: 'Block',
          name: 'knowledge',
          content: {
            type: 'TextContent',
            value: '## Commands\n\n```bash\npnpm install\n```',
            loc: createLoc(),
          },
          loc: createLoc(),
        });

        const result = formatter.format(ast);

        // Should preserve code blocks
        expect(result.content).toContain('```');
      }
    );
  });

  describe('mermaid-diagrams', () => {
    it.each(['github', 'cursor', 'claude', 'antigravity'] as ToolName[])(
      '%s should preserve mermaid diagrams',
      (tool) => {
        if (!toolSupportsFeature(tool, 'mermaid-diagrams')) return;

        const formatter = formatters.get(tool)!;
        const result = formatter.format(createTestAST());

        // Should have mermaid block or reference to diagram
        const hasMermaid =
          result.content.includes('```mermaid') ||
          result.content.includes('flowchart') ||
          result.content.includes('Mermaid');

        expect(hasMermaid, `${tool} should support mermaid diagrams`).toBe(true);
      }
    );
  });

  describe('yaml-frontmatter', () => {
    it('cursor should support frontmatter', () => {
      const formatter = formatters.get('cursor')!;
      const result = formatter.format(createTestAST(), { version: 'frontmatter' });

      expect(result.content).toMatch(/^---\n/);
      expect(result.content).toMatch(/\n---\n/);
    });

    it('antigravity should support frontmatter', () => {
      const formatter = formatters.get('antigravity')!;
      const result = formatter.format(createTestAST(), { version: 'frontmatter' });

      expect(result.content).toMatch(/^---\n/);
      expect(result.content).toContain('activation:');
    });

    it('github should not have frontmatter by default', () => {
      const formatter = formatters.get('github')!;
      const result = formatter.format(createTestAST());

      expect(result.content).not.toMatch(/^---\n/);
    });
  });

  describe('glob-patterns', () => {
    it('cursor frontmatter should have globs or alwaysApply', () => {
      const formatter = formatters.get('cursor')!;
      const result = formatter.format(createTestAST(), { version: 'frontmatter' });

      // Should have either globs or alwaysApply in frontmatter
      const hasGlobsOrAlways =
        result.content.includes('globs:') ||
        result.content.includes('glob:') ||
        result.content.includes('alwaysApply:');

      expect(hasGlobsOrAlways).toBe(true);
    });

    it('antigravity should detect glob activation type', () => {
      const formatter = formatters.get('antigravity')!;
      const result = formatter.format(createTestAST(), { version: 'frontmatter' });

      expect(result.content).toContain('activation: "glob"');
    });
  });

  describe('workflows', () => {
    it('antigravity should generate workflow files', () => {
      const formatter = formatters.get('antigravity')!;
      const result = formatter.format(createTestAST());

      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles?.length).toBeGreaterThan(0);

      const workflow = result.additionalFiles?.find((f) => f.path.includes('workflows'));
      expect(workflow).toBeDefined();
      expect(workflow?.path).toContain('.agent/workflows/');
    });

    it('github should not generate workflow files', () => {
      const formatter = formatters.get('github')!;
      const result = formatter.format(createTestAST());

      expect(result.additionalFiles).toBeUndefined();
    });
  });

  describe('character-limit', () => {
    it('antigravity should warn on character limit exceeded', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const formatter = formatters.get('antigravity')!;

      // Create AST with very long identity content to exceed 12,000 chars
      const longAst: Program = {
        type: 'Program',
        uses: [],
        extends: [],
        loc: createLoc(),
        meta: {
          type: 'MetaBlock',
          fields: { id: 'test', syntax: '1.0.0' },
          loc: createLoc(),
        },
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Long content: ' + 'x'.repeat(15000),
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      formatter.format(longAst);

      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0]?.[0]).toContain('12,000');
    });
  });

  describe('multi-file-rules', () => {
    it('cursor should support multi-file output when configured', () => {
      // This test will be expanded when multi-file rules are implemented
      const features = getToolFeatures('cursor');
      const hasMultiFile = features.some((f) => f.id === 'multi-file-rules');
      expect(hasMultiFile).toBe(true);
    });

    it('antigravity should support multi-file output', () => {
      const formatter = formatters.get('antigravity')!;
      const result = formatter.format(createTestAST());

      // Should have main file and potentially additional files
      expect(result.path).toBeDefined();
      // Additional files are optional based on content
    });
  });
});

describe('Tool Feature Queries', () => {
  it('getToolFeatures should return supported features', () => {
    const cursorFeatures = getToolFeatures('cursor');

    expect(cursorFeatures.length).toBeGreaterThan(0);
    expect(cursorFeatures.every((f) => f.tools.cursor !== 'not-supported')).toBe(true);
  });

  it('toolSupportsFeature should correctly check support', () => {
    expect(toolSupportsFeature('cursor', 'yaml-frontmatter')).toBe(true);
    // GitHub supports yaml-frontmatter in .instructions.md and SKILL.md files
    expect(toolSupportsFeature('github', 'yaml-frontmatter')).toBe(true);
    expect(toolSupportsFeature('antigravity', 'workflows')).toBe(true);
    expect(toolSupportsFeature('github', 'workflows')).toBe(false);
  });

  it('toolSupportsFeature should return false for non-existent feature', () => {
    expect(toolSupportsFeature('cursor', 'non-existent-feature')).toBe(false);
    expect(toolSupportsFeature('github', 'fake-feature-id')).toBe(false);
  });
});

describe('Additional Feature Matrix Functions', () => {
  it('getPlannedFeatures should return features with planned status', () => {
    // Currently no features are planned, but function should work
    const planned = getPlannedFeatures('github');
    expect(Array.isArray(planned)).toBe(true);
    // All returned features should have 'planned' status for the tool
    planned.forEach((f) => {
      expect(f.tools.github).toBe('planned');
    });
  });

  it('getFeaturesByCategory should filter by category', () => {
    const outputFeatures = getFeaturesByCategory('output-format');
    expect(outputFeatures.length).toBeGreaterThan(0);
    expect(outputFeatures.every((f) => f.category === 'output-format')).toBe(true);

    const metadataFeatures = getFeaturesByCategory('metadata');
    expect(metadataFeatures.length).toBeGreaterThan(0);
    expect(metadataFeatures.every((f) => f.category === 'metadata')).toBe(true);

    const targetingFeatures = getFeaturesByCategory('targeting');
    expect(targetingFeatures.length).toBeGreaterThan(0);

    const contentFeatures = getFeaturesByCategory('content');
    expect(contentFeatures.length).toBeGreaterThan(0);

    const advancedFeatures = getFeaturesByCategory('advanced');
    expect(advancedFeatures.length).toBeGreaterThan(0);

    const fileStructureFeatures = getFeaturesByCategory('file-structure');
    expect(fileStructureFeatures.length).toBeGreaterThan(0);
  });

  it('getToolComparison should return comparison matrix', () => {
    const comparison = getToolComparison();

    expect(typeof comparison).toBe('object');
    expect(Object.keys(comparison).length).toBe(FEATURE_MATRIX.length);

    // Check structure of comparison
    for (const [featureId, tools] of Object.entries(comparison)) {
      expect(tools.github).toBeDefined();
      expect(tools.cursor).toBeDefined();
      expect(tools.claude).toBeDefined();
      expect(tools.antigravity).toBeDefined();

      // Find the feature and verify match
      const feature = FEATURE_MATRIX.find((f) => f.id === featureId);
      expect(feature).toBeDefined();
      expect(tools).toEqual(feature!.tools);
    }
  });

  it('identifyFeatureGaps should return planned features', () => {
    const gaps = identifyFeatureGaps('github');
    expect(Array.isArray(gaps)).toBe(true);
    // All returned features should have 'planned' status
    gaps.forEach((f) => {
      expect(f.tools.github).toBe('planned');
    });
  });

  it('generateFeatureMatrixReport should generate valid markdown', () => {
    const report = generateFeatureMatrixReport();

    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(100);

    // Should have header
    expect(report).toContain('# Feature Coverage Matrix');

    // Should have table headers
    expect(report).toContain('| Feature | GitHub | Cursor | Claude | Antigravity |');

    // Should have legend
    expect(report).toContain('**Legend:**');
    expect(report).toContain('✅ Supported');
    expect(report).toContain('❌ Not Supported');

    // Should contain some feature names
    expect(report).toContain('Markdown Output');
    expect(report).toContain('YAML Frontmatter');

    // Should have emojis for different statuses
    expect(report).toContain('✅'); // supported
    expect(report).toContain('❌'); // not-supported
  });

  it('generateFeatureMatrixReport should include partial status emoji', () => {
    const report = generateFeatureMatrixReport();
    // Check for partial status in legend
    expect(report).toContain('⚠️ Partial');
  });

  it('generateFeatureMatrixReport should include planned status emoji', () => {
    const report = generateFeatureMatrixReport();
    // Check for planned status in legend
    expect(report).toContain('📋 Planned');
  });
});
