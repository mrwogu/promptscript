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
  });
});
