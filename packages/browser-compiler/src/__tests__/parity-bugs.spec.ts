/**
 * Regression tests for browser-compiler parity bugs.
 *
 * Each test demonstrates a specific parity gap between the browser compiler
 * and the CLI resolver/compiler, then verifies the fix.
 */

import { describe, it, expect, vi } from 'vitest';
import { BrowserResolver } from '../resolver.js';
import { BrowserCompiler } from '../compiler.js';
import { VirtualFileSystem } from '../virtual-fs.js';
import { resolveGuardRequires } from '../guard-requires.js';
import type { ObjectContent, Value, ResolveError } from '@promptscript/core';
import type { Formatter, FormatterOutput, FormatOptions } from '@promptscript/formatters';
import type { Program } from '@promptscript/core';

// ============================================================
// Issue 1: Inline @use declarations (inlineUses) are never
// processed by the browser resolver.
// ============================================================

describe('Issue 1: skill composition (inlineUses) processing', () => {
  it('should compose inline @use sub-skills into parent skill content', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "parent" syntax: "1.2.0" }
@skills {
  deploy: {
    description: "Deploy skill"
    content: """Base deploy instructions"""
  }
  @use ./sub-skill
}`,
      'sub-skill.prs': `@meta { id: "sub" syntax: "1.2.0" }
@skills {
  sub-skill: {
    description: "Sub-skill"
    content: """Sub-skill instructions"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    expect(result.errors).toEqual([]);

    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    if (skillsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for skills block');
    }

    const deploy = skillsBlock.content.properties['deploy'] as Record<string, unknown>;
    expect(deploy).toBeDefined();

    // The composed content should include the sub-skill's instructions as a phase
    const content = deploy['content'];
    const contentValue =
      typeof content === 'string' ? content : ((content as { value?: string })?.value ?? '');
    expect(contentValue).toContain('Base deploy instructions');
    expect(contentValue).toContain('Phase 1');
    expect(contentValue).toContain('Sub-skill instructions');
  });

  it('should clear inlineUses after processing', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "parent" syntax: "1.2.0" }
@skills {
  ops: {
    description: "Ops"
    content: """Base"""
  }
  @use ./helper
}`,
      'helper.prs': `@meta { id: "helper" syntax: "1.2.0" }
@skills {
  helper: {
    description: "Helper"
    content: """Helper instructions"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    if (skillsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for skills block');
    }
    // inlineUses should be consumed (undefined) after composition
    expect(skillsBlock.content.inlineUses).toBeUndefined();
  });

  it('should store __composedFrom metadata on composed skills', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "parent" syntax: "1.2.0" }
@skills {
  audit: {
    description: "Audit"
    content: """Base audit"""
  }
  @use ./checker
}`,
      'checker.prs': `@meta { id: "checker" syntax: "1.2.0" }
@skills {
  checker: {
    description: "Checker"
    content: """Checker instructions"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    if (skillsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for skills block');
    }
    const audit = skillsBlock.content.properties['audit'] as Record<string, unknown>;
    const composedFrom = audit['__composedFrom'];
    expect(Array.isArray(composedFrom)).toBe(true);
    if (Array.isArray(composedFrom)) {
      const first = composedFrom[0] as Record<string, unknown>;
      expect(first['name']).toBe('checker');
    }
  });
});

// ============================================================
// Issue 2: Guard dependency resolution (__resolvedRequires) is
// never injected by the browser resolver.
// ============================================================

describe('Issue 2: guard requires resolution', () => {
  it('should inject __resolvedRequires for guards with requires deps', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "guards-test" syntax: "1.2.0" }
@guards {
  auth-check: {
    content: """Check authentication"""
    requires: ["logging"]
  }
  logging: {
    content: """Enable logging"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    expect(result.errors).toEqual([]);

    const guardsBlock = result.ast?.blocks.find((b) => b.name === 'guards');
    expect(guardsBlock).toBeDefined();
    if (guardsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for guards block');
    }

    const authCheck = guardsBlock.content.properties['auth-check'] as Record<string, unknown>;
    expect(authCheck).toBeDefined();
    const resolvedRequires = authCheck['__resolvedRequires'];
    expect(Array.isArray(resolvedRequires)).toBe(true);
    if (Array.isArray(resolvedRequires)) {
      expect(resolvedRequires).toHaveLength(1);
      const dep = resolvedRequires[0] as Record<string, unknown>;
      expect(dep['name']).toBe('logging');
      expect(dep['content']).toBe('Enable logging');
    }
  });

  it('should resolve transitive guard dependencies', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "transitive" syntax: "1.2.0" }
@guards {
  a: {
    content: """Guard A"""
    requires: ["b"]
  }
  b: {
    content: """Guard B"""
    requires: ["c"]
  }
  c: {
    content: """Guard C"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    const guardsBlock = result.ast?.blocks.find((b) => b.name === 'guards');
    if (guardsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for guards block');
    }
    const a = guardsBlock.content.properties['a'] as Record<string, unknown>;
    const resolvedRequires = a['__resolvedRequires'];
    expect(Array.isArray(resolvedRequires)).toBe(true);
    if (Array.isArray(resolvedRequires)) {
      // Should contain c (transitive) and b (direct)
      const names = resolvedRequires.map((r) => (r as Record<string, unknown>)['name'] as string);
      expect(names).toContain('b');
      expect(names).toContain('c');
    }
  });

  it('should not inject __resolvedRequires when guard has no requires', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "no-requires" syntax: "1.2.0" }
@guards {
  standalone: {
    content: """Standalone guard"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    const guardsBlock = result.ast?.blocks.find((b) => b.name === 'guards');
    if (guardsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for guards block');
    }
    const standalone = guardsBlock.content.properties['standalone'] as Record<string, unknown>;
    expect(standalone['__resolvedRequires']).toBeUndefined();
  });

  it('resolveGuardRequires module should work standalone', () => {
    // Direct unit test of the local guard-requires module
    const ast: Program = {
      type: 'Program',
      blocks: [
        {
          type: 'Block',
          name: 'guards',
          content: {
            type: 'ObjectContent',
            properties: {
              'auth-check': {
                content: 'Check auth',
                requires: ['logging'],
              } as unknown as Value,
              logging: {
                content: 'Enable logging',
              } as unknown as Value,
            },
            loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
          },
          loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
        },
      ],
      uses: [],
      extends: [],
      loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
    };

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const guardsBlock = result.blocks[0]!;
    const props = (guardsBlock.content as ObjectContent).properties;
    const authCheck = props['auth-check'] as Record<string, unknown>;
    expect(authCheck['__resolvedRequires']).toEqual([
      { name: 'logging', content: 'Enable logging' },
    ]);
  });
});

