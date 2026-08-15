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
const mockResolverOptions = vi.fn();
vi.mock('@promptscript/resolver', () => ({
  Resolver: function MockResolver(options: unknown) {
    mockResolverOptions(options);
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

  it('should resolve config and entry from --cwd', async () => {
    mockLoadConfig.mockResolvedValue({
      input: { entry: 'custom/main.prs' },
      registries: {},
    });
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        review: { description: 'Review code' },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('review', { cwd: '/workspace' } as InspectOptions);

    expect(mockLoadConfig).toHaveBeenCalledWith('/workspace/promptscript.yaml');
    expect(mockResolve).toHaveBeenCalledWith('/workspace/custom/main.prs');
    expect(process.exitCode).toBeUndefined();
  });

  it('should error when --cwd contains no PromptScript config', async () => {
    mockExistsSync.mockReturnValue(false);

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('review', { cwd: '/workspace' } as InspectOptions);

    expect(mockLoadConfig).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should resolve an explicit config and remote registry path from --cwd', async () => {
    mockLoadConfig.mockResolvedValue({
      input: { entry: 'custom/main.prs' },
      registries: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: '/cache/remote-registry',
      isRemote: true,
    });
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        review: { description: 'Review code' },
      })
    );

    const { inspectCommand } = await import('../commands/inspect.js');
    await inspectCommand('review', {
      cwd: '/workspace',
      config: 'config/custom.yaml',
    } as InspectOptions);

    expect(mockLoadConfig).toHaveBeenCalledWith('/workspace/config/custom.yaml');
    expect(mockResolverOptions).toHaveBeenCalledWith(
      expect.objectContaining({ registryPath: '/cache/remote-registry' })
    );
    expect(process.exitCode).toBeUndefined();
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

  it('should explain a nested non-skill path as stable JSON', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Review',
        },
      })
    );

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('skills.code-review.description', {
      format: 'json',
    });

    expect(process.exitCode).toBeUndefined();
    const parsed = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0]![0]);
    expect(parsed.version).toBe(1);
    expect(parsed.path).toBe('skills.code-review.description');
    expect(parsed.entries[0]).toMatchObject({
      path: 'skills.code-review.description',
      value: 'Review',
    });
  });

  it('should accept block paths with a leading at sign', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          description: 'Review',
        },
      })
    );

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('@skills', {});

    expect(process.exitCode).toBeUndefined();
    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('skills');
  });

  it('should show text provenance and related diagnostics', async () => {
    const overlayLoc = { file: '/project/overlay.prs', line: 2, column: 1, offset: 20 };
    mockResolve.mockResolvedValue({
      ast: {
        type: 'Program',
        loc: LOC,
        uses: [],
        extends: [],
        blocks: [
          {
            type: 'Block',
            name: 'standards',
            loc: LOC,
            content: {
              type: 'ObjectContent',
              properties: { code: { frameworks: ['react', 'vue'] } },
              loc: LOC,
            },
          },
        ],
      },
      sources: ['/project/test.prs', '/project/overlay.prs'],
      provenance: {
        version: 1,
        entry: '/project/test.prs',
        entries: [
          {
            path: 'standards',
            kind: 'block',
            source: LOC,
            history: [
              { operation: 'declaration', action: 'selected', source: LOC, chain: [] },
              {
                operation: 'extend',
                action: 'merged',
                source: overlayLoc,
                strategy: 'merge',
                target: 'standards',
                chain: [
                  {
                    operation: 'extend',
                    source: overlayLoc,
                    target: 'standards',
                  },
                ],
              },
            ],
          },
          {
            path: 'standards.code',
            kind: 'field',
            source: LOC,
            history: [{ operation: 'declaration', action: 'selected', source: LOC, chain: [] }],
          },
          {
            path: 'standards.code.frameworks[0]',
            kind: 'list',
            source: overlayLoc,
            history: [
              { operation: 'declaration', action: 'selected', source: LOC, chain: [] },
              {
                operation: 'extend',
                action: 'appended',
                source: overlayLoc,
                strategy: 'append',
                chain: [],
              },
            ],
          },
        ],
      },
      errors: [{ message: 'Overlay warning', location: overlayLoc }],
    });

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('standards', {});

    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((call) => call[0])
      .join('\n');
    expect(output).toContain('final:');
    expect(output).toContain('extend/merged, merge, target standards');
    expect(output).toContain('via extend');
    expect(output).toContain('Diagnostics:');
    expect(output).toContain('Overlay warning');
    expect(output).toContain('standards.code.frameworks[0]');
  });

  it('should resolve indexed paths in JSON output', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': {
          frameworks: ['react', 'vue'],
        },
      })
    );

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('skills.code-review.frameworks[0]', { format: 'json' });

    const parsed = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0]![0]);
    expect(parsed.entries[0]).toMatchObject({
      path: 'skills.code-review.frameworks[0]',
      value: 'react',
    });
  });

  it('should resolve text, mixed, array, invalid, and circular values', async () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    const ast = {
      type: 'Program',
      loc: LOC,
      uses: [],
      extends: [],
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          loc: LOC,
          content: {
            type: 'TextContent',
            value: 'You are helpful.',
            loc: LOC,
          },
        },
        {
          type: 'Block',
          name: 'context',
          loc: LOC,
          content: {
            type: 'MixedContent',
            text: { type: 'TextContent', value: 'Project context.', loc: LOC },
            properties: {
              tooling: { editor: 'Vim' },
            },
            loc: LOC,
          },
        },
        {
          type: 'Block',
          name: 'config',
          loc: LOC,
          content: {
            type: 'ObjectContent',
            properties: {
              nested: { value: 'nested value' },
              circular,
            },
            loc: LOC,
          },
        },
        {
          type: 'Block',
          name: 'list',
          loc: LOC,
          content: {
            type: 'ArrayContent',
            elements: ['first item'],
            loc: LOC,
          },
        },
      ],
    };
    const entry = (path: string, kind: 'block' | 'value' | 'text'): object => ({
      path,
      kind,
      source: LOC,
      history: [],
    });
    mockResolve.mockResolvedValue({
      ast,
      sources: ['/project/test.prs'],
      provenance: {
        version: 1,
        entry: '/project/test.prs',
        entries: [
          entry('', 'value'),
          entry('unknown', 'value'),
          entry('identity', 'block'),
          entry('identity.text', 'text'),
          entry('identity.text[0]', 'text'),
          entry('identity[0]', 'value'),
          entry('identity.value[0]', 'value'),
          entry('context', 'block'),
          entry('context.text', 'text'),
          entry('context.text.missing', 'value'),
          entry('context.tooling', 'value'),
          entry('context.tooling.editor', 'value'),
          entry('context.tooling.editor.missing', 'value'),
          entry('config', 'block'),
          entry('config[0]', 'value'),
          entry('config.missing', 'value'),
          entry('config.nested', 'value'),
          entry('config.nested.value', 'value'),
          entry('config.text', 'value'),
          entry('config.circular', 'value'),
          entry('list.elements[0]', 'value'),
        ],
      },
      errors: [],
    });

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('', {});
    await explainCommand('unknown', {});
    await explainCommand('identity', {});
    await explainCommand('context', {});
    await explainCommand('config', {});
    await explainCommand('list', {});

    expect(process.exitCode).toBeUndefined();
    const output = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((call) => call[0])
      .join('\n');
    expect(output).toContain('(unavailable)');
    expect(output).toContain('nested value');
    expect(output).toContain('first item');
  });

  it('should resolve an explicit config and report unlocated diagnostics', async () => {
    mockLoadConfig.mockResolvedValue({
      input: { entry: 'custom/main.prs' },
      registries: {},
    });
    mockResolveRegistryPath.mockResolvedValue({
      path: '/cache/remote-registry',
      isRemote: true,
    });
    mockResolve.mockResolvedValue({
      ...makeResolvedAst({}),
      provenance: {
        version: 1,
        entry: '/workspace/custom/main.prs',
        entries: [
          {
            path: 'identity',
            kind: 'block',
            source: LOC,
            history: [],
          },
        ],
      },
      errors: [
        { message: 'Unlocated warning' },
        {
          message: 'Unrelated warning',
          location: { file: '/other.prs', line: 4, column: 2, offset: 5 },
        },
      ],
    });

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('identity', {
      cwd: '/workspace',
      config: 'config/custom.yaml',
    });

    expect(mockLoadConfig).toHaveBeenCalledWith('/workspace/config/custom.yaml');
    expect(mockResolverOptions).toHaveBeenCalledWith(
      expect.objectContaining({ registryPath: '/cache/remote-registry' })
    );
    expect(process.exitCode).toBeUndefined();
  });

  it('should report missing paths and missing entry files', async () => {
    mockResolve.mockResolvedValue(
      makeResolvedAst({
        'code-review': { description: 'Review code' },
      })
    );

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('skills.missing', {});
    expect(process.exitCode).toBe(1);

    vi.clearAllMocks();
    process.exitCode = undefined;
    mockLoadConfig.mockResolvedValue({ registries: {} });
    mockResolveRegistryPath.mockResolvedValue({ path: '/registry' });
    mockExistsSync.mockReturnValue(false);
    await explainCommand('skills.code-review', {});
    expect(process.exitCode).toBe(1);
  });

  it('should report resolution failures and configuration errors', async () => {
    mockResolve.mockResolvedValue({
      ast: null,
      sources: [],
      errors: [{ message: 'Parse error' }],
      provenance: { version: 1, entry: '/project/test.prs', entries: [] },
    });

    const { explainCommand } = await import('../commands/explain.js');
    await explainCommand('standards', {});
    expect(process.exitCode).toBe(1);

    vi.clearAllMocks();
    process.exitCode = undefined;
    mockExistsSync.mockReturnValue(false);
    await explainCommand('standards', { cwd: '/workspace' });
    expect(process.exitCode).toBe(1);

    vi.clearAllMocks();
    process.exitCode = undefined;
    mockLoadConfig.mockRejectedValue(new Error('bad config'));
    await explainCommand('standards', {});
    expect(process.exitCode).toBe(1);

    vi.clearAllMocks();
    process.exitCode = undefined;
    mockLoadConfig.mockRejectedValue('bad config');
    await explainCommand('standards', {});
    expect(process.exitCode).toBe(1);
  });
});
