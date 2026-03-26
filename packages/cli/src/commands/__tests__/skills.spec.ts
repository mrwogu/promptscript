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
  mockValidateRemoteAccess,
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
  const mockValidateRemoteAccess = vi.fn().mockResolvedValue({
    accessible: true,
    headCommit: 'abc1234567890123456789012345678901234567890'.slice(0, 40),
  });
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
    mockValidateRemoteAccess,
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

vi.mock('@promptscript/resolver', () => ({
  validateRemoteAccess: mockValidateRemoteAccess,
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

describe('resolveEntryFile fallback paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should fail when --file points to a nonexistent file', async () => {
    mockExistsSync.mockReturnValue(false);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: '/tmp/nonexistent.prs',
    });

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });

  it('should scan .promptscript/ for a single .prs file when no config entry', async () => {
    mockFindConfigFile.mockReturnValue(null);
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('.promptscript') && !p.includes('.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReaddir.mockResolvedValue(['project.prs']);
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });

  it('should auto-detect project.prs when multiple .prs files exist', async () => {
    mockFindConfigFile.mockReturnValue(null);
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('.promptscript') && !p.includes('.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReaddir.mockResolvedValue(['alpha.prs', 'project.prs', 'beta.prs']);
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });

  it('should throw when multiple .prs files and no project.prs', async () => {
    mockFindConfigFile.mockReturnValue(null);
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('.promptscript') && !p.includes('.prs')) return true;
      return false;
    });
    mockReaddir.mockResolvedValue(['alpha.prs', 'beta.prs']);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });

  it('should throw when no .prs file found at all', async () => {
    mockFindConfigFile.mockReturnValue(null);
    mockExistsSync.mockReturnValue(false);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });

  it('should fall through when config entry path does not exist', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'missing/main.prs' },
    });
    // Config entry path doesn't exist, .promptscript dir also doesn't exist
    mockExistsSync.mockReturnValue(false);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });

  it('should fall through when config loading throws', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('bad config'));
    mockExistsSync.mockReturnValue(false);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });

  it('should scan .promptscript/ when config has no input.entry', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({ targets: [] });
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('.promptscript') && !p.includes('.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReaddir.mockResolvedValue(['single.prs']);
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });

  it('should handle .promptscript/ with no .prs files', async () => {
    mockFindConfigFile.mockReturnValue(null);
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('.promptscript') && !p.includes('.prs')) return true;
      return false;
    });
    mockReaddir.mockResolvedValue(['README.md', 'config.yaml']);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(process.exitCode).toBe(1);
  });
});

describe('loadLockfile edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should start fresh when lockfile has invalid structure', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return true;
      return false;
    });
    // First call reads the .prs file, second reads an invalid lockfile
    let readCallCount = 0;
    mockReadFile.mockImplementation(() => {
      readCallCount++;
      if (readCallCount === 1) return Promise.resolve(SAMPLE_PRS);
      // Return a valid JSON but invalid lockfile structure
      return Promise.resolve(JSON.stringify({ wrong: 'shape' }));
    });

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });

  it('should start fresh when lockfile read throws', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return true;
      return false;
    });
    let readCallCount = 0;
    mockReadFile.mockImplementation(() => {
      readCallCount++;
      if (readCallCount === 1) return Promise.resolve(SAMPLE_PRS);
      return Promise.reject(new Error('lockfile read error'));
    });

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });
});

describe('extractUsePath edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should handle @use with alias in duplicate check', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(
      '@use github.com/org/repo/SKILL.md as myskill\n\n@identity {\n  role: "dev"\n}'
    );

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    // Should detect the existing import even with the alias
    expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('already imported'));
  });
});