// ============================================================
// Issue 3: Sealed skill properties can be overridden because
// mergeSkillValue doesn't check the `sealed` set.
// ============================================================

describe('Issue 3: sealed property enforcement in @extend', () => {
  it('should throw ResolveError when extending a sealed property', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "sealed-test" syntax: "1.2.0" }
@skills {
  expert: {
    description: "Base expert"
    content: """Critical instructions"""
    sealed: ["content"]
  }
}
@extend skills.expert {
  content: """Override attempt"""
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    // The resolver should surface a ResolveError about the sealed property
    expect(result.errors.length).toBeGreaterThan(0);
    const sealedError = result.errors.find((e: ResolveError) => e.message.includes('sealed'));
    expect(sealedError).toBeDefined();
    expect(sealedError?.message).toContain("Cannot override sealed property 'content'");
  });

  it('should throw when sealed: true and any replace-strategy property is overridden', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "sealed-true" syntax: "1.2.0" }
@skills {
  expert: {
    description: "Base expert"
    content: """Instructions"""
    sealed: true
  }
}
@extend skills.expert {
  description: "Override attempt"
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.errors.length).toBeGreaterThan(0);
    const sealedError = result.errors.find((e: ResolveError) => e.message.includes('sealed'));
    expect(sealedError).toBeDefined();
    expect(sealedError?.message).toContain("Cannot override sealed property 'description'");
  });

  it('should NOT block append-strategy properties even when sealed: true', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "sealed-append" syntax: "1.2.0" }
