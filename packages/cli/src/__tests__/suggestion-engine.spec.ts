import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildProjectContext,
  calculateSuggestions,
  getMatchingCatalogEntries,
  formatSuggestionResult,
  createSuggestionChoices,
  parseSelectedChoices,
} from '../utils/suggestion-engine.js';
import { type CliServices } from '../services.js';
import type { RegistryManifest, ProjectContext } from '@promptscript/core';

describe('utils/suggestion-engine', () => {
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
    readFileSync: ReturnType<typeof vi.fn>;
  };

  const sampleManifest: RegistryManifest = {
    version: '1',
    meta: {
      name: 'Test Registry',
      description: 'Test description',
      lastUpdated: '2026-01-28',
    },
    namespaces: {
      '@core': { description: 'Core', priority: 100 },
      '@stacks': { description: 'Stacks', priority: 80 },
      '@fragments': { description: 'Fragments', priority: 70 },
    },
    catalog: [
      {
        id: '@core/base',
        path: '@core/base.prs',
        name: 'Base Foundation',
        description: 'Universal foundation',
        tags: ['core'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: [],
        detectionHints: { always: true },
      },
      {
        id: '@stacks/react',
        path: '@stacks/react.prs',
        name: 'React Stack',
        description: 'React configuration',
        tags: ['stack', 'react'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: ['@core/base'],
        detectionHints: { frameworks: ['react', 'nextjs'] },
      },
      {
        id: '@stacks/python',
        path: '@stacks/python.prs',
        name: 'Python Stack',
        description: 'Python configuration',
        tags: ['stack', 'python'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: ['@core/base'],
        detectionHints: { languages: ['python'] },
      },
      {
        id: '@fragments/testing',
        path: '@fragments/testing.prs',
        name: 'Testing Standards',
        description: 'Testing patterns',
        tags: ['fragment', 'testing'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: [],
        detectionHints: { files: ['jest.config.js', 'vitest.config.ts'] },
      },
      {
        id: '@fragments/typescript',
        path: '@fragments/typescript.prs',
        name: 'TypeScript Practices',
        description: 'TypeScript best practices',
        tags: ['fragment', 'typescript'],
        targets: ['github', 'claude', 'cursor'],
        dependencies: [],
        detectionHints: { languages: ['typescript'] },
      },
    ],
    suggestionRules: [
      // More specific rules should come first (first match wins for inherit)
      {
        condition: { frameworks: ['react', 'nextjs'] },
        suggest: { inherit: '@stacks/react', use: ['@fragments/testing'] },
      },
      {
        condition: { languages: ['python'] },
        suggest: { inherit: '@stacks/python' },
      },
      {
        condition: { languages: ['typescript'] },
        suggest: { use: ['@fragments/typescript'] },
      },
      {
        condition: { files: ['.git'] },
        suggest: { use: ['@fragments/git-conventions'] },
      },
      // Fallback rule should come last
      {
        condition: { always: true },
        suggest: { inherit: '@core/base' },
      },
    ],
  };

  beforeEach(() => {
    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn(),
      readFileSync: vi.fn(),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };
  });

  describe('buildProjectContext', () => {
    it('should build context from project info', async () => {
      mockFs.existsSync.mockImplementation((path: string) =>
        ['package.json', 'tsconfig.json', '.git'].includes(path)
      );
      mockFs.readFile.mockResolvedValue(
        JSON.stringify({
          dependencies: { react: '^18.0.0' },
          devDependencies: { typescript: '^5.0.0' },
        })
      );

      const projectInfo = {
        name: 'test-project',
        source: 'package.json' as const,
        languages: ['typescript'],
        frameworks: ['react'],
      };

      const context = await buildProjectContext(projectInfo, mockServices);

      expect(context.languages).toEqual(['typescript']);
      expect(context.frameworks).toEqual(['react']);
      expect(context.files).toContain('package.json');
      expect(context.files).toContain('tsconfig.json');
      expect(context.dependencies).toContain('react');
      expect(context.dependencies).toContain('typescript');
    });

    it('should return empty arrays when no files found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const projectInfo = {
        name: 'empty-project',
        source: 'directory' as const,
        languages: [],
        frameworks: [],
      };

      const context = await buildProjectContext(projectInfo, mockServices);

      expect(context.files).toEqual([]);
      expect(context.dependencies).toEqual([]);
      expect(context.languages).toEqual([]);
      expect(context.frameworks).toEqual([]);
    });
  });

  describe('calculateSuggestions', () => {
    it('should suggest base foundation for any project', () => {
      const context: ProjectContext = {
        files: [],
        dependencies: [],
        languages: [],
        frameworks: [],
      };

      const result = calculateSuggestions(sampleManifest, context);

      expect(result.inherit).toBe('@core/base');
      expect(result.reasoning.some((r) => r.trigger === 'always')).toBe(true);
    });

    it('should suggest React stack for React projects', () => {
      const context: ProjectContext = {
        files: ['package.json'],
        dependencies: ['react'],
        languages: ['typescript'],
        frameworks: ['react'],
      };

      const result = calculateSuggestions(sampleManifest, context);

      expect(result.inherit).toBe('@stacks/react');
      expect(result.use).toContain('@fragments/testing');
      expect(result.reasoning.some((r) => r.matchedValue === 'react')).toBe(true);
    });

    it('should suggest Python stack for Python projects', () => {
      const context: ProjectContext = {
        files: ['pyproject.toml'],
        dependencies: [],
        languages: ['python'],
        frameworks: [],
      };

      const result = calculateSuggestions(sampleManifest, context);

      expect(result.inherit).toBe('@stacks/python');
      expect(result.reasoning.some((r) => r.matchedValue === 'python')).toBe(true);
    });

    it('should add TypeScript fragment for TypeScript projects', () => {
      const context: ProjectContext = {
        files: ['tsconfig.json'],
        dependencies: [],
        languages: ['typescript'],
        frameworks: [],
      };

      const result = calculateSuggestions(sampleManifest, context);

      expect(result.use).toContain('@fragments/typescript');
    });

    it('should add git conventions fragment for git repos', () => {
      const context: ProjectContext = {
        files: ['.git'],
        dependencies: [],
        languages: [],
        frameworks: [],
      };

      const result = calculateSuggestions(sampleManifest, context);

      expect(result.use).toContain('@fragments/git-conventions');
    });

    it('should not duplicate use items', () => {
      const context: ProjectContext = {
        files: ['package.json', 'jest.config.js'],
        dependencies: ['react', 'jest'],
        languages: ['typescript'],
        frameworks: ['react'],
      };

      const result = calculateSuggestions(sampleManifest, context);

      const testingCount = result.use.filter((u) => u === '@fragments/testing').length;
      expect(testingCount).toBe(1);
    });

    it('should use first matching inherit (first rule wins)', () => {
      const context: ProjectContext = {
        files: [],
        dependencies: [],
        languages: ['python'],
        frameworks: ['react'],
      };

      const result = calculateSuggestions(sampleManifest, context);

      // First matching rule is the React rule (frameworks: ['react'])
      // which should win over Python and the always fallback
      expect(result.inherit).toBe('@stacks/react');
    });
  });

  describe('getMatchingCatalogEntries', () => {
    it('should return entries matching by always hint', () => {
      const context: ProjectContext = {
        files: [],
        dependencies: [],
        languages: [],
        frameworks: [],
      };

      const matches = getMatchingCatalogEntries(sampleManifest, context);

      expect(matches.some((m) => m.entry.id === '@core/base')).toBe(true);
    });

    it('should return entries matching by framework', () => {
      const context: ProjectContext = {
        files: [],
        dependencies: [],
        languages: [],
        frameworks: ['react'],
      };

      const matches = getMatchingCatalogEntries(sampleManifest, context);

      expect(matches.some((m) => m.entry.id === '@stacks/react')).toBe(true);
      expect(matches.some((m) => m.reason.includes('react'))).toBe(true);
    });

    it('should return entries matching by language', () => {
      const context: ProjectContext = {
        files: [],
        dependencies: [],
        languages: ['typescript'],
        frameworks: [],
      };

      const matches = getMatchingCatalogEntries(sampleManifest, context);

      expect(matches.some((m) => m.entry.id === '@fragments/typescript')).toBe(true);
    });

    it('should return entries matching by file', () => {
      const context: ProjectContext = {
        files: ['vitest.config.ts'],
        dependencies: [],
        languages: [],
        frameworks: [],
      };

      const matches = getMatchingCatalogEntries(sampleManifest, context);

      expect(matches.some((m) => m.entry.id === '@fragments/testing')).toBe(true);
    });
  });

  describe('formatSuggestionResult', () => {
    it('should format suggestions for display', () => {
      const result = {
        inherit: '@stacks/react',
        use: ['@fragments/testing', '@fragments/typescript'],
        skills: [],
        reasoning: [
          {
            suggestion: 'inherit: @stacks/react',
            reason: 'Detected framework: react',
            trigger: 'framework' as const,
            matchedValue: 'react',
          },
        ],
      };

      const lines = formatSuggestionResult(result);

      expect(lines.some((l) => l.includes('@stacks/react'))).toBe(true);
      expect(lines.some((l) => l.includes('@fragments/testing'))).toBe(true);
    });

    it('should handle empty suggestions', () => {
      const result = {
        inherit: undefined,
        use: [],
        skills: [],
        reasoning: [],
      };

      const lines = formatSuggestionResult(result);

      expect(lines).toEqual([]);
    });
  });

  describe('createSuggestionChoices', () => {
    it('should create choices from suggestions', () => {
      const result = {
        inherit: '@stacks/react',
        use: ['@fragments/testing'],
        skills: [],
        reasoning: [],
      };

      const choices = createSuggestionChoices(sampleManifest, result);

      expect(choices).toHaveLength(2);
      expect(choices[0]!.value).toBe('inherit:@stacks/react');
      expect(choices[0]!.checked).toBe(true);
      expect(choices[1]!.value).toBe('use:@fragments/testing');
    });

    it('should include entry descriptions', () => {
      const result = {
        inherit: '@stacks/react',
        use: [],
        skills: [],
        reasoning: [],
      };

      const choices = createSuggestionChoices(sampleManifest, result);

      expect(choices[0]!.description).toBe('React configuration');
    });
  });

  describe('parseSelectedChoices', () => {
    it('should parse selected choices back to result', () => {
      const selected = [
        'inherit:@stacks/react',
        'use:@fragments/testing',
        'use:@fragments/typescript',
        'skill:@skills/base',
      ];

      const result = parseSelectedChoices(selected);

      expect(result.inherit).toBe('@stacks/react');
      expect(result.use).toEqual(['@fragments/testing', '@fragments/typescript']);
      expect(result.skills).toEqual(['@skills/base']);
    });

    it('should handle empty selection', () => {
      const result = parseSelectedChoices([]);

      expect(result.inherit).toBeUndefined();
      expect(result.use).toEqual([]);
      expect(result.skills).toEqual([]);
    });

    it('should ignore unknown prefixes', () => {
      const selected = ['inherit:@core/base', 'unknown:something', 'use:@fragments/testing'];

      const result = parseSelectedChoices(selected);

      expect(result.inherit).toBe('@core/base');
      expect(result.use).toEqual(['@fragments/testing']);
      expect(result.skills).toEqual([]);
    });
  });

  describe('formatSuggestionResult with skills', () => {
    it('should format suggestions with skills', () => {
      const result = {
        inherit: '@stacks/react',
        use: ['@fragments/testing'],
        skills: ['@skills/commit', '@skills/review'],
        reasoning: [
          {
            suggestion: 'skill: @skills/commit',
            reason: 'Default recommendation',
            trigger: 'always' as const,
          },
        ],
      };

      const lines = formatSuggestionResult(result);

      expect(lines.some((l) => l.includes('@skills/commit'))).toBe(true);
      expect(lines.some((l) => l.includes('@skills/review'))).toBe(true);
    });
  });

  describe('createSuggestionChoices with skills', () => {
    it('should create choices with skills', () => {
      const manifestWithSkills: RegistryManifest = {
        ...sampleManifest,
        catalog: [
          ...sampleManifest.catalog,
          {
            id: '@skills/commit',
            path: '@skills/commit.prs',
            name: 'Commit Skill',
            description: 'Git commit helper',
            tags: ['skill'],
            targets: ['claude'],
            dependencies: [],
          },
        ],
      };

      const result = {
        inherit: '@core/base',
        use: [],
        skills: ['@skills/commit'],
        reasoning: [],
      };

      const choices = createSuggestionChoices(manifestWithSkills, result);

      expect(choices).toHaveLength(2);
      expect(choices[1]!.value).toBe('skill:@skills/commit');
      expect(choices[1]!.description).toBe('Git commit helper');
    });
  });

  describe('buildProjectContext edge cases', () => {
    it('should handle malformed package.json', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'package.json');
      mockFs.readFile.mockRejectedValue(new SyntaxError('Invalid JSON'));

      const projectInfo = {
        name: 'test',
        source: 'package.json' as const,
        languages: [],
        frameworks: [],
      };

      const context = await buildProjectContext(projectInfo, mockServices);

      expect(context.dependencies).toEqual([]);
    });

    it('should handle package.json without dependencies', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'package.json');
      mockFs.readFile.mockResolvedValue(JSON.stringify({ name: 'test' }));

      const projectInfo = {
        name: 'test',
        source: 'package.json' as const,
        languages: [],
        frameworks: [],
      };

      const context = await buildProjectContext(projectInfo, mockServices);

      expect(context.dependencies).toEqual([]);
    });
  });

  describe('getMatchingCatalogEntries edge cases', () => {
    it('should match entries by dependency', () => {
      const manifestWithDeps: RegistryManifest = {
        ...sampleManifest,
        catalog: [
          {
            id: '@stacks/jest',
            path: '@stacks/jest.prs',
            name: 'Jest Config',
            description: 'Jest testing',
            tags: ['testing'],
            targets: ['github'],
            dependencies: [],
            detectionHints: { dependencies: ['jest'] },
          },
        ],
      };

      const context: ProjectContext = {
        files: [],
        dependencies: ['jest', 'react'],
        languages: [],
        frameworks: [],
      };

      const matches = getMatchingCatalogEntries(manifestWithDeps, context);

      expect(matches.some((m) => m.entry.id === '@stacks/jest')).toBe(true);
      expect(matches.some((m) => m.reason.includes('jest'))).toBe(true);
    });

    it('should skip entries without detection hints', () => {
      const manifestWithoutHints: RegistryManifest = {
        ...sampleManifest,
        catalog: [
          {
            id: '@manual/config',
            path: '@manual/config.prs',
            name: 'Manual Config',
            description: 'Must be manually selected',
            tags: ['manual'],
            targets: ['github'],
            dependencies: [],
            // No detectionHints
          },
        ],
      };

      const context: ProjectContext = {
        files: ['package.json'],
        dependencies: ['react'],
        languages: ['typescript'],
        frameworks: ['react'],
      };

      const matches = getMatchingCatalogEntries(manifestWithoutHints, context);

      expect(matches).toHaveLength(0);
    });
  });

  describe('calculateSuggestions with skills', () => {
    it('should suggest skills from rules', () => {
      const manifestWithSkillRules: RegistryManifest = {
        ...sampleManifest,
        suggestionRules: [
          {
            condition: { always: true },
            suggest: { inherit: '@core/base', skills: ['@skills/commit'] },
          },
        ],
      };

      const context: ProjectContext = {
        files: [],
        dependencies: [],
        languages: [],
        frameworks: [],
      };

      const result = calculateSuggestions(manifestWithSkillRules, context);

      expect(result.skills).toContain('@skills/commit');
    });

    it('should not duplicate skills', () => {
      const manifestWithDuplicateSkills: RegistryManifest = {
        ...sampleManifest,
        suggestionRules: [
          {
            condition: { always: true },
            suggest: { skills: ['@skills/commit'] },
          },
          {
            condition: { files: ['.git'] },
            suggest: { skills: ['@skills/commit', '@skills/review'] },
          },
        ],
      };

      const context: ProjectContext = {
        files: ['.git'],
        dependencies: [],
        languages: [],
        frameworks: [],
      };

      const result = calculateSuggestions(manifestWithDuplicateSkills, context);

      const commitCount = result.skills.filter((s) => s === '@skills/commit').length;
      expect(commitCount).toBe(1);
      expect(result.skills).toContain('@skills/review');
    });
  });
});
