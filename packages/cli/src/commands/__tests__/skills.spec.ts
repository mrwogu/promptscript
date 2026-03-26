import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSucceed,
  mockFail,
  mockWarn,
  mockSpinner,
  mockLoadConfig,
  mockFindConfigFile,
  mockExistsSync,
  mockWriteFile,
  mockReadFile,
  mockReaddir,
} = vi.hoisted(() => {
  const mockStart = vi.fn().mockReturnThis();
  const mockSucceed = vi.fn().mockReturnThis();
  const mockFail = vi.fn().mockReturnThis();
  const mockWarn = vi.fn().mockReturnThis();
  const mockSpinner = {
    start: mockStart,
    succeed: mockSucceed,
    fail: mockFail,
    warn: mockWarn,
    text: '',
  };
  const mockLoadConfig = vi.fn();
  const mockFindConfigFile = vi.fn();
  const mockExistsSync = vi.fn().mockReturnValue(false);
  const mockWriteFile = vi.fn().mockResolvedValue(undefined);
  const mockReadFile = vi.fn();
  const mockReaddir = vi.fn();
  return {
    mockSucceed,
    mockFail,
    mockWarn,
    mockSpinner,
    mockLoadConfig,
    mockFindConfigFile,
    mockExistsSync,
    mockWriteFile,
    mockReadFile,
    mockReaddir,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: vi.fn(),
    muted: vi.fn(),
    newline: vi.fn(),
    info: vi.fn(),
    dryRun: vi.fn(),
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  findConfigFile: mockFindConfigFile,
}));

vi.mock('../lock.js', () => ({ LOCKFILE_PATH: 'promptscript.lock' }));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  readdir: mockReaddir,
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
  stringify: (o: unknown) => JSON.stringify(o),
}));

import {
  skillsAddCommand,
  skillsRemoveCommand,
  skillsListCommand,
  skillsUpdateCommand,
} from '../skills.js';

/** Sample .prs file content with @meta block and @use directives. */
const SAMPLE_PRS = `@meta {
  id: "test-project"
  syntax: "1.1.0"
}

@use ./local-module

@identity {
  role: "developer"
}
`;

describe('skillsAddCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should reject local paths starting with ./', async () => {
    await skillsAddCommand('./local.md', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Local paths are not supported'));
    expect(process.exitCode).toBe(1);
  });

  it('should reject local paths starting with ../', async () => {
    await skillsAddCommand('../sibling.md', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Local paths are not supported'));
    expect(process.exitCode).toBe(1);
  });

  it('should reject invalid source strings', async () => {
    await skillsAddCommand('invalid', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Invalid source'));
    expect(process.exitCode).toBe(1);
  });

  it('should add skill to .prs file and update lockfile', async () => {
    // --file flag points to an existing file
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });

    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/company/skills/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');

    // Check the .prs file was written with the new @use line
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('entry.prs')
    );
    expect(prsWriteCall).toBeDefined();
    const writtenContent = prsWriteCall![1] as string;
    expect(writtenContent).toContain('@use github.com/company/skills/SKILL.md');

    // Check the lockfile was written
    const lockWriteCall = writeCalls.find((call) => call[0] === 'promptscript.lock');
    expect(lockWriteCall).toBeDefined();
    const lockContent = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, { source?: string }>;
    };
    expect(lockContent.dependencies['github.com/company/skills/SKILL.md']?.source).toBe('md');
  });

  it('should warn if skill is already imported', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue(
      '@meta {\n  id: "test"\n}\n\n@use github.com/company/skills/SKILL.md\n'
    );

    await skillsAddCommand('github.com/company/skills/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('already imported'));
  });

  it('should not write files in dry-run mode', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/company/skills/SKILL.md', {
      file: 'entry.prs',
      dryRun: true,
    });

    expect(mockSucceed).toHaveBeenCalledWith('Dry run — no files modified');
    // writeFile should only NOT be called (no writes)
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should insert @use after last header directive', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });

    const prsContent = [
      '@meta {',
      '  id: "test"',
      '}',
      '',
      '@use ./local-a',
      '@use ./local-b',
      '',
      '@identity {',
      '  role: "dev"',
      '}',
    ].join('\n');

    mockReadFile.mockResolvedValue(prsContent);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('entry.prs')
    );
    const writtenContent = prsWriteCall![1] as string;
    const lines = writtenContent.split('\n');

    // The new @use should appear after @use ./local-b (index 5)
    // and before the blank line / @identity block
    const newLineIndex = lines.indexOf('@use github.com/org/repo/SKILL.md');
    const localBIndex = lines.indexOf('@use ./local-b');
    expect(newLineIndex).toBeGreaterThan(localBIndex);
    expect(newLineIndex).toBe(localBIndex + 1);
  });

  it('should resolve entry file from config when --file not provided', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'custom/main.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('custom/main.prs') || p.includes('custom\\main.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });

  it('should handle exception during add', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockRejectedValue(new Error('read failure'));

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });
});