@skills {
  expert: {
    description: "Base expert"
    references: ["./base.md"]
    sealed: true
  }
}
@extend skills.expert {
  references: ["./overlay.md"]
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.errors).toEqual([]);
    expect(result.ast).not.toBeNull();
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    if (skillsBlock?.content.type !== 'ObjectContent') {
      throw new Error('expected ObjectContent for skills block');
    }
    const expert = skillsBlock.content.properties['expert'] as Record<string, unknown>;
    const refs = expert['references'] as unknown[];
    const refStrings = refs.map(String);
    expect(refStrings).toContain('./base.md');
    expect(refStrings).toContain('./overlay.md');
  });

  it('should preserve sealed through multiple extends', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "multi-extend" syntax: "1.2.0" }
@skills {
  expert: {
    description: "Base expert"
    content: """Critical"""
    sealed: ["content"]
  }
}
@extend skills.expert {
  references: ["./layer2.md"]
}
@extend skills.expert {
  content: """Override by layer 3"""
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.errors.length).toBeGreaterThan(0);
    const sealedError = result.errors.find((e: ResolveError) => e.message.includes('sealed'));
    expect(sealedError).toBeDefined();
    expect(sealedError?.message).toContain("Cannot override sealed property 'content'");
  });
});

// ============================================================
// Issue 4: Colliding formatter output paths silently overwrite.
// ============================================================

/**
 * Minimal formatter that always outputs to a fixed path.
 * Used to simulate two formatters writing to the same file.
 */
function createStubFormatter(name: string, outputPath: string, content: string): Formatter {
  return {
    name,
    outputPath,
    description: `Stub formatter ${name}`,
    defaultConvention: 'markdown',
    format: (_ast: Program, _options?: FormatOptions): FormatterOutput => ({
      path: outputPath,
      content,
    }),
    getSupportedVersions: () => ({
      default: {
        name: 'default',
        description: 'Default version',
        outputPath,
      },
    }),
  };
}

