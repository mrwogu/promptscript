/**
 * Cross-formatter coverage tests.
 *
 * Verifies that ALL formatters with custom addCommonSections (Claude, GitHub,
 * Cursor, Antigravity) handle the complete PromptScript language surface area.
 * Formatters extending MarkdownInstructionFormatter inherit coverage from the
 * base class, so they are spot-checked rather than exhaustively tested here.
 *
 * Each test group exercises a single AST block across all four custom formatters
 * to catch "missing section" bugs like the knowledgeContent omission.
 */
import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';
import { ClaudeFormatter } from '../formatters/claude.js';
import { GitHubFormatter } from '../formatters/github.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
import { FactoryFormatter } from '../formatters/factory.js';

const loc = (): SourceLocation => ({ file: 'test.prs', line: 1, column: 1 });

const program = (...blocks: Block[]): Program => ({
  type: 'Program',
  uses: [],
  blocks,
  extends: [],
  loc: loc(),
});

const block = (name: string, content: Block['content']): Block => ({
  type: 'Block',
  name,
  content,
  loc: loc(),
});

const text = (value: string): Block['content'] => ({
  type: 'TextContent',
  value,
  loc: loc(),
});

const obj = (properties: Record<string, Value>): Block['content'] => ({
  type: 'ObjectContent',
  properties,
  loc: loc(),
});

const arr = (elements: Value[]): Block['content'] => ({
  type: 'ArrayContent',
  elements,
  loc: loc(),
});

// ============================================================
// Formatter instances
// ============================================================

const claude = new ClaudeFormatter();
const github = new GitHubFormatter();
const cursor = new CursorFormatter();
const antigravity = new AntigravityFormatter();
const factory = new FactoryFormatter();

// All custom formatters (extend BaseFormatter, override addCommonSections)
const customFormatters = [
  { name: 'claude', fmt: claude },
  { name: 'github', fmt: github },
  { name: 'cursor', fmt: cursor },
  { name: 'antigravity', fmt: antigravity },
];

// MIF-based formatter for reference comparison
const mifFormatter = { name: 'factory', fmt: factory };

// ============================================================
// @identity block
// ============================================================

describe('@identity → Project section', () => {
  const ast = program(
    block('identity', text('You are an expert TypeScript developer building a REST API.'))
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders identity text`, () => {
      const result = fmt.format(ast);
      expect(result.content).toContain('TypeScript developer');
    });
  }

  it('factory (MIF): renders identity text', () => {
    const result = mifFormatter.fmt.format(
      program(
        block('identity', text('You are an expert TypeScript developer building a REST API.'))
      )
    );
    expect(result.content).toContain('TypeScript developer');
  });

  it('all formatters produce non-empty output with only @identity', () => {
    for (const { name, fmt } of customFormatters) {
      const result = fmt.format(ast);
      // Should have more than just a header
      expect(result.content.length, `${name} output too short`).toBeGreaterThan(50);
    }
  });
});

// ============================================================
// @context MixedContent — text + properties (project desc + tech stack)
// ============================================================

describe('@context MixedContent → Project + Tech Stack', () => {
  const mixedContext: Block['content'] = {
    type: 'MixedContent',
    text: {
      type: 'TextContent',
      value: 'A Node.js REST API for e-commerce platforms.',
      loc: loc(),
    },
    properties: {
      languages: ['TypeScript', 'SQL'],
      runtime: 'Node.js 22',
      monorepo: { tool: 'Turborepo', packageManager: 'pnpm' },
    },
    loc: loc(),
  };

  const ast = program(block('context', mixedContext));

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders text portion as project description`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} drops MixedContent text from @context`).toContain(
        'e-commerce'
      );
    });

    it(`${name}: renders properties as tech stack`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} drops MixedContent properties from @context`).toContain(
        'TypeScript'
      );
    });
  }

  it('factory (MIF): renders both text and properties from MixedContent @context', () => {
    const result = mifFormatter.fmt.format(ast);
    expect(result.content).toContain('e-commerce');
    expect(result.content).toContain('TypeScript');
  });
});

