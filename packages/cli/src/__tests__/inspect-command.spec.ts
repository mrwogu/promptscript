import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { InspectOptions } from '../types.js';

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
    cyan: (s: string) => s,
    bold: (s: string) => s,
  },
}));

// Mock console
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock config loader
const mockLoadConfig = vi.fn();
vi.mock('../config/loader', () => ({
  loadConfig: (...args: unknown[]) => mockLoadConfig(...args),
  findConfigFile: () => 'promptscript.yaml',
  CONFIG_FILES: ['promptscript.yaml'],
}));

// Mock registry resolver
const mockResolveRegistryPath = vi.fn();
vi.mock('../utils/registry-resolver', () => ({
  resolveRegistryPath: (...args: unknown[]) => mockResolveRegistryPath(...args),
}));

// Mock Resolver
const mockResolve = vi.fn();
vi.mock('@promptscript/resolver', () => ({
  Resolver: function MockResolver() {
    return { resolve: mockResolve };
  },
}));

// Mock fs
const mockExistsSync = vi.fn();
vi.mock('fs', () => ({
  existsSync: (path: string) => mockExistsSync(path),
}));

const LOC = { file: '/project/test.prs', line: 1, column: 1 };

function makeResolvedAst(skillsProperties: Record<string, unknown>) {
  return {
    ast: {
      type: 'Program',
      loc: LOC,
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          loc: LOC,
          content: {
            type: 'ObjectContent',
            properties: skillsProperties,
            loc: LOC,
          },
        },
      ],
      extends: [],
    },
    sources: ['/project/test.prs'],
    errors: [],
  };
}

describe('commands/inspect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockLoadConfig.mockResolvedValue({ registries: {} });
    mockResolveRegistryPath.mockResolvedValue({ path: '/registry' });
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('should show property-level view by default', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Review code',
          content: { type: 'TextContent', value: 'Review instructions', loc: LOC },
          allowedTools: ['Read', 'Bash'],
        },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('code-review', {} as InspectOptions);

    expect(process.exitCode).toBeUndefined();
    expect(console.log).toHaveBeenCalled();
    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Skill: code-review');
    expect(output).toContain('description');
  });

  it('should show layer-level view with --layers', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Overridden',
          __layerTrace: [
            {
              property: 'description',
              source: '/project/overlay.prs',
              strategy: 'replace',
              action: 'replaced',
            },
          ],
        },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('code-review', { layers: true } as InspectOptions);

    expect(process.exitCode).toBeUndefined();
    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Layer 1');
    expect(output).toContain('Layer 2');
    expect(output).toContain('replaced');
  });

  it('should output valid JSON with --format json', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Review code',
        },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('code-review', { format: 'json' } as InspectOptions);

    expect(process.exitCode).toBeUndefined();
    const jsonCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    expect(jsonCalls.length).toBeGreaterThan(0);
    const parsed = JSON.parse(jsonCalls[0]![0]);
    expect(parsed.skill).toBe('code-review');
    expect(parsed.properties).toBeDefined();
  });

  it('should error when skill is not found', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        deploy: { description: 'Deploy service' },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('unknown-skill', {} as InspectOptions);

    expect(process.exitCode).toBe(1);
  });

  it('should error when no @skills block exists', async () => {
    mockResolve.mockResolvedValue({
      ast: {
        type: 'Program',
        loc: LOC,
        uses: [],
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            loc: LOC,
            content: { type: 'TextContent', value: 'test', loc: LOC },
          },
        ],
        extends: [],
      },
      sources: [],
      errors: [],
    });

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('any-skill', {} as InspectOptions);

    expect(process.exitCode).toBe(1);
  });

  it('should error when entry file does not exist', async () => {
    mockExistsSync.mockReturnValue(false);

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('any-skill', {} as InspectOptions);

    expect(process.exitCode).toBe(1);
  });

  it('should error when resolution fails', async () => {
    mockResolve.mockResolvedValue({
      ast: null,
      sources: [],
      errors: [{ message: 'Parse error' }],
    });

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('any-skill', {} as InspectOptions);

    expect(process.exitCode).toBe(1);
  });

  it('should show sealed properties in output', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Review',
          content: { type: 'TextContent', value: 'Instructions', loc: LOC },
          sealed: ['content'],
        },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('code-review', {} as InspectOptions);

    expect(process.exitCode).toBeUndefined();
    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('sealed');
  });

  it('should handle skill with __layerTrace and __composedFrom metadata', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Composed',
          __layerTrace: [
            {
              property: 'description',
              source: '/overlay.prs',
              strategy: 'replace',
              action: 'replaced',
            },
          ],
          __composedFrom: [{ name: 'phase1', source: '/phase1.prs' }],
        },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('code-review', { format: 'json' } as InspectOptions);

    const parsed = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0]![0]);
    expect(parsed.layers).toHaveLength(1);
    expect(parsed.composedFrom).not.toBeNull();
  });
});
