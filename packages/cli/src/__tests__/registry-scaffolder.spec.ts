import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scaffoldRegistry, type ScaffoldOptions } from '../utils/registry-scaffolder.js';
import { type CliServices } from '../services.js';

describe('utils/registry-scaffolder', () => {
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(''),
      readdir: vi.fn().mockResolvedValue([]),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as CliServices['prompts'],
      cwd: '/test',
    };
  });

  it('should create registry directory structure', async () => {
    const options: ScaffoldOptions = {
      directory: '/test/my-registry',
      name: 'My Registry',
      description: 'Test registry',
      namespaces: ['@core', '@stacks'],
      seed: false,
    };

    const files = await scaffoldRegistry(options, mockServices);

    expect(mockFs.mkdir).toHaveBeenCalledWith('/test/my-registry', { recursive: true });
    expect(mockFs.mkdir).toHaveBeenCalledWith('/test/my-registry/@core', { recursive: true });
    expect(mockFs.mkdir).toHaveBeenCalledWith('/test/my-registry/@stacks', { recursive: true });

    // Manifest, README, .gitignore, and .gitkeep files
    expect(files).toContain('/test/my-registry/registry-manifest.yaml');
    expect(files).toContain('/test/my-registry/README.md');
    expect(files).toContain('/test/my-registry/.gitignore');
  });

  it('should create manifest with correct structure', async () => {
    const options: ScaffoldOptions = {
      directory: '/test/my-registry',
      name: 'Test Registry',
      description: 'A test',
      namespaces: ['@core', '@fragments'],
      seed: false,
    };

    await scaffoldRegistry(options, mockServices);

    const manifestCall = mockFs.writeFile.mock.calls.find((call: unknown[]) =>
      (call[0] as string).endsWith('registry-manifest.yaml')
    );
    expect(manifestCall).toBeDefined();
    const content = manifestCall![1] as string;
    expect(content).toContain("version: '1'");
    expect(content).toContain("name: 'Test Registry'");
    expect(content).toContain("'@core':");
    expect(content).toContain("'@fragments':");
  });

  it('should seed @core with starter configs when seed is true', async () => {
    const options: ScaffoldOptions = {
      directory: '/test/my-registry',
      name: 'Seeded Registry',
      description: 'With seeds',
      namespaces: ['@core', '@stacks'],
      seed: true,
    };

    const files = await scaffoldRegistry(options, mockServices);

    expect(files).toContain('/test/my-registry/@core/base.prs');
    expect(files).toContain('/test/my-registry/@core/quality.prs');
    expect(files).toContain('/test/my-registry/@core/security.prs');

    // @stacks should have .gitkeep (not seeded)
    expect(files).toContain('/test/my-registry/@stacks/.gitkeep');
  });

  it('should not seed when seed is false', async () => {
    const options: ScaffoldOptions = {
      directory: '/test/my-registry',
      name: 'No Seed',
      description: 'Empty',
      namespaces: ['@core'],
      seed: false,
    };

    const files = await scaffoldRegistry(options, mockServices);

    expect(files).not.toContain('/test/my-registry/@core/base.prs');
    expect(files).toContain('/test/my-registry/@core/.gitkeep');
  });

  it('should include catalog entries in manifest when seeded', async () => {
    const options: ScaffoldOptions = {
      directory: '/test/my-registry',
      name: 'Seeded',
      description: 'With catalog',
      namespaces: ['@core'],
      seed: true,
    };

    await scaffoldRegistry(options, mockServices);

    const manifestCall = mockFs.writeFile.mock.calls.find((call: unknown[]) =>
      (call[0] as string).endsWith('registry-manifest.yaml')
    );
    const content = manifestCall![1] as string;
    expect(content).toContain("id: '@core/base'");
    expect(content).toContain("id: '@core/quality'");
    expect(content).toContain("id: '@core/security'");
  });

  it('should generate README with namespace descriptions', async () => {
    const options: ScaffoldOptions = {
      directory: '/test/my-registry',
      name: 'My Registry',
      description: 'Test desc',
      namespaces: ['@core', '@stacks'],
      seed: false,
    };

    await scaffoldRegistry(options, mockServices);

    const readmeCall = mockFs.writeFile.mock.calls.find((call: unknown[]) =>
      (call[0] as string).endsWith('README.md')
    );
    expect(readmeCall).toBeDefined();
    const content = readmeCall![1] as string;
    expect(content).toContain('# My Registry');
    expect(content).toContain('@core');
    expect(content).toContain('@stacks');
  });
});