describe('@context MixedContent — @identity takes precedence over @context text', () => {
  const ast = program(
    block('identity', text('You are an expert developer.')),
    block('context', {
      type: 'MixedContent',
      text: { type: 'TextContent', value: 'This should NOT appear as project.', loc: loc() },
      properties: { languages: ['Go'] },
      loc: loc(),
    } as Block['content'])
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: uses @identity not @context text when both exist`, () => {
      const result = fmt.format(ast);
      expect(result.content).toContain('expert developer');
      expect(result.content).not.toContain('should NOT appear');
    });
  }
});

describe('@context ObjectContent (no text) — no project section fallback', () => {
  const ast = program(block('context', obj({ languages: ['Rust'], runtime: 'tokio' })));

  for (const { name, fmt } of customFormatters) {
    it(`${name}: does not generate empty project section from ObjectContent @context`, () => {
      const result = fmt.format(ast);
      // Should have tech stack but NOT a project section with empty text
      expect(result.content).toContain('Rust');
    });
  }
});

// ============================================================
// @context block — tech stack (ObjectContent)
// ============================================================

describe('@context → Tech Stack (ObjectContent)', () => {
  const ast = program(
    block(
      'context',
      obj({
        languages: ['TypeScript', 'Python'],
        runtime: 'Node.js 22',
        monorepo: { tool: 'Nx', packageManager: 'pnpm' },
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders tech stack from @context`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} missing TypeScript`).toContain('TypeScript');
    });
  }
});

// ============================================================
// @standards.code fallback for tech stack (no @context)
// ============================================================

describe('@standards.code → Tech Stack fallback (no @context)', () => {
  const ast = program(
    block(
      'standards',
      obj({
        code: {
          languages: ['Rust', 'Go'],
          frameworks: ['Actix'],
          testing: ['cargo test'],
        },
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders tech stack from @standards.code when no @context`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} missing Rust from standards fallback`).toContain('Rust');
    });
  }

  it('factory (MIF): renders tech stack from @standards.code', () => {
    const result = mifFormatter.fmt.format(ast);
    expect(result.content).toContain('Rust');
  });
});

// ============================================================
// @context → Architecture (TextContent with ## Architecture)
// ============================================================

describe('@context → Architecture section', () => {
  const ast = program(
    block('context', text('## Architecture\n\n```mermaid\nflowchart LR\n  A --> B\n```'))
  );

  // Claude, GitHub, Antigravity should extract architecture code block
  for (const { name, fmt } of [
    { name: 'claude', fmt: claude },
    { name: 'github', fmt: github },
    { name: 'antigravity', fmt: antigravity },
  ]) {
    it(`${name}: extracts architecture from @context text`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} missing architecture`).toContain('flowchart');
    });
  }
});

// ============================================================
// @standards — code standards
// ============================================================