describe('Issue 4: colliding formatter output paths', () => {
  it('should warn when two formatters write to the same output path', async () => {
    const warnCalls: string[] = [];
    const logger = {
      debug: vi.fn(),
      verbose: vi.fn(),
      info: vi.fn(),
      warn: (msg: string) => warnCalls.push(msg),
      error: vi.fn(),
    };

    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "collision" syntax: "1.0.0" }
@identity { """Test.""" }`,
    });

    // Two formatters that both output to OUTPUT.md
    const formatterA = createStubFormatter('formatter-a', 'OUTPUT.md', 'Content A');
    const formatterB = createStubFormatter('formatter-b', 'OUTPUT.md', 'Content B');

    const compiler = new BrowserCompiler({
      fs,
      formatters: [formatterA, formatterB],
      logger,
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    // A warning should have been logged about the collision
    const collisionWarn = warnCalls.find((m) => m.includes('OUTPUT.md') && m.includes('collision'));
    expect(collisionWarn).toBeDefined();
  });

  it('should track which formatter owns each path in the result', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "collision-track" syntax: "1.0.0" }
@identity { """Test.""" }`,
    });

    const formatterA = createStubFormatter('formatter-a', 'SHARED.md', 'Content A');
    const formatterB = createStubFormatter('formatter-b', 'SHARED.md', 'Content B');

    const compiler = new BrowserCompiler({
      fs,
      formatters: [formatterA, formatterB],
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    // The output map should still contain the path (last formatter wins)
    expect(result.outputs.has('SHARED.md')).toBe(true);
    // outputOwners should track the last formatter that wrote to each path
    expect(result.outputOwners.get('SHARED.md')).toBe('formatter-b');
  });

  it('should not warn when formatters write to different paths', async () => {
    const warnCalls: string[] = [];
    const logger = {
      debug: vi.fn(),
      verbose: vi.fn(),
      info: vi.fn(),
      warn: (msg: string) => warnCalls.push(msg),
      error: vi.fn(),
    };

    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "no-collision" syntax: "1.0.0" }
@identity { """Test.""" }`,
    });

    const formatterA = createStubFormatter('formatter-a', 'A.md', 'Content A');
    const formatterB = createStubFormatter('formatter-b', 'B.md', 'Content B');

    const compiler = new BrowserCompiler({
      fs,
      formatters: [formatterA, formatterB],
      logger,
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    const collisionWarn = warnCalls.find((m) => m.includes('collision'));
    expect(collisionWarn).toBeUndefined();
  });

  it('should warn on additional file output path collisions', async () => {
    // Covers compiler.ts lines 287-288: additional file collision detection
    const warnCalls: string[] = [];
    const logger = {
      debug: vi.fn(),
      verbose: vi.fn(),
      info: vi.fn(),
      warn: (msg: string) => warnCalls.push(msg),
      error: vi.fn(),
    };

    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "addl-collision" syntax: "1.0.0" }
@identity { """Test.""" }`,
    });

    // Formatter A outputs to OUTPUT.md and an additional file EXTRA.md
    const formatterA: Formatter = {
      name: 'formatter-a',
      outputPath: 'OUTPUT.md',
      description: 'Formatter A',
      defaultConvention: 'markdown',
      format: (_ast: Program, _options?: FormatOptions): FormatterOutput => ({
        path: 'OUTPUT.md',
        content: 'Content A',
        additionalFiles: [{ path: 'EXTRA.md', content: 'Extra A' }],
      }),
      getSupportedVersions: () => ({
        default: { name: 'default', description: 'Default', outputPath: 'OUTPUT.md' },
      }),
    };

    // Formatter B outputs to OUTPUT2.md but also writes EXTRA.md as additional
    const formatterB: Formatter = {
      name: 'formatter-b',
      outputPath: 'OUTPUT2.md',
      description: 'Formatter B',
      defaultConvention: 'markdown',
      format: (_ast: Program, _options?: FormatOptions): FormatterOutput => ({
        path: 'OUTPUT2.md',
        content: 'Content B',
        additionalFiles: [{ path: 'EXTRA.md', content: 'Extra B' }],
      }),
      getSupportedVersions: () => ({
        default: { name: 'default', description: 'Default', outputPath: 'OUTPUT2.md' },
      }),
    };

    const compiler = new BrowserCompiler({
      fs,
      formatters: [formatterA, formatterB],
      logger,
    });

    const result = await compiler.compile('project.prs');

    expect(result.success).toBe(true);
    // Should warn about EXTRA.md collision (additional file)
    const addlCollisionWarn = warnCalls.find(
      (m) => m.includes('EXTRA.md') && m.includes('collision')
    );
    expect(addlCollisionWarn).toBeDefined();
  });
});

// ============================================================
// Issue: Sub-skill resolution with errors (codecov lines 626, 629, 635, 636)
// ============================================================

describe('Sub-skill resolution with errors', () => {
  it('pushes sub-skill sources and errors to parent, then catches composition error', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "parent" syntax: "1.2.0" }
@skills {
  deploy: {
    description: "Deploy"
    content: """Base"""
  }
  @use ./missing-sub
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    // The sub-skill file doesn't exist, so resolveFile returns errors
    // and the composition error is caught
    expect(result.errors.length).toBeGreaterThan(0);
    const errorMsg = result.errors.map((e) => e.message).join('\n');
    expect(errorMsg).toContain('sub-skill');
  });
});

// ============================================================
// Issue: applyExtends throws non-ResolveError (codecov line 382)
// ============================================================

describe('applyExtends non-ResolveError handling', () => {
  it('wraps non-ResolveError from applyExtends into ResolveError', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "test" syntax: "1.2.0" }
@skills {
  deploy: {
    content: """test"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    // Mock applyExtends to throw a non-ResolveError
    vi.spyOn(
      resolver as unknown as { applyExtends: (...args: unknown[]) => unknown },
      'applyExtends'
    ).mockImplementation(() => {
      throw new TypeError('extend processing error');
    });
    const result = await resolver.resolve('project.prs');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('Extension resolution failed');
    expect(result.errors[0]!.message).toContain('extend processing error');
  });
});