describe('findInsertionPoint edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it('should insert at line 0 when file has no header directives', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue('@identity {\n  role: "dev"\n}');

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('entry.prs')
    );
    const writtenContent = prsWriteCall![1] as string;
    const lines = writtenContent.split('\n');
    // Should be inserted at line 0
    expect(lines[0]).toBe('@use github.com/org/repo/SKILL.md');
  });

  it('should handle @meta{ without space', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    const content = '@meta{\n  id: "test"\n}\n\n@identity {\n  role: "dev"\n}';
    mockReadFile.mockResolvedValue(content);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('entry.prs')
    );
    const writtenContent = prsWriteCall![1] as string;
    const lines = writtenContent.split('\n');
    // Should insert after the closing } of meta block (line index 2)
    const useIdx = lines.indexOf('@use github.com/org/repo/SKILL.md');
    expect(useIdx).toBe(3); // after @meta{, id, }, then new line
  });

  it('should handle @inherit directive in header', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    const content = '@inherit ./base\n\n@identity {\n  role: "dev"\n}';
    mockReadFile.mockResolvedValue(content);

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('entry.prs')
    );
    const writtenContent = prsWriteCall![1] as string;
    const lines = writtenContent.split('\n');
    const useIdx = lines.indexOf('@use github.com/org/repo/SKILL.md');
    const inheritIdx = lines.indexOf('@inherit ./base');
    expect(useIdx).toBe(inheritIdx + 1);
  });
});

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

  it('should fail with network error when remote is unreachable', async () => {
    // Arrange
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: false,
      error: 'Could not resolve host: github.com',
    });

    // Act
    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Cannot reach remote repository');
    expect(process.exitCode).toBe(1);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should use fallback error message when validation.error is undefined', async () => {
    // Arrange
    const repoUrl = 'https://github.com/org/repo';
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: false,
      error: undefined,
    });

    // Act
    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Cannot reach remote repository');
    const { ConsoleOutput } = await import('../../output/console.js');
    expect(ConsoleOutput.error).toHaveBeenCalledWith(`Failed to connect to ${repoUrl}`);
    expect(process.exitCode).toBe(1);
  });

  it('should use real commit hash when remote is accessible', async () => {
    // Arrange
    const realCommit = 'deadbeef12345678901234567890123456789012';
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: realCommit,
    });

    // Act
    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    // Assert
    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const lockWriteCall = writeCalls.find((call) => call[0] === 'promptscript.lock');
    expect(lockWriteCall).toBeDefined();
    const lockContent = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, { commit: string }>;
    };
    expect(lockContent.dependencies['github.com/org/repo/SKILL.md']?.commit).toBe(realCommit);
  });

  it('should fall back to zero hash when headCommit is undefined', async () => {
    // Arrange
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: undefined,
    });

    // Act
    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    // Assert
    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const lockWriteCall = writeCalls.find((call) => call[0] === 'promptscript.lock');
    expect(lockWriteCall).toBeDefined();
    const lockContent = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, { commit: string }>;
    };
    expect(lockContent.dependencies['github.com/org/repo/SKILL.md']?.commit).toBe(
      '0000000000000000000000000000000000000000'
    );
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

  it('should handle exception during remove', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config failure'));

    await skillsRemoveCommand('some-skill', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to remove skill');
    expect(process.exitCode).toBe(1);
  });

  it('should handle removal when skill path is not in lockfile', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });

    const prsContent =
      '@meta {\n  id: "test"\n}\n\n@use github.com/org/repo/SKILL.md\n\n@identity {\n  role: "dev"\n}\n';
    // Lockfile exists but has no matching entry
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {},
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      if (p === 'promptscript.lock') return true;
      return false;
    });

    let readCallCount = 0;
    mockReadFile.mockImplementation(() => {
      readCallCount++;
      if (readCallCount === 1) return Promise.resolve(prsContent);
      return Promise.resolve(lockContent);
    });

    await skillsRemoveCommand('github.com/org/repo/SKILL.md', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill removed');
    // Should write the .prs file but NOT the lockfile (since no lock entry matched)
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    // Only the .prs file should be written, not the lockfile
    expect(writeCalls.length).toBe(1);
  });

  it('should match skill by partial name', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });

    const prsContent =
      '@meta {\n  id: "test"\n}\n\n@use github.com/org/repo/SKILL.md\n\n@identity {\n  role: "dev"\n}\n';
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('project.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(prsContent);

    // Should match by partial name 'repo/SKILL'
    await skillsRemoveCommand('repo/SKILL', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill removed');
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

  it('should handle exception during list', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue(new Error('config load failure'));

    await skillsListCommand();

    expect(mockFail).toHaveBeenCalledWith('Failed to list skills');
    expect(process.exitCode).toBe(1);
  });

  it('should handle non-Error exception during list', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockRejectedValue('string error');

    await skillsListCommand();

    expect(mockFail).toHaveBeenCalledWith('Failed to list skills');
    expect(process.exitCode).toBe(1);
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

  it('should handle exception during update', async () => {
    // Make loadLockfile succeed first, then fail on saveLockfile
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
    mockWriteFile.mockRejectedValue(new Error('write failure'));

    await skillsUpdateCommand(undefined, {});

    expect(mockFail).toHaveBeenCalledWith('Failed to update skills');
    expect(process.exitCode).toBe(1);
  });

  it('should handle non-Error exception during update', async () => {
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
    // Simulate a non-Error throw from saveLockfile
    mockWriteFile.mockRejectedValue('string error');

    await skillsUpdateCommand(undefined, {});

    expect(mockFail).toHaveBeenCalledWith('Failed to update skills');
    expect(process.exitCode).toBe(1);
  });

  it('should update a specific skill by name', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/SKILL.md': {
          version: 'v1.0.0',
          commit: 'abc123',
          integrity: 'sha256-xyz',
          source: 'md',
        },
        'github.com/other/repo/SKILL.md': {
          version: 'v2.0.0',
          commit: 'def456',
          integrity: 'sha256-abc',
          source: 'md',
        },
      },
    });

    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return false;
    });
    mockReadFile.mockResolvedValue(lockContent);
    mockWriteFile.mockResolvedValue(undefined);

    await skillsUpdateCommand('other', {});

    expect(mockSucceed).toHaveBeenCalledWith('Updated 1 skill(s)');
    expect(mockWriteFile).toHaveBeenCalled();
  });
});