describe('@standards → Code Standards', () => {
  const ast = program(
    block(
      'standards',
      obj({
        typescript: {
          strictMode: true,
          exports: 'named only',
        },
        naming: {
          files: 'kebab-case.ts',
          classes: 'PascalCase',
        },
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders code standards`, () => {
      const result = fmt.format(ast);
      // At least one standard should be rendered
      const hasStandard =
        result.content.includes('strict') ||
        result.content.includes('named') ||
        result.content.includes('kebab') ||
        result.content.includes('PascalCase');
      expect(hasStandard, `${name} missing code standards`).toBe(true);
    });
  }
});

// ============================================================
// @standards.git — git commit conventions
// ============================================================

describe('@standards.git → Git Commits', () => {
  const ast = program(
    block(
      'standards',
      obj({
        git: {
          format: 'Conventional Commits',
          types: ['feat', 'fix', 'docs'],
          scope: 'always include package scope',
          example: 'feat(parser): add multiline strings',
        },
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders git commit conventions`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} missing git conventions`).toContain('Conventional Commits');
    });
  }
});

// ============================================================
// @standards.config — config files
// ============================================================

describe('@standards.config → Config Files', () => {
  const ast = program(
    block(
      'standards',
      obj({
        config: {
          eslint: 'inherit from eslint.base.config.cjs',
          viteRoot: '__dirname',
        },
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders config file standards`, () => {
      const result = fmt.format(ast);
      const hasConfig = result.content.includes('eslint') || result.content.includes('vite');
      expect(hasConfig, `${name} missing config standards`).toBe(true);
    });
  }
});

// ============================================================
// @standards.documentation
// ============================================================

describe('@standards.documentation → Documentation section', () => {
  const ast = program(
    block(
      'standards',
      obj({
        documentation: {
          verifyBefore: true,
          verifyAfter: true,
          codeExamples: true,
        },
      })
    )
  );

  // Cursor extracts documentation differently (reads string values, skips booleans)
  // so it produces no output for boolean-valued documentation properties.
  for (const { name, fmt } of [
    { name: 'claude', fmt: claude },
    { name: 'github', fmt: github },
    { name: 'antigravity', fmt: antigravity },
  ]) {
    it(`${name}: renders documentation standards`, () => {
      const result = fmt.format(ast);
      const hasDocs =
        result.content.includes('doc') ||
        result.content.includes('Doc') ||
        result.content.includes('Review') ||
        result.content.includes('examples');
      expect(hasDocs, `${name} missing documentation section`).toBe(true);
    });
  }
});

// ============================================================
// @standards.diagrams
// ============================================================

describe('@standards.diagrams → Diagrams section', () => {
  const ast = program(
    block(
      'standards',
      obj({
        diagrams: {
          format: 'mermaid',
          types: ['flowchart', 'sequence'],
        },
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders diagram standards`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} missing diagrams`).toContain('mermaid');
    });
  }
});

// ============================================================
// @shortcuts — commands section
// ============================================================

describe('@shortcuts → Commands section', () => {
  const ast = program(
    block(
      'shortcuts',
      obj({
        '/review': 'Review code quality',
        '/test': 'Run all tests',
        '/build': 'Build the project',
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders shortcuts as commands`, () => {
      const result = fmt.format(ast);
      const hasCommands =
        result.content.includes('/review') ||
        result.content.includes('review') ||
        result.content.includes('Review');
      expect(hasCommands, `${name} missing commands from shortcuts`).toBe(true);
    });
  }
});

// ============================================================
// @knowledge — remaining content (the knowledgeContent bug)
// ============================================================

describe('@knowledge → remaining content rendered', () => {
  const ast = program(
    block(
      'knowledge',
      text(
        '# GitNexus Code Intelligence\n\nThis project is indexed by GitNexus.\n\n## Always Do\n\n- Run impact analysis before editing.\n- Run detect_changes before committing.\n\n## Development Commands\n\n```bash\nnpm test\n```\n\n## Post-Work Verification\n\n```bash\nnpm run lint\n```'
      )
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders remaining @knowledge content (not just dev commands/post-work)`, () => {
      const result = fmt.format(ast);
      expect(
        result.content,
        `${name} drops remaining @knowledge content (knowledgeContent bug)`
      ).toContain('GitNexus');
    });
  }

  it('factory (MIF): renders remaining @knowledge content', () => {
    const result = mifFormatter.fmt.format(ast);
    expect(result.content).toContain('GitNexus');
  });
});

describe('@knowledge — dev commands and post-work are consumed separately', () => {
  const ast = program(
    block(
      'knowledge',
      text(
        '## Development Commands\n\n```bash\nnpm test\n```\n\n## Post-Work Verification\n\n```bash\nnpm run build\n```'
      )
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: does not duplicate consumed sections in knowledgeContent`, () => {
      const result = fmt.format(ast);
      // Content should not appear twice (once in commands/postWork, once in knowledgeContent)
      const matches = result.content.match(/npm test/g);
      expect((matches ?? []).length, `${name} duplicates dev commands content`).toBeLessThanOrEqual(
        1
      );
    });
  }
});

describe('@knowledge — consumed header at end of text with no trailing newline', () => {
  const ast = program(
    block('knowledge', text('# Important Info\n\nDo this always.\n\n## Development Commands'))
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: strips consumed header at end of text`, () => {
      const result = fmt.format(ast);
      expect(result.content, `${name} should render remaining knowledge`).toContain(
        'Do this always'
      );
      // The "## Development Commands" at the end (no newline after) should be stripped
      expect(result.content).not.toContain('## Development Commands');
    });
  }
});

describe('@knowledge — only consumed sections, nothing remaining', () => {
  const ast = program(
    block(
      'knowledge',
      text(
        '## Development Commands\n\n```bash\nnpm test\n```\n\n## Post-Work Verification\n\n```bash\nnpm run lint\n```'
      )
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: no empty knowledge section when all content is consumed`, () => {
      const result = fmt.format(ast);
      // Should NOT have a dangling empty knowledge section
      expect(result.content).not.toMatch(/##\s+Knowledge\s*\n\s*\n\s*$/m);
    });
  }
});

// ============================================================
// @restrictions — ArrayContent
// ============================================================

describe('@restrictions (ArrayContent)', () => {
  const ast = program(
    block('restrictions', arr(['Never use any type', 'Never skip error handling']))
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders restrictions from ArrayContent`, () => {
      const result = fmt.format(ast);
      const hasRestriction =
        result.content.includes('any type') || result.content.includes('error handling');
      expect(hasRestriction, `${name} missing ArrayContent restrictions`).toBe(true);
    });
  }
});

// ============================================================
// @restrictions — TextContent
// ============================================================

describe('@restrictions (TextContent)', () => {
  const ast = program(
    block('restrictions', text('- Never use default exports\n- Never commit without tests'))
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders restrictions from TextContent`, () => {
      const result = fmt.format(ast);
      const hasRestriction =
        result.content.includes('default exports') || result.content.includes('commit');
      expect(hasRestriction, `${name} missing TextContent restrictions`).toBe(true);
    });
  }
});

// ============================================================
// @restrictions — ObjectContent (the Antigravity bug)
// ============================================================

describe('@restrictions (ObjectContent with items array)', () => {
  const ast = program(
    block(
      'restrictions',
      obj({
        items: ['Never use any type', 'Never skip tests'],
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: renders restrictions from ObjectContent items`, () => {
      const result = fmt.format(ast);
      const hasRestriction =
        result.content.includes('any type') || result.content.includes('skip tests');
      expect(hasRestriction, `${name} drops ObjectContent restrictions (items array)`).toBe(true);
    });
  }

  it('factory (MIF): renders ObjectContent restrictions', () => {
    const result = mifFormatter.fmt.format(ast);
    const hasRestriction =
      result.content.includes('any type') || result.content.includes('skip tests');
    expect(hasRestriction).toBe(true);
  });
});

// ============================================================
// @skills — multifile generation
// ============================================================

describe('@skills → skill file generation (multifile/full)', () => {
  const ast = program(
    block(
      'skills',
      obj({
        commit: {
          description: 'Create git commits',
          content: 'Use Conventional Commits format.',
        },
      })
    )
  );

  it('claude: generates skill files in full mode', () => {
    const result = claude.format(ast, { version: 'full' });
    expect(result.additionalFiles, 'claude missing skill files').toBeDefined();
    const skillFile = result.additionalFiles?.find((f) => f.path.includes('commit'));
    expect(skillFile, 'claude missing commit skill file').toBeDefined();
    expect(skillFile?.content).toContain('Conventional Commits');
  });

  it('factory: generates skill files in multifile mode', () => {
    const result = factory.format(ast, { version: 'multifile' });
    expect(result.additionalFiles, 'factory missing skill files').toBeDefined();
    const skillFile = result.additionalFiles?.find((f) => f.path.includes('commit'));
    expect(skillFile, 'factory missing commit skill file').toBeDefined();
    expect(skillFile?.content).toContain('Conventional Commits');
  });
});

// ============================================================
// @agents — agent file generation
// ============================================================

describe('@agents → agent file generation (full mode)', () => {
  const ast = program(
    block(
      'agents',
      obj({
        reviewer: {
          description: 'Reviews code for quality',
          content: 'You review code thoroughly.',
        },
      })
    )
  );

  it('claude: generates agent files in full mode', () => {
    const result = claude.format(ast, { version: 'full' });
    const agentFile = result.additionalFiles?.find((f) => f.path.includes('reviewer'));
    expect(agentFile).toBeDefined();
    expect(agentFile?.content).toContain('review');
  });

  it('factory: generates droid files in full mode', () => {
    const result = factory.format(ast, { version: 'full' });
    const droidFile = result.additionalFiles?.find((f) => f.path.includes('reviewer'));
    expect(droidFile).toBeDefined();
    expect(droidFile?.content).toContain('review');
  });
});

// ============================================================
// Empty/missing blocks — negative paths
// ============================================================

describe('empty AST — all formatters produce minimal valid output', () => {
  const ast = program();

  for (const { name, fmt } of customFormatters) {
    it(`${name}: handles empty AST without errors`, () => {
      expect(() => fmt.format(ast)).not.toThrow();
      const result = fmt.format(ast);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.path.length).toBeGreaterThan(0);
    });
  }
});

describe('only @meta block — no content sections', () => {
  const ast = program(
    block(
      'meta',
      obj({
        id: 'test-project',
        syntax: '1.0.0',
      })
    )
  );

  for (const { name, fmt } of customFormatters) {
    it(`${name}: handles meta-only AST without errors`, () => {
      expect(() => fmt.format(ast)).not.toThrow();
    });
  }
});

// ============================================================
// Combined blocks — full realistic AST
// ============================================================

describe('full realistic AST — all sections rendered', () => {
  const fullAst = program(
    block('identity', text('You are an expert TypeScript developer.')),
    block(
      'context',
      obj({
        languages: ['TypeScript'],
        runtime: 'Node.js 22',
        monorepo: { tool: 'Nx', packageManager: 'pnpm' },
      })
    ),
    block(
      'standards',
      obj({
        typescript: { strictMode: true },
        git: {
          format: 'Conventional Commits',
          types: ['feat', 'fix'],
        },
        config: { eslint: 'base config' },
        documentation: { verifyBefore: true, verifyAfter: true },
        diagrams: { format: 'mermaid', types: ['flowchart'] },
      })
    ),
    block(
      'knowledge',
      text(
        '# Custom Knowledge\n\nImportant project-specific knowledge.\n\n## Development Commands\n\n```bash\npnpm test\n```'
      )
    ),
    block(
      'shortcuts',
      obj({
        '/test': 'Run tests',
        '/build': 'Build project',
      })
    ),
    block('restrictions', arr(['Never use any type', 'Never skip tests']))
  );

  const expectedSections = [
    { label: 'identity/project', pattern: /TypeScript developer/i },
    { label: 'tech stack', pattern: /TypeScript|Node\.js/i },
    { label: 'git conventions', pattern: /Conventional Commits/i },
    { label: 'knowledge content', pattern: /Custom Knowledge|Important project/i },
    { label: 'restrictions', pattern: /any type|skip tests/i },
  ];

  for (const { name, fmt } of customFormatters) {
    for (const { label, pattern } of expectedSections) {
      it(`${name}: renders ${label}`, () => {
        const result = fmt.format(fullAst);
        expect(result.content, `${name} missing ${label}`).toMatch(pattern);
      });
    }
  }
});
