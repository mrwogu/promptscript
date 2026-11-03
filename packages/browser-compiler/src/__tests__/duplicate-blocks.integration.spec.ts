import { describe, it, expect } from 'vitest';
import { compile } from '../index.js';

const CLAUDE = [{ name: 'claude', config: { version: 'full' } }];

function repro(syntax: string): string {
  return `@meta {
  id: "dup"
  syntax: "${syntax}"
}

@identity {
  """
  Probe.
  """
}

@mcpServers {
}

@mcpServers {
  probe: {
    transport: "stdio"
    command: ["node", "probe.mjs"]
  }
}
`;
}

async function compileFiles(
  files: Record<string, string>
): Promise<Awaited<ReturnType<typeof compile>>> {
  return compile(files, 'project.prs', { formatters: CLAUDE });
}

describe('duplicate blocks through the compile path', () => {
  describe.each([
    ['legacy', '1.4.0'],
    ['sequential', '1.5.0'],
  ])('two @mcpServers blocks in one file (%s mode)', (_mode, syntax) => {
    it('should fail with PS048 pointing at the second block', async () => {
      const result = await compileFiles({ 'project.prs': repro(syntax) });

      expect(result.success).toBe(false);
      const error = result.errors.find((e) => e.code === 'PS048');
      expect(error).toBeDefined();
      expect(error!.location?.line).toBe(15);
      expect(error!.message).toContain('@mcpServers');
      expect(error!.message).toContain('already declared at line 12');
    });

    it('should not produce a .mcp.json file', async () => {
      const result = await compileFiles({ 'project.prs': repro(syntax) });

      expect(result.outputs.has('.mcp.json')).toBe(false);
    });
  });

  describe('@shortcuts and @commands in one file', () => {
    const source = (syntax: string): string => `@meta { id: "alias" syntax: "${syntax}" }
@shortcuts {
  "/review": "Review code"
}
@commands {
  "/test": { content: """Run tests.""" }
}`;

    it('should report PS048 in sequential mode and mention the alias', async () => {
      const result = await compileFiles({ 'project.prs': source('1.5.0') });

      expect(result.success).toBe(false);
      const error = result.errors.find((e) => e.code === 'PS048');
      expect(error?.message).toContain('@shortcuts (alias @commands)');
      expect(error?.location?.line).toBe(5);
    });

    it('should merge them without PS048 in legacy mode', async () => {
      const result = await compileFiles({ 'project.prs': source('1.4.0') });

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
    });

    it('should merge two @commands blocks without PS048 in legacy mode', async () => {
      const result = await compileFiles({
        'project.prs': `@meta { id: "alias" syntax: "1.4.0" }
@commands {
  "/review": { content: """Review code.""" }
}
@commands {
  "/test": { content: """Run tests.""" }
}`,
      });

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
    });
  });

  describe.each(['1.4.0', '1.5.0'])('same-name blocks across files (syntax %s)', (syntax) => {
    const parent = `@meta { id: "parent" syntax: "${syntax}" }
@standards {
  code: ["Use TypeScript"]
}`;

    it('should compile clean when a child inherits a parent that defines the same block', async () => {
      const result = await compileFiles({
        'project.prs': `@meta { id: "child" syntax: "${syntax}" }
@inherit ./parent
@standards {
  testing: ["Use Vitest"]
}`,
        'parent.prs': parent,
      });

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
    });

    it('should compile clean when a child uses a file that defines the same block', async () => {
      const result = await compileFiles({
        'project.prs': `@meta { id: "child" syntax: "${syntax}" }
@use ./parent
@standards {
  testing: ["Use Vitest"]
}`,
        'parent.prs': parent,
      });

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
    });

    it('should compile clean when a child inherits, declares and extends the same block', async () => {
      const result = await compileFiles({
        'project.prs': `@meta { id: "child" syntax: "${syntax}" }
@inherit ./parent
@standards {
  testing: ["Use Vitest"]
}
@extend standards {
  types: ["Prefer unknown over any"]
}`,
        'parent.prs': parent,
      });

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
    });
  });
});
