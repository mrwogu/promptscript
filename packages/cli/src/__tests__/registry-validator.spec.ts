import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateRegistry } from '../utils/registry-validator.js';
import { type CliServices } from '../services.js';

describe('utils/registry-validator', () => {
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };

  const validManifest = `
version: '1'
meta:
  name: Test Registry
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core configs
    priority: 100
catalog:
  - id: '@core/base'
    path: '@core/base.prs'
    name: Base
    description: Base config
    tags: [core]
    targets: [github]
    dependencies: []
`;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFs = {
      existsSync: vi.fn().mockReturnValue(true),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(validManifest),
      readdir: vi.fn().mockResolvedValue(['base.prs']),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };
  });

  it('should validate a valid registry', async () => {
    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    expect(result.stats.namespaces).toBe(1);
    expect(result.stats.catalogEntries).toBe(1);
  });

  it('should fail when manifest is missing', async () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toContain('registry-manifest.yaml not found');
  });

  it('should fail when manifest has invalid YAML', async () => {
    mockFs.readFile.mockResolvedValue('invalid: yaml: {: broken');

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toContain('Failed to parse manifest');
  });

  it('should fail when version is missing', async () => {
    mockFs.readFile.mockResolvedValue(`
meta:
  name: Test
namespaces: {}
catalog: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('version'))).toBe(true);
  });

  it('should fail when version is unsupported', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '2'
meta:
  name: Test
namespaces: {}
catalog: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('Unsupported'))).toBe(true);
  });

  it('should fail when catalog entry references missing file', async () => {
    mockFs.existsSync.mockImplementation((path: string) => {
      if (typeof path === 'string' && path.endsWith('registry-manifest.yaml')) return true;
      if (typeof path === 'string' && path.endsWith('.prs')) return false;
      return true;
    });

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('missing file'))).toBe(true);
  });

  it('should fail when catalog entry references undeclared namespace', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - id: '@unknown/thing'
    path: '@unknown/thing.prs'
    name: Thing
    description: A thing
    tags: [thing]
    targets: [github]
    dependencies: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('undeclared namespace'))).toBe(true);
  });

  it('should warn about orphaned .prs files', async () => {
    mockFs.readdir.mockResolvedValue(['base.prs', 'orphan.prs']);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.issues.some((i) => i.message.includes('Orphaned'))).toBe(true);
    expect(result.issues.find((i) => i.message.includes('Orphaned'))?.severity).toBe('warning');
  });

  it('should warn about missing dependencies', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - id: '@core/child'
    path: '@core/child.prs'
    name: Child
    description: Child config
    tags: [core]
    targets: [github]
    dependencies: ['@core/missing-parent']
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.issues.some((i) => i.message.includes('missing-parent'))).toBe(true);
  });

  it('should detect circular dependencies', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - id: '@core/a'
    path: '@core/a.prs'
    name: A
    description: Config A
    tags: [core]
    targets: [github]
    dependencies: ['@core/b']
  - id: '@core/b'
    path: '@core/b.prs'
    name: B
    description: Config B
    tags: [core]
    targets: [github]
    dependencies: ['@core/a']
`);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdir.mockResolvedValue(['a.prs', 'b.prs']);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.issues.some((i) => i.message.includes('Circular dependency'))).toBe(true);
  });

  it('should detect duplicate catalog IDs', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - id: '@core/base'
    path: '@core/base.prs'
    name: Base
    description: Base config
    tags: [core]
    targets: [github]
    dependencies: []
  - id: '@core/base'
    path: '@core/base2.prs'
    name: Base 2
    description: Duplicate
    tags: [core]
    targets: [github]
    dependencies: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.issues.some((i) => i.message.includes('Duplicate'))).toBe(true);
  });

  it('should report stats correctly', async () => {
    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.stats.namespaces).toBe(1);
    expect(result.stats.catalogEntries).toBe(1);
    expect(result.stats.prsFiles).toBe(1);
  });

  it('should error when catalog entry is missing id', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - path: '@core/base.prs'
    name: Base
    description: Base config
    tags: [core]
    targets: [github]
    dependencies: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('missing required field: id'))).toBe(true);
  });

  it('should error when catalog entry is missing path', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
  description: Test
  lastUpdated: '2026-01-01'
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  - id: '@core/base'
    name: Base
    description: Base config
    tags: [core]
    targets: [github]
    dependencies: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('missing required field: path'))).toBe(
      true
    );
  });

  it('should handle readdir failure gracefully', async () => {
    mockFs.readdir.mockRejectedValue(new Error('permission denied'));

    const result = await validateRegistry('/test/registry', mockServices);

    // Should still succeed - orphan check is skipped
    expect(result.valid).toBe(true);
  });

  it('should fail when meta is missing', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
namespaces: {}
catalog: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('meta'))).toBe(true);
  });

  it('should fail when meta.name is missing', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  description: Test
namespaces: {}
catalog: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('meta missing required field: name'))).toBe(
      true
    );
  });

  it('should fail when namespaces is missing', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
catalog: []
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('namespaces'))).toBe(true);
  });

  it('should fail when catalog is missing', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
namespaces:
  '@core':
    description: Core
    priority: 100
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('catalog'))).toBe(true);
  });

  it('should fail when catalog is not an array', async () => {
    mockFs.readFile.mockResolvedValue(`
version: '1'
meta:
  name: Test
namespaces:
  '@core':
    description: Core
    priority: 100
catalog:
  base: something
`);

    const result = await validateRegistry('/test/registry', mockServices);

    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes('catalog must be an array'))).toBe(true);
  });
});
