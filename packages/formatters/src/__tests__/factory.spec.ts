import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { FactoryFormatter, FACTORY_VERSIONS } from '../formatters/factory.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
});

describe('FactoryFormatter', () => {
  let formatter: FactoryFormatter;

  beforeEach(() => {
    formatter = new FactoryFormatter();
  });

  it('should have correct name, outputPath and description', () => {
    expect(formatter.name).toBe('factory');
    expect(formatter.outputPath).toBe('AGENTS.md');
    expect(formatter.description).toBe('Factory AI AGENTS.md (Markdown)');
  });

  it('should have markdown as default convention', () => {
    expect(formatter.defaultConvention).toBe('markdown');
  });

  describe('getSupportedVersions', () => {
    it('should return supported versions', () => {
      const versions = FactoryFormatter.getSupportedVersions();
      expect(versions).toBe(FACTORY_VERSIONS);
      expect(versions.simple).toBeDefined();
      expect(versions.multifile).toBeDefined();
      expect(versions.full).toBeDefined();
    });

    it('should have correct version metadata', () => {
      const versions = FactoryFormatter.getSupportedVersions();
      expect(versions.simple.name).toBe('simple');
      expect(versions.simple.description).toBe('Single AGENTS.md file');
      expect(versions.multifile.name).toBe('multifile');
      expect(versions.full.name).toBe('full');
      expect(versions.full.description).toContain('droids');
    });
  });

  describe('format', () => {
    it('should always start with AGENTS.md header', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('AGENTS.md');
      expect(result.content).toContain('# AGENTS.md');
    });

    it('should include project section from identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
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
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
      expect(result.content).toContain('You are a TypeScript developer.');
    });

    it('should include tech stack from context block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'context',
            content: {
              type: 'ObjectContent',
              properties: {
                languages: ['TypeScript', 'JavaScript'],
                runtime: 'Node.js 20+',
                monorepo: {
                  tool: 'Nx',
                  packageManager: 'pnpm',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('TypeScript');
      expect(result.content).toContain('Node.js 20+');
    });

    it('should include conventions section from standards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                typescript: {
                  strictMode: true,
                  exports: 'named only',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Conventions & Patterns');
    });

    it('should include git workflows from standards.git', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                git: {
                  format: 'Conventional Commits',
                  types: ['feat', 'fix', 'docs'],
                  example: 'feat(parser): add support',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Git Workflows');
      expect(result.content).toContain('Conventional Commits');
    });

    it('should include commands from shortcuts block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code quality',
                '/test': 'Run tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Commands');
      expect(result.content).toContain('/review');
    });

    it('should include restrictions section', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never use any type', 'Never skip error handling'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("## Don'ts");
      expect(result.content).toContain("Don't use any type");
    });

    it('should handle empty AST gracefully', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.path).toBe('AGENTS.md');
      expect(result.content).toContain('# AGENTS.md');
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should handle missing blocks gracefully', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'A developer',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Project');
      // Should not contain sections for absent blocks
      expect(result.content).not.toContain('## Git Workflows');
      expect(result.content).not.toContain("## Don'ts");
    });
  });

  describe('multifile version', () => {
    it('should generate skill files from @skills block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                commit: {
                  description: 'Create git commits',
                  content: 'Use Conventional Commits format.',
                },
                review: {
                  description: 'Review code for quality',
                  allowedTools: ['Read', 'Grep'],
                  content: 'You are a code reviewer.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles).toHaveLength(2);

      const commitSkill = result.additionalFiles?.find((f) => f.path.includes('commit'));
      expect(commitSkill).toBeDefined();
      expect(commitSkill?.path).toBe('.factory/skills/commit/SKILL.md');
      expect(commitSkill?.content).toContain('---');
      expect(commitSkill?.content).toContain('name: commit');
      expect(commitSkill?.content).toContain('description: Create git commits');
      expect(commitSkill?.content).not.toContain('user-invocable');
      expect(commitSkill?.content).not.toContain('disable-model-invocation');
      expect(commitSkill?.content).not.toContain('allowed-tools');
      expect(commitSkill?.content).toContain('Use Conventional Commits format.');

      const reviewSkill = result.additionalFiles?.find((f) => f.path.includes('review'));
      expect(reviewSkill).toBeDefined();
      expect(reviewSkill?.content).toContain('allowed-tools: ["Read", "Grep"]');
    });

    it('should not generate additional files when no skills', () => {
      const ast = createMinimalProgram();
      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeUndefined();
    });
  });

  describe('split rules mode', () => {
    it('should preserve monolith content by default', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                typescript: ['Use strict mode'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const implicit = formatter.format(ast, { version: 'multifile' });
      const explicit = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { rulesMode: 'monolith' },
      });

      expect(implicit.content).toBe(explicit.content);
      expect(implicit.additionalFiles).toEqual(explicit.additionalFiles);
      expect(implicit.content).toContain('Use strict mode');
      expect(implicit.managedOutputDirectories).toEqual(['.factory/rules']);
    });

    it('should reject split rules with the simple version', () => {
      const ast = createMinimalProgram();

      expect(() =>
        formatter.format(ast, {
          version: 'simple',
          targetConfig: { rulesMode: 'split' },
        })
      ).toThrow(
        "Factory rulesMode 'split' requires version 'multifile' or 'full'. Change the Factory target version or use rulesMode 'monolith'."
      );
    });

    it('should reject unknown Factory versions', () => {
      expect(() =>
        formatter.format(createMinimalProgram(), {
          version: 'enterprise',
          targetConfig: { rulesMode: 'split' },
        })
      ).toThrow(
        "Unsupported Factory version 'enterprise'. Expected 'simple', 'multifile', or 'full'."
      );
    });

    it('should reject invalid rules mode values', () => {
      expect(() =>
        formatter.format(createMinimalProgram(), {
          version: 'multifile',
          targetConfig: { rulesMode: 'separate' as 'split' },
        })
      ).toThrow("Invalid Factory rulesMode 'separate'. Expected 'monolith' or 'split'.");
    });

    it.each([
      '',
      '/tmp/AGENTS.md',
      'C:\\workspace\\AGENTS.md',
      'C:AGENTS.md',
      '../AGENTS.md',
      'config/../../AGENTS.md',
    ])('should reject unsafe split output path %s', (outputPath) => {
      expect(() =>
        formatter.format(createMinimalProgram(), {
          version: 'multifile',
          outputPath,
          targetConfig: { rulesMode: 'split' },
        })
      ).toThrow(
        "Factory rulesMode 'split' requires a project-relative outputPath without parent traversal so AGENTS.md can link to generated rules."
      );
    });

    it('should reject non-Markdown split output', () => {
      expect(() =>
        formatter.format(createMinimalProgram(), {
          version: 'multifile',
          convention: 'xml',
          targetConfig: { rulesMode: 'split' },
        })
      ).toThrow(
        "Factory rulesMode 'split' requires the Markdown convention. Change the Factory target convention or use rulesMode 'monolith'."
      );
    });

    it('should escape Windows reserved device names in rule file slugs', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                CON: ['Use safe console handling'],
                nul: ['Use portable null devices'],
                com1: ['Use portable serial device names'],
                lpt9: ['Use portable printer device names'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { rulesMode: 'split' },
      });
      const paths = (result.additionalFiles ?? []).map((file) => file.path);

      expect(paths).toEqual([
        '.factory/rules/standards/rule-con.md',
        '.factory/rules/standards/rule-nul.md',
        '.factory/rules/standards/rule-com1.md',
        '.factory/rules/standards/rule-lpt9.md',
      ]);
    });

    it('should render primitive and nested rule values with portable fallback slugs', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                primitives: {
                  enabled: true,
                  count: 3,
                  tags: ['strict', 'safe'],
                  metadata: {
                    mode: 'strict',
                    empty: null,
                    audit: {
                      level: 2,
                      ignored: null,
                    },
                  },
                  note: {
                    type: 'TextContent',
                    value: 'Keep checks explicit',
                    loc: createLoc(),
                  },
                  disabled: false,
                  missing: null,
                },
                retryCount: 3,
                experimental: true,
                guidance: {
                  type: 'TextContent',
                  value: 'Prefer focused checks',
                  loc: createLoc(),
                },
                'Résumé API': ['Preserve stable contracts'],
                '🔥': ['Handle punctuation-only topics'],
                ignored: false,
                ignoredNull: null,
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { rulesMode: 'split' },
      });
      const ruleFiles = (result.additionalFiles ?? []).filter((file) =>
        file.path.startsWith('.factory/rules/standards/')
      );

      expect(ruleFiles.map((file) => file.path)).toEqual([
        '.factory/rules/standards/primitives.md',
        '.factory/rules/standards/retrycount.md',
        '.factory/rules/standards/experimental.md',
        '.factory/rules/standards/guidance.md',
        '.factory/rules/standards/resume-api.md',
        '.factory/rules/standards/topic.md',
      ]);
      expect(ruleFiles[0]?.content).toContain('- Enabled');
      expect(ruleFiles[0]?.content).toContain('- Count: 3');
      expect(ruleFiles[0]?.content).toContain('- Tags: strict, safe');
      expect(ruleFiles[0]?.content).toContain('- Metadata: Mode: strict, Audit: Level: 2');
      expect(ruleFiles[0]?.content).toContain('- Note: Keep checks explicit');
      expect(ruleFiles[0]?.content).not.toContain('Disabled');
      expect(ruleFiles[0]?.content).not.toContain('Missing');
      expect(ruleFiles[1]?.content).toContain('- 3');
      expect(ruleFiles[2]?.content).toContain('- true');
      expect(ruleFiles[3]?.content).toContain('- Prefer focused checks');
    });

    it('should emit deterministic rule files and a lean indexed AGENTS.md', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'You are an enterprise TypeScript developer.',
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
                languages: ['TypeScript'],
                runtime: 'Node.js 20+',
              },
              text: {
                type: 'TextContent',
                value: '## Architecture\n\n```text\napi -> service\n```',
                loc: createLoc(),
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                security: ['Validate all inputs', 'Log access decisions'],
                git: {
                  format: 'Conventional Commits',
                  example: 'feat(factory): split rules',
                },
                config: {
                  eslint: 'inherit from base config',
                },
                documentation: ['Review docs before changes'],
                diagrams: {
                  format: 'Mermaid',
                  types: ['flowchart', 'sequence'],
                },
                'Team API': ['Prefer stable contracts'],
                'team-api': ['Version breaking changes'],
                empty: [],
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
                '/test': 'Run all tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'knowledge',
            content: {
              type: 'TextContent',
              value:
                '## Development Commands\n\n```bash\npnpm test\n```\n\n## Post-Work Verification\n\n```bash\npnpm lint\n```\n\n## Operations Notes\n\nDeploy safely.',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ArrayContent',
              elements: ['Never expose secrets'],
              loc: createLoc(),
            },
            loc: createLoc(),
          },
          {
            type: 'Block',
            name: 'examples',
            content: {
              type: 'ObjectContent',
              properties: {
                review: {
                  input: 'Review this change',
                  output: 'Report actionable findings',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'full',
        outputPath: 'config/AGENTS.md',
        targetConfig: { rulesMode: 'split' },
      });
      const ruleFiles = (result.additionalFiles ?? []).filter((file) =>
        file.path.startsWith('.factory/rules/')
      );

      expect(ruleFiles.map((file) => file.path)).toEqual([
        '.factory/rules/standards/security.md',
        '.factory/rules/git-workflows.md',
        '.factory/rules/configuration.md',
        '.factory/rules/documentation.md',
        '.factory/rules/diagrams.md',
        '.factory/rules/standards/team-api.md',
        '.factory/rules/standards/team-api-2.md',
        '.factory/rules/knowledge.md',
        '.factory/rules/restrictions.md',
        '.factory/rules/examples.md',
      ]);
      expect(ruleFiles.find((file) => file.path.endsWith('security.md'))?.content).toContain(
        '# Security\n\n- Validate all inputs\n- Log access decisions'
      );
      expect(ruleFiles.find((file) => file.path.endsWith('knowledge.md'))?.content).toContain(
        '## Operations Notes'
      );
      expect(ruleFiles.find((file) => file.path.endsWith('knowledge.md'))?.content).not.toContain(
        'Development Commands'
      );

      expect(result.content).toContain('## Project');
      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('## Architecture');
      expect(result.content).toContain('## Commands');
      expect(result.content).toContain('## Build & Test');
      expect(result.content).toContain('[Security](../.factory/rules/standards/security.md)');
      expect(result.content).toContain('[Restrictions](../.factory/rules/restrictions.md)');
      expect(result.content).not.toContain('Validate all inputs');
      expect(result.content).not.toContain('Conventional Commits');
      expect(result.content).not.toContain("## Don'ts");
      expect(result.managedOutputDirectories).toEqual(['.factory/rules']);
    });

    it('should omit the rules index when no rule files are emitted', () => {
      const result = formatter.format(createMinimalProgram(), {
        version: 'multifile',
        targetConfig: { rulesMode: 'split' },
      });

      expect(result.content).not.toContain('## Rules');
      expect(result.additionalFiles).toBeUndefined();
    });
  });

  describe('full version', () => {
    it('should generate skill files same as multifile', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                deploy: {
                  description: 'Deploy the application',
                  content: 'Run deploy pipeline.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();
      expect(result.additionalFiles).toHaveLength(1);
      expect(result.additionalFiles?.[0]?.path).toBe('.factory/skills/deploy/SKILL.md');
    });
  });

  describe('command file generation', () => {
    it('should generate command files from shortcuts with prompt: true', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/create-spec': {
                  description: 'Create feature specification',
                  prompt: true,
                  content: 'Create a detailed spec for the given feature.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/create-spec'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/create-spec.md');
      expect(cmdFile?.content).toContain('---');
      expect(cmdFile?.content).toContain('description: Create feature specification');
      expect(cmdFile?.content).toContain('Create a detailed spec for the given feature.');
    });

    it('should generate command files from shortcuts with content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                'build-plan': {
                  description: 'Build a technical plan',
                  content: 'Analyze requirements and create a plan.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/build-plan'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/build-plan.md');
      expect(cmdFile?.content).toContain('Analyze requirements and create a plan.');
    });

    it('should include agent in frontmatter when specified', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                review: {
                  description: 'Review code',
                  agent: 'reviewer.expert',
                  content: 'Review the code.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/review'));
      expect(cmdFile?.content).toContain('agent: reviewer.expert');
    });

    it('should include handoffs in frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                'create-spec': {
                  description: 'Create specification',
                  content: 'Create a spec.',
                  handoffs: [
                    {
                      label: 'Build Plan',
                      agent: 'speckit.plan',
                      prompt: 'Create a plan for the spec',
                    },
                    {
                      label: 'Clarify',
                      agent: 'speckit.clarify',
                      prompt: 'Clarify requirements',
                      send: true,
                    },
                  ],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/create-spec'));
      expect(cmdFile?.content).toContain('handoffs:');
      expect(cmdFile?.content).toContain('label: Build Plan');
      expect(cmdFile?.content).toContain('agent: speckit.plan');
      expect(cmdFile?.content).toContain('prompt: Create a plan for the spec');
      expect(cmdFile?.content).toContain('label: Clarify');
      expect(cmdFile?.content).toContain('send: true');
    });

    it('should strip leading slashes from command names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/deploy': {
                  description: 'Deploy app',
                  prompt: true,
                  content: 'Deploy the application.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/deploy'));
      expect(cmdFile?.path).toBe('.factory/commands/deploy.md');
    });

    it('should include tools in frontmatter when specified', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                'tasks-to-issues': {
                  description: 'Convert tasks to GitHub issues',
                  tools: ['github/github-mcp-server/issue_write'],
                  content: 'Convert tasks.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) =>
        f.path.includes('commands/tasks-to-issues')
      );
      expect(cmdFile?.content).toContain("tools: ['github/github-mcp-server/issue_write']");
    });

    it('should generate command files from TextContent shortcuts with multiline content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/deploy': {
                  type: 'TextContent',
                  value: 'Step 1: Build\nStep 2: Deploy',
                  loc: createLoc(),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/deploy'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/deploy.md');
      expect(cmdFile?.content).toContain('Step 1: Build');
      expect(cmdFile?.content).toContain('Step 2: Deploy');
    });

    it('should skip TextContent shortcuts with single-line content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/simple': {
                  type: 'TextContent',
                  value: 'Just a single line',
                  loc: createLoc(),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const commandFiles = result.additionalFiles?.filter((f) => f.path.includes('commands/'));
      expect(commandFiles ?? []).toHaveLength(0);
    });

    it('should not generate command files for simple string shortcuts', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                '/review': 'Review code quality',
                '/test': 'Run tests',
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      // Should have no additional files (only simple shortcuts, no command files)
      const commandFiles = result.additionalFiles?.filter((f) => f.path.includes('commands/'));
      expect(commandFiles ?? []).toHaveLength(0);
    });

    it('should generate command files in full version', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                analyze: {
                  description: 'Analyze code',
                  content: 'Analyze the codebase.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/analyze'));
      expect(cmdFile).toBeDefined();
      expect(cmdFile?.path).toBe('.factory/commands/analyze.md');
    });

    it('should use double quotes for descriptions containing apostrophes', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                fix: {
                  description: "Fix code that doesn't work",
                  content: 'Fix it.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/fix'));
      expect(cmdFile?.content).toContain('description: "Fix code that doesn\'t work"');
    });
  });

  describe('skill frontmatter', () => {
    it('should generate correct YAML frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'test-skill': {
                  description: 'A test skill',
                  userInvocable: false,
                  disableModelInvocation: true,
                  content: 'Test content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).toContain('name: test-skill');
      expect(skill?.content).toContain('description: A test skill');
      expect(skill?.content).toContain('user-invocable: false');
      expect(skill?.content).toContain('disable-model-invocation: true');
    });

    it('should emit argument-hint in skill frontmatter when specified', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                deploy: {
                  description: 'Deploy to production',
                  argumentHint: '<environment>',
                  content: 'Deploy instructions.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.find((f) => f.path.includes('deploy/SKILL.md'));
      expect(skill).toBeDefined();
      expect(skill?.content).toContain('argument-hint: <environment>');
    });

    it('should not emit default values for user-invocable and disable-model-invocation', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'default-skill': {
                  description: 'A skill with defaults',
                  userInvocable: true,
                  disableModelInvocation: false,
                  content: 'Default values.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).toContain('name: default-skill');
      expect(skill?.content).not.toContain('user-invocable');
      expect(skill?.content).not.toContain('disable-model-invocation');
    });

    it('should use raw frontmatter pass-through when __rawFrontmatter is present', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'test-skill': {
                  description: 'A test skill',
                  userInvocable: false,
                  disableModelInvocation: true,
                  content: 'Test content.',
                  __rawFrontmatter:
                    'name: test-skill\ndescription: A test skill\nuser-invocable: false\ndisable-model-invocation: true\ncustom-field: preserved',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();
      // Factory filters unsupported fields — custom-field should be stripped
      expect(skill?.content).not.toContain('custom-field: preserved');
      // Supported fields should still appear
      expect(skill?.content).toContain('name: test-skill');
      expect(skill?.content).toContain('description: A test skill');
      expect(skill?.content).toContain('user-invocable: false');
      expect(skill?.content).toContain('disable-model-invocation: true');
    });

    it('should strip unsupported frontmatter fields from raw frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                promptscript: {
                  description: 'PromptScript language expert',
                  content: 'Language guide content.',
                  __rawFrontmatter: [
                    '# promptscript-generated: 2026-04-06T08:34:33.387Z',
                    'name: promptscript',
                    'description: PromptScript language expert',
                    'license: MIT',
                    'metadata:',
                    '  author: PromptScript',
                    '  homepage: https://getpromptscript.dev',
                    'compatibility:',
                    '  - claude-code',
                    '  - factory-ai',
                    'allowed-tools:',
                    '  - Read',
                    '  - Write',
                    'user-invocable: true',
                  ].join('\n'),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();

      // Supported fields should be preserved
      expect(skill?.content).toContain('name: promptscript');
      expect(skill?.content).toContain('description: PromptScript language expert');
      expect(skill?.content).toContain('user-invocable: true');

      // Unsupported fields and comments should be stripped
      expect(skill?.content).not.toContain('# promptscript-generated');
      expect(skill?.content).not.toContain('license: MIT');
      expect(skill?.content).not.toContain('metadata:');
      expect(skill?.content).not.toContain('author: PromptScript');
      expect(skill?.content).not.toContain('compatibility:');
      expect(skill?.content).not.toContain('allowed-tools:');
    });

    it('should handle empty lines within unsupported nested blocks', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'test-skill': {
                  description: 'A test skill',
                  content: 'Content.',
                  __rawFrontmatter: [
                    'name: test-skill',
                    'description: A test skill',
                    'metadata:',
                    '  author: Test',
                    '',
                    '  homepage: https://example.com',
                    'user-invocable: true',
                  ].join('\n'),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();

      // Supported fields preserved
      expect(skill?.content).toContain('name: test-skill');
      expect(skill?.content).toContain('description: A test skill');
      expect(skill?.content).toContain('user-invocable: true');

      // Unsupported block with empty line inside should be stripped entirely
      expect(skill?.content).not.toContain('metadata:');
      expect(skill?.content).not.toContain('author: Test');
      expect(skill?.content).not.toContain('homepage:');
    });

    it('should handle empty lines between fields in raw frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'test-skill': {
                  description: 'A test skill',
                  content: 'Content.',
                  __rawFrontmatter: [
                    'name: test-skill',
                    '',
                    'description: A test skill',
                    '',
                    'user-invocable: true',
                  ].join('\n'),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();

      // Empty lines between supported fields are stripped
      expect(skill?.content).toContain('name: test-skill');
      expect(skill?.content).toContain('description: A test skill');
      expect(skill?.content).toContain('user-invocable: true');

      // Verify the frontmatter has no blank lines inside it
      const frontmatter = skill?.content?.match(/^---\n([\s\S]*?)\n---/)?.[1];
      expect(frontmatter).toBeDefined();
      expect(frontmatter).not.toMatch(/^\s*$/m);
    });

    it('should preserve all supported fields when raw frontmatter has only supported fields', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'clean-skill': {
                  description: 'Clean skill',
                  content: 'Content.',
                  __rawFrontmatter: [
                    'name: clean-skill',
                    'description: Clean skill',
                    'user-invocable: true',
                    'disable-model-invocation: false',
                  ].join('\n'),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();

      expect(skill?.content).toContain('name: clean-skill');
      expect(skill?.content).toContain('description: Clean skill');
      expect(skill?.content).toContain('user-invocable: true');
      expect(skill?.content).toContain('disable-model-invocation: false');
    });

    it('should strip all fields when raw frontmatter has only unsupported fields', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'unsupported-skill': {
                  description: 'Unsupported',
                  content: 'Content.',
                  __rawFrontmatter: ['license: MIT', 'version: "1.0.0"'].join('\n'),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();

      // All fields stripped — frontmatter should be empty between delimiters
      expect(skill?.content).not.toContain('license: MIT');
      expect(skill?.content).not.toContain('version:');

      // Frontmatter should still have delimiters
      expect(skill?.content).toContain('---');
    });

    it('should handle deeply nested unsupported blocks', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'deep-skill': {
                  description: 'Deep nesting',
                  content: 'Content.',
                  __rawFrontmatter: [
                    'name: deep-skill',
                    'metadata:',
                    '  nested:',
                    '    deep-key: deep-value',
                    'description: Deep nesting',
                  ].join('\n'),
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];
      expect(skill).toBeDefined();

      expect(skill?.content).toContain('name: deep-skill');
      expect(skill?.content).toContain('description: Deep nesting');
      expect(skill?.content).not.toContain('metadata:');
      expect(skill?.content).not.toContain('nested:');
      expect(skill?.content).not.toContain('deep-key:');
    });

    it('should emit allowed-tools in YAML frontmatter', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'tooled-skill': {
                  description: 'A skill with tools',
                  allowedTools: ['Read', 'Grep', 'Glob'],
                  content: 'Skill with tools.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).toContain('allowed-tools: ["Read", "Grep", "Glob"]');
    });

    it('should not emit allowed-tools when empty', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'no-tools-skill': {
                  description: 'A skill without tools',
                  allowedTools: [],
                  content: 'No tools.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).not.toContain('allowed-tools');
    });

    it('should use double quotes for descriptions containing apostrophes', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                fix: {
                  description: "Fix code that doesn't work",
                  content: 'Fix it.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.[0];

      expect(skill?.content).toContain('description: "Fix code that doesn\'t work"');
    });

    it('should convert dots to hyphens in skill names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'speckit.plan': {
                  description: 'Plan things',
                  content: 'Plan content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skill = result.additionalFiles?.find((f) => f.path.includes('skills/'));

      expect(skill?.content).toContain('name: speckit-plan');
      expect(skill?.content).not.toContain('name: speckit.plan');
    });

    it('should emit resource files alongside SKILL.md', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'ui-skill': {
                  description: 'UI skill with resources',
                  content: 'Skill content.',
                  resources: [
                    { relativePath: 'data/colors.csv', content: 'red,#ff0000\n' },
                    { relativePath: 'scripts/search.py', content: 'print("hello")\n' },
                  ],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.path).toBe('.factory/skills/ui-skill/SKILL.md');

      const resourceFiles = skillFile?.additionalFiles;
      expect(resourceFiles).toBeDefined();
      expect(resourceFiles).toHaveLength(2);

      const csv = resourceFiles?.find((f) => f.path.includes('colors.csv'));
      expect(csv?.path).toBe('.factory/skills/ui-skill/data/colors.csv');
      expect(csv?.content).toBe('red,#ff0000\n');

      const py = resourceFiles?.find((f) => f.path.includes('search.py'));
      expect(py?.path).toBe('.factory/skills/ui-skill/scripts/search.py');
      expect(py?.content).toBe('print("hello")\n');
    });

    it('should not emit additionalFiles when no resources', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'bare-skill': {
                  description: 'No resources',
                  content: 'Content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile).toBeDefined();
      expect(skillFile?.additionalFiles).toBeUndefined();
    });

    it('should include trailing space on handoffs key in command YAML', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'shortcuts',
            content: {
              type: 'ObjectContent',
              properties: {
                test: {
                  description: 'Test command',
                  content: 'Test content',
                  handoffs: [
                    {
                      label: 'Next Step',
                      agent: 'next.step',
                      prompt: 'Do the next thing',
                    },
                  ],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const cmdFile = result.additionalFiles?.find((f) => f.path.includes('commands/'));
      expect(cmdFile).toBeDefined();

      // Should have trailing space after "handoffs:" to match Factory AI format
      expect(cmdFile?.content).toMatch(/handoffs: \n/);
    });
  });

  describe('documentation section', () => {
    it('should render documentation from standards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                documentation: {
                  verifyBefore: true,
                  verifyAfter: true,
                  codeExamples: true,
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Documentation');
      expect(result.content).toContain('Review docs before changes');
      expect(result.content).toContain('Update docs after changes');
      expect(result.content).toContain('Keep code examples accurate');
    });

    it('should return null when documentation has no items', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                documentation: {},
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Documentation');
    });
  });

  describe('diagrams section', () => {
    it('should render diagrams from standards block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                diagrams: {
                  format: 'mermaid',
                  types: ['flowchart', 'sequence', 'class'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('Diagrams');
      expect(result.content).toContain('Use mermaid for diagrams');
      expect(result.content).toContain('Types: flowchart, sequence, class');
    });

    it('should return null when diagrams property is missing', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {},
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).not.toContain('Diagrams');
    });
  });

  describe('restrictions with different content types', () => {
    it('should handle TextContent restrictions', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- Never use any type\n- Never skip tests',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("Don'ts");
      expect(result.content).toContain("Don't use any type");
      expect(result.content).toContain("Don't skip tests");
    });

    it('should handle ObjectContent restrictions with items array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['Never use any type', 'Never skip error handling'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("Don'ts");
      expect(result.content).toContain("Don't use any type");
      expect(result.content).toContain("Don't skip error handling");
    });
  });

  describe('tech stack from standards block', () => {
    it('should extract tech stack from standards.code', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            content: {
              type: 'ObjectContent',
              properties: {
                code: {
                  languages: ['TypeScript', 'Python'],
                  frameworks: ['React'],
                  testing: ['Vitest'],
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('TypeScript');
      expect(result.content).toContain('React');
      expect(result.content).toContain('Vitest');
    });
  });

  describe('restrictions from text and object content', () => {
    it("should extract restrictions from TextContent and transform Never to Don't", () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'TextContent',
              value: '- Never use any type\n- Never skip tests',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain("Don't use any type");
      expect(result.content).toContain("Don't skip tests");
    });

    it('should extract restrictions from ObjectContent with items', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'restrictions',
            content: {
              type: 'ObjectContent',
              properties: {
                items: ['No any type', 'No default exports'],
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast);
      expect(result.content).toContain('No any type');
      expect(result.content).toContain('No default exports');
    });
  });

  describe('droid file generation', () => {
    it('should generate droid files from @agents block in full mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'code-reviewer': {
                  description: 'Focused reviewer for diffs',
                  model: 'inherit',
                  tools: 'read-only',
                  content: 'You are the team senior reviewer.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      expect(result.additionalFiles).toBeDefined();
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid).toBeDefined();
      expect(droid?.path).toBe('.factory/droids/code-reviewer.md');
      expect(droid?.content).toContain('name: code-reviewer');
      expect(droid?.content).toContain('description: Focused reviewer for diffs');
      expect(droid?.content).toContain('model: inherit');
      expect(droid?.content).toContain('tools: read-only');
      expect(droid?.content).toContain('You are the team senior reviewer.');
    });

    it('should generate droid with all supported fields', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'deep-analyzer': {
                  description: 'Thorough analysis with extended thinking',
                  model: 'claude-sonnet-4-5-20250929',
                  reasoningEffort: 'high',
                  tools: ['Read', 'Grep', 'Glob', 'WebSearch'],
                  content: 'Perform deep analysis of the code.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid).toBeDefined();
      expect(droid?.path).toBe('.factory/droids/deep-analyzer.md');
      expect(droid?.content).toContain('name: deep-analyzer');
      expect(droid?.content).toContain('description: Thorough analysis with extended thinking');
      expect(droid?.content).toContain('model: claude-sonnet-4-5-20250929');
      expect(droid?.content).toContain('reasoningEffort: high');
      expect(droid?.content).toContain('tools: ["Read", "Grep", "Glob", "WebSearch"]');
      expect(droid?.content).toContain('Perform deep analysis of the code.');
    });

    it('should generate multiple droid files', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Reviews code',
                  content: 'Review the code.',
                },
                debugger: {
                  description: 'Debugs issues',
                  content: 'Debug the issue.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const droids = result.additionalFiles?.filter((f) => f.path.includes('droids/'));
      expect(droids).toHaveLength(2);
      expect(droids?.find((f) => f.path === '.factory/droids/reviewer.md')).toBeDefined();
      expect(droids?.find((f) => f.path === '.factory/droids/debugger.md')).toBeDefined();
    });

    it('should not generate droid files in simple mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Reviews code',
                  content: 'Review the code.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'simple' });
      const droids = result.additionalFiles?.filter((f) => f.path.includes('droids/'));
      expect(droids ?? []).toHaveLength(0);
    });

    it('should not generate droid files in multifile mode', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                reviewer: {
                  description: 'Reviews code',
                  content: 'Review the code.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const droids = result.additionalFiles?.filter((f) => f.path.includes('droids/'));
      expect(droids ?? []).toHaveLength(0);
    });

    it('should skip agents without description', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'no-desc': {
                  content: 'Some content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droids = result.additionalFiles?.filter((f) => f.path.includes('droids/'));
      expect(droids ?? []).toHaveLength(0);
    });

    it('should convert dots to hyphens in droid names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                'speckit.review': {
                  description: 'Reviews specs',
                  content: 'Review the spec.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid?.path).toBe('.factory/droids/speckit-review.md');
      expect(droid?.content).toContain('name: speckit-review');
    });

    it('should generate minimal droid with only name and description', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                helper: {
                  description: 'A simple helper',
                  content: 'Help with tasks.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid?.content).toContain('name: helper');
      expect(droid?.content).toContain('description: A simple helper');
      expect(droid?.content).not.toContain('model:');
      expect(droid?.content).not.toContain('reasoningEffort:');
      expect(droid?.content).not.toContain('tools:');
    });

    it('should generate droid without content', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                empty: {
                  description: 'Empty droid',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid).toBeDefined();
      expect(droid?.content).toContain('name: empty');
      expect(droid?.content).toContain('description: Empty droid');
      // Should end with frontmatter close + newline, no body content
      expect(droid?.content).toMatch(/---\n\n$/);
    });

    it('should handle empty tools array', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                tester: {
                  description: 'Tester droid',
                  tools: [],
                  content: 'Test things.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid).toBeDefined();
      expect(droid?.content).not.toContain('tools:');
    });

    it('should handle non-array non-string tools value', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                tester: {
                  description: 'Tester droid',
                  tools: true,
                  content: 'Test things.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid).toBeDefined();
      expect(droid?.content).toContain('tools: true');
    });

    it('should generate droid with mixed models (specModel + specReasoningEffort)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Planning specialist with mixed models',
                  model: 'claude-sonnet-4-5-20250929',
                  reasoningEffort: 'medium',
                  specModel: 'claude-opus-4-5-20250929',
                  specReasoningEffort: 'high',
                  tools: ['Read', 'Grep'],
                  content: 'You plan features using spec mode.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid).toBeDefined();
      expect(droid?.path).toBe('.factory/droids/planner.md');
      expect(droid?.content).toContain('model: claude-sonnet-4-5-20250929');
      expect(droid?.content).toContain('reasoningEffort: medium');
      expect(droid?.content).toContain('specModel: claude-opus-4-5-20250929');
      expect(droid?.content).toContain('specReasoningEffort: high');
    });

    it('should generate droid with specModel only (no specReasoningEffort)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Mixed model droid',
                  model: 'inherit',
                  specModel: 'claude-opus-4-5-20250929',
                  content: 'Plan things.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid?.content).toContain('model: inherit');
      expect(droid?.content).toContain('specModel: claude-opus-4-5-20250929');
      expect(droid?.content).not.toContain('specReasoningEffort:');
    });

    it('should ignore invalid specReasoningEffort values', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Mixed model droid',
                  specModel: 'opus',
                  specReasoningEffort: 'ultra',
                  content: 'Plan things.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid?.content).toContain('specModel: opus');
      expect(droid?.content).not.toContain('specReasoningEffort:');
    });

    it('should ignore invalid reasoningEffort values', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                tester: {
                  description: 'Tester droid',
                  reasoningEffort: 'ultra',
                  content: 'Test things.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });
      const droid = result.additionalFiles?.find((f) => f.path.includes('droids/'));
      expect(droid?.content).not.toContain('reasoningEffort:');
    });
  });

  describe('convention support', () => {
    it('should support markdown convention (default)', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { convention: 'markdown' });
      expect(result.content).toContain('## Project');
    });

    it('should support xml convention', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Test project',
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { convention: 'xml' });
      expect(result.content).toContain('<project>');
      expect(result.content).toContain('</project>');
    });
  });

  describe('regression: skill YAML key spelling', () => {
    it('should emit user-invocable (hyphenated) not userInvocable (camelCase) when userInvocable is false', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'my-skill': {
                  description: 'A test skill',
                  userInvocable: false,
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { version: 'full' });
      const skillFile = result.additionalFiles?.find((f) =>
        f.path.includes('.factory/skills/my-skill/SKILL.md')
      );
      expect(skillFile).toBeDefined();
      expect(skillFile?.content).toContain('user-invocable: false');
      expect(skillFile?.content).not.toContain('userInvocable:');
    });
  });

  describe('transformInjectedSkillContent', () => {
    it('strips unsupported frontmatter fields from injected SKILL.md content', () => {
      const injected = [
        '---',
        'name: promptscript',
        'description: Test description',
        'license: MIT',
        'metadata:',
        '  author: PromptScript',
        '  homepage: https://example.com',
        'compatibility:',
        '  - claude-code',
        '  - github-copilot',
        'allowed-tools:',
        '  - Read',
        '  - Write',
        'user-invocable: true',
        '---',
        '',
        '# Body content',
        'Body text remains untouched.',
        '',
      ].join('\n');

      const transformed = formatter.transformInjectedSkillContent(injected);

      expect(transformed).toContain('name: promptscript');
      expect(transformed).toContain('description: Test description');
      expect(transformed).toContain('user-invocable: true');
      expect(transformed).not.toContain('license:');
      expect(transformed).not.toContain('metadata:');
      expect(transformed).not.toContain('compatibility:');
      expect(transformed).not.toContain('allowed-tools:');
      expect(transformed).toContain('# Body content');
      expect(transformed).toContain('Body text remains untouched.');
    });

    it('returns content unchanged when no frontmatter is present', () => {
      const content = '# Plain skill\n\nNo frontmatter here.\n';
      expect(formatter.transformInjectedSkillContent(content)).toBe(content);
    });

    it('returns content unchanged when frontmatter has no closing delimiter', () => {
      const content = '---\nname: broken\nno closing delimiter\n';
      expect(formatter.transformInjectedSkillContent(content)).toBe(content);
    });
  });

  describe('guards as skills', () => {
    it('should generate skill files from @guards named entries', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  applyTo: ['**/*.spec.ts', '**/__tests__/**'],
                  description: 'Testing rules',
                  content: 'Use vitest for testing.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.additionalFiles).toBeDefined();
      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/testing/SKILL.md'
      );
      expect(skillFile).toBeDefined();
      expect(skillFile?.content).toContain('name: testing');
      expect(skillFile?.content).toContain('Use vitest for testing.');
    });

    it('should include scope info in skill description', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  applyTo: ['**/*.spec.ts', '**/__tests__/**'],
                  description: 'Testing rules',
                  content: 'Use vitest.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/testing/SKILL.md'
      );
      expect(skillFile?.content).toContain(
        'Testing rules (applies to: **/*.spec.ts, **/__tests__/**)'
      );
    });

    it('should add path-specific skills listing to AGENTS.md', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  applyTo: ['**/*.spec.ts'],
                  description: 'Testing rules',
                  content: 'Use vitest.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      expect(result.content).toContain('Path-specific Skills');
      expect(result.content).toContain('testing');
    });

    it('should suppress listing when guardsSkillsListing is false', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  applyTo: ['**/*.spec.ts'],
                  description: 'Testing rules',
                  content: 'Use vitest.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { guardsSkillsListing: false },
      });

      expect(result.content).not.toContain('Path-specific Skills');
    });

    it('should not generate guard skills when guardsAsSkills is false', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  applyTo: ['**/*.spec.ts'],
                  description: 'Testing rules',
                  content: 'Use vitest.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { guardsAsSkills: false },
      });

      const skillFiles = result.additionalFiles?.filter((f) => f.path.includes('.factory/skills/'));
      expect(skillFiles ?? []).toHaveLength(0);
      expect(result.content).not.toContain('Path-specific Skills');
    });

    it('should skip guard entry that collides with @skills entry', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                testing: {
                  description: 'Existing skill',
                  content: 'Existing content.',
                },
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
                testing: {
                  applyTo: ['**/*.spec.ts'],
                  description: 'Guard testing rules',
                  content: 'Guard content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      // Should have exactly 1 skill file (from @skills, not the duplicate from @guards)
      const skillFiles = result.additionalFiles?.filter((f) => f.path.includes('.factory/skills/'));
      expect(skillFiles).toHaveLength(1);
      expect(skillFiles?.[0]?.content).toContain('Existing skill');
    });

    it('should skip guard entries with unsafe names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                '../unsafe': {
                  applyTo: ['**/*.ts'],
                  description: 'Unsafe',
                  content: 'Bad.',
                },
                'safe-name': {
                  applyTo: ['**/*.ts'],
                  description: 'Safe rule',
                  content: 'Good.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const skillFiles = result.additionalFiles?.filter((f) => f.path.includes('.factory/skills/'));
      expect(skillFiles).toHaveLength(1);
      expect(skillFiles?.[0]?.path).toBe('.factory/skills/safe-name/SKILL.md');
    });

    it('should produce no output for empty @guards', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {},
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const skillFiles = result.additionalFiles?.filter((f) => f.path.includes('.factory/skills/'));
      expect(skillFiles ?? []).toHaveLength(0);
      expect(result.content).not.toContain('Path-specific Skills');
    });

    it('should work without @identity block', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                api: {
                  applyTo: ['**/api/**'],
                  description: 'API rules',
                  content: 'Validate all inputs.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'full' });

      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/api/SKILL.md'
      );
      expect(skillFile).toBeDefined();
      expect(result.path).toBe('AGENTS.md');
    });

    it('should normalize dots to hyphens in guard skill names', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'guards',
            content: {
              type: 'ObjectContent',
              properties: {
                'api.security': {
                  applyTo: ['**/api/**'],
                  description: 'API security rules',
                  content: 'Validate inputs.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });

      const skillFile = result.additionalFiles?.find((f) => f.path.includes('.factory/skills/'));
      expect(skillFile?.path).toBe('.factory/skills/api-security/SKILL.md');
      expect(skillFile?.content).toContain('name: api-security');
    });
  });

  describe('regression: droid specModel and specReasoningEffort emission', () => {
    it('should emit specModel and specReasoningEffort keys when set', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'agents',
            content: {
              type: 'ObjectContent',
              properties: {
                planner: {
                  description: 'Planning droid',
                  specModel: 'claude-opus-4-1',
                  specReasoningEffort: 'high',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };
      const result = formatter.format(ast, { version: 'full' });
      const droidFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/droids/planner.md'
      );
      expect(droidFile).toBeDefined();
      expect(droidFile?.content).toContain('specModel: claude-opus-4-1');
      expect(droidFile?.content).toContain('specReasoningEffort: high');
    });
  });

  describe('outputDir override for @use ... into', () => {
    it('honors __outputDir when generating the skill file', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'seo-audit': {
                  description: 'SEO audit skill',
                  content: 'Audit content',
                  __outputDir: 'skills/marketing/seo-audit',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile?.path).toBe('.factory/skills/marketing/seo-audit/SKILL.md');
    });

    it('honors target skillBaseDir when generating skill files', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                logstrip: {
                  description: 'Logstrip skill',
                  content: 'Compress logs.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { skillBaseDir: 'plugins/logstrip/.factory/skills' },
      });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile?.path).toBe('plugins/logstrip/.factory/skills/logstrip/SKILL.md');
    });

    it('combines skillBaseDir with __outputDir without duplicating skills segment', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                'seo-audit': {
                  description: 'SEO audit skill',
                  content: 'Audit content',
                  __outputDir: 'skills/marketing/seo-audit',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { skillBaseDir: 'plugins/logstrip/.factory/skills' },
      });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile?.path).toBe('plugins/logstrip/.factory/skills/marketing/seo-audit/SKILL.md');
    });

    it('filters emitted skills with includeSkills', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                keep: {
                  description: 'Keep skill',
                  content: 'Keep content.',
                },
                skip: {
                  description: 'Skip skill',
                  content: 'Skip content.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { includeSkills: ['keep'] },
      });
      const skillFiles = result.additionalFiles?.filter((f) => f.path.endsWith('SKILL.md')) ?? [];
      expect(skillFiles.map((f) => f.path)).toEqual(['.factory/skills/keep/SKILL.md']);
    });

    it('disables emitted skills when includeSkills is false', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                logstrip: {
                  description: 'Logstrip skill',
                  content: 'Compress logs.',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { includeSkills: false },
      });
      expect(result.additionalFiles?.some((f) => f.path.endsWith('SKILL.md')) ?? false).toBe(false);
    });

    it('strips traversal segments from __outputDir', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                s: {
                  description: 'd',
                  content: 'c',
                  __outputDir: '../../etc',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, { version: 'multifile' });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      expect(skillFile?.path).toBe('.factory/etc/SKILL.md');
    });

    it('combines skillBaseDir with non-skills __outputDir', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                audit: {
                  description: 'Audit skill',
                  content: 'Audit content.',
                  __outputDir: 'audit/seo-audit',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { skillBaseDir: 'plugins/logstrip/.factory/skills' },
      });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      // Non-skills prefix outputDir is kept under skillBaseDir as-is
      expect(skillFile?.path).toBe('plugins/logstrip/.factory/skills/audit/seo-audit/SKILL.md');
    });

    it('uses skillBaseDir with skillName when __outputDir is just skills/', () => {
      const ast: Program = {
        ...createMinimalProgram(),
        blocks: [
          {
            type: 'Block',
            name: 'skills',
            content: {
              type: 'ObjectContent',
              properties: {
                myskill: {
                  description: 'My skill',
                  content: 'My content.',
                  __outputDir: 'skills',
                },
              },
              loc: createLoc(),
            },
            loc: createLoc(),
          },
        ],
      };

      const result = formatter.format(ast, {
        version: 'multifile',
        targetConfig: { skillBaseDir: 'plugins/logstrip/.factory/skills' },
      });
      const skillFile = result.additionalFiles?.find((f) => f.path.endsWith('SKILL.md'));
      // "skills" as outputDir strips the skills prefix, leaving empty → falls back to skillName
      expect(skillFile?.path).toBe('plugins/logstrip/.factory/skills/myskill/SKILL.md');
    });
  });
});