describe('skillsRemoveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should remove a skill from .prs file and lockfile', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });

    const prsContent =
      '@meta {\n  id: "test"\n}\n\n@use github.com/org/repo/SKILL.md\n\n@identity {\n  role: "dev"\n}\n';
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/SKILL.md': {
          version: 'latest',
          commit: '0000000000000000000000000000000000000000',
          integrity: 'sha256-pending',
          source: 'md',
        },
      },
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      if (p === 'promptscript.lock') return true;
      return false;
    });

    let readCallCount = 0;
    mockReadFile.mockImplementation(() => {
      readCallCount++;
      // First call reads the .prs file, second reads the lockfile
      if (readCallCount === 1) return Promise.resolve(prsContent);
      return Promise.resolve(lockContent);
    });

    await skillsRemoveCommand('github.com/org/repo/SKILL.md', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill removed');

    // Check that the .prs file was written without the @use line
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('project.prs')
    );
    expect(prsWriteCall).toBeDefined();
    const writtenContent = prsWriteCall![1] as string;
    expect(writtenContent).not.toContain('@use github.com/org/repo/SKILL.md');
  });

  it('should fail when skill not found', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsRemoveCommand('nonexistent-skill', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Skill not found'));
    expect(process.exitCode).toBe(1);
  });

  it('should not write files in dry-run mode', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });

    const prsContent =
      '@meta {\n  id: "test"\n}\n\n@use github.com/org/repo/SKILL.md\n\n@identity {\n  role: "dev"\n}\n';
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue(prsContent);

    await skillsRemoveCommand('github.com/org/repo/SKILL.md', {
      dryRun: true,
    });

    expect(mockSucceed).toHaveBeenCalledWith('Dry run — no files modified');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});

describe('skillsListCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should list all imported skills', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      return false;
    });

    const prsContent = [
      '@meta {',
      '  id: "test"',
      '}',
      '',
      '@use ./local-module',
      '@use github.com/org/repo/SKILL.md',
      '',
      '@identity {',
      '  role: "dev"',
      '}',
    ].join('\n');
    mockReadFile.mockResolvedValue(prsContent);

    await skillsListCommand();

    expect(mockSucceed).toHaveBeenCalledWith('Found 2 skill(s)');
  });

  it('should show message when no skills found', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue('@meta {\n  id: "test"\n}\n');

    await skillsListCommand();

    expect(mockSucceed).toHaveBeenCalledWith('Found 0 skill(s)');
  });
});

describe('skillsUpdateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should update all md-sourced skills', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/SKILL.md': {
          version: 'v1.0.0',
          commit: 'abc123',
          integrity: 'sha256-xyz',
          source: 'md',
        },
        'github.com/other/repo': {
          version: 'v2.0.0',
          commit: 'def456',
          integrity: 'sha256-abc',
        },
      },
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false;
    });
    mockReadFile.mockResolvedValue(lockContent);

    await skillsUpdateCommand(undefined, {});

    expect(mockSucceed).toHaveBeenCalledWith('Updated 1 skill(s)');
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it('should warn when no md-sourced skills in lockfile', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/other/repo': {
          version: 'v2.0.0',
          commit: 'def456',
          integrity: 'sha256-abc',
        },
      },
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false;
    });
    mockReadFile.mockResolvedValue(lockContent);

    await skillsUpdateCommand(undefined, {});

    expect(mockWarn).toHaveBeenCalledWith('No markdown-sourced skills found in lockfile');
  });

  it('should fail when name filter matches nothing', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/SKILL.md': {
          version: 'v1.0.0',
          commit: 'abc123',
          integrity: 'sha256-xyz',
          source: 'md',
        },
      },
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false;
    });
    mockReadFile.mockResolvedValue(lockContent);

    await skillsUpdateCommand('nonexistent', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('No skill matched'));
    expect(process.exitCode).toBe(1);
  });

  it('should not write in dry-run mode', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/SKILL.md': {
          version: 'v1.0.0',
          commit: 'abc123',
          integrity: 'sha256-xyz',
          source: 'md',
        },
      },
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false;
    });
    mockReadFile.mockResolvedValue(lockContent);

    await skillsUpdateCommand(undefined, { dryRun: true });

    expect(mockSucceed).toHaveBeenCalledWith('Dry run — lockfile not written');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
