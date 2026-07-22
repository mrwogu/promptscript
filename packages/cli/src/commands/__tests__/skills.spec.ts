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
  mockMkdtemp,
  mockRm,
  mockValidateRemoteAccess,
  mockValidateSkillFrontmatter,
  mockFormatSkillValidationIssues,
  mockHashContent,
  mockCreateGitRegistry,
  mockCloneAtTag,
  mockCheckoutCommit,
  mockResolveRemoteDependency,
  mockCollectRemoteImports,
  mockConsoleWarn,
  mockConsoleError,
  mockParse,
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
  const mockMkdtemp = vi.fn().mockResolvedValue('/tmp/prs-skill-default');
  const mockRm = vi.fn().mockResolvedValue(undefined);
  const mockValidateRemoteAccess = vi.fn().mockResolvedValue({
    accessible: true,
    headCommit: 'abc1234567890123456789012345678901234567890'.slice(0, 40),
  });
  const mockValidateSkillFrontmatter = vi.fn().mockReturnValue({ valid: true, issues: [] });
  const mockFormatSkillValidationIssues = vi.fn().mockReturnValue('');
  const mockHashContent = vi.fn().mockReturnValue('sha256-deadbeef');
  const mockCloneAtTag = vi.fn().mockResolvedValue(undefined);
  const mockCheckoutCommit = vi.fn().mockResolvedValue(undefined);
  const mockCreateGitRegistry = vi.fn(() => ({
    cloneAtTag: mockCloneAtTag,
    checkoutCommit: mockCheckoutCommit,
  }));
  const mockResolveRemoteDependency = vi.fn(
    (
      _repoUrl: string,
      versions: string[],
      existing?: { integrity?: string }
    ): Promise<{ version: string; commit: string; integrity: string }> =>
      Promise.resolve({
        version: versions[0] ?? 'latest',
        commit: 'abc1234567890123456789012345678901234567',
        integrity: existing?.integrity ?? 'sha256-pending',
      })
  );
  const mockCollectRemoteImports = vi.fn().mockResolvedValue([]);
  const mockConsoleWarn = vi.fn();
  const mockConsoleError = vi.fn();
  const mockParse = vi.fn();
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
    mockValidateSkillFrontmatter,
    mockFormatSkillValidationIssues,
    mockHashContent,
    mockCreateGitRegistry,
    mockCloneAtTag,
    mockCheckoutCommit,
    mockResolveRemoteDependency,
    mockCollectRemoteImports,
    mockConsoleWarn,
    mockConsoleError,
    mockParse,
    mockMkdtemp,
    mockRm,
  };
});

vi.mock('../../output/console.js', () => ({
  createSpinner: vi.fn(() => mockSpinner),
  ConsoleOutput: {
    success: vi.fn(),
    error: mockConsoleError,
    muted: vi.fn(),
    newline: vi.fn(),
    info: vi.fn(),
    dryRun: vi.fn(),
    warn: mockConsoleWarn,
    warning: mockConsoleWarn,
  },
}));

vi.mock('../../config/loader.js', () => ({
  loadConfig: mockLoadConfig,
  findConfigFile: mockFindConfigFile,
}));

vi.mock('../lock.js', () => ({
  LOCKFILE_PATH: 'promptscript.lock',
  resolveRemoteDependency: mockResolveRemoteDependency,
}));

vi.mock('../lock-scanner.js', () => ({
  collectRemoteImports: mockCollectRemoteImports,
}));

vi.mock('fs', () => ({ existsSync: mockExistsSync }));

vi.mock('fs/promises', () => ({
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  readdir: mockReaddir,
  mkdtemp: mockMkdtemp,
  rm: mockRm,
}));

vi.mock('yaml', () => ({
  parse: (s: string) => JSON.parse(s),
  stringify: (o: unknown) => JSON.stringify(o),
}));

vi.mock('@promptscript/resolver', () => ({
  validateRemoteAccess: mockValidateRemoteAccess,
  validateSkillFrontmatter: mockValidateSkillFrontmatter,
  formatSkillValidationIssues: mockFormatSkillValidationIssues,
  hashContent: mockHashContent,
  createGitRegistry: mockCreateGitRegistry,
  normalizeGitUrl: (url: string) => {
    const sshMatch = url.match(/^git@([^:]+):(.+)$/);
    const normalized = sshMatch ? `https://${sshMatch[1]}/${sshMatch[2]}` : url;
    return normalized.endsWith('.git') ? normalized : `${normalized}.git`;
  },
}));

vi.mock('@promptscript/parser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@promptscript/parser')>();
  mockParse.mockImplementation(actual.parse);
  return { ...actual, parse: mockParse };
});

import {
  skillsAddCommand,
  skillsRemoveCommand,
  skillsListCommand,
  skillsUpdateCommand,
  normalizeSkillSource,
} from '../skills.js';

beforeEach(() => {
  mockFindConfigFile.mockReturnValue(null);
  mockCollectRemoteImports.mockResolvedValue([]);
});

describe('normalizeSkillSource', () => {
  it('strips https:// prefix', () => {
    expect(normalizeSkillSource('https://github.com/foo/bar')).toBe('github.com/foo/bar');
  });

  it('strips http:// prefix', () => {
    expect(normalizeSkillSource('http://github.com/foo/bar')).toBe('github.com/foo/bar');
  });

  it('rewrites SSH form to canonical host/owner/repo', () => {
    expect(normalizeSkillSource('git@github.com:foo/bar.git')).toBe('github.com/foo/bar');
  });

  it('strips trailing .git suffix', () => {
    expect(normalizeSkillSource('https://github.com/foo/bar.git')).toBe('github.com/foo/bar');
  });

  it('strips .git before a version suffix', () => {
    expect(normalizeSkillSource('git@github.com:foo/bar.git@v1.0.0')).toBe(
      'github.com/foo/bar@v1.0.0'
    );
  });

  it('preserves sub-path after .git', () => {
    expect(normalizeSkillSource('https://github.com/foo/bar.git/skills/seo')).toBe(
      'github.com/foo/bar/skills/seo'
    );
  });

  it('strips trailing slashes', () => {
    expect(normalizeSkillSource('github.com/foo/bar/')).toBe('github.com/foo/bar');
  });

  it('returns empty string unchanged', () => {
    expect(normalizeSkillSource('   ')).toBe('');
  });
});

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

  it('should preserve an invalid lockfile and fail', async () => {
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

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should preserve an unreadable lockfile and fail', async () => {
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

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
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

  it('should ignore braces inside triple-quoted metadata', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue(
      [
        '@meta {',
        '  description: """',
        '  { this brace is text',
        '  """',
        '}',
        '@identity { role: "dev" }',
      ].join('\n')
    );

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    const prsWriteCall = mockWriteFile.mock.calls.find((call) =>
      String(call[0]).includes('entry.prs')
    )!;
    expect(String(prsWriteCall[1]).split('\n')[5]).toBe('@use github.com/org/repo/SKILL.md');
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

  it('should accept https:// URLs by normalizing them', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('https://github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const prsWriteCall = writeCalls.find(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('entry.prs')
    );
    const writtenContent = prsWriteCall![1] as string;
    // The directive uses the normalized form (no scheme)
    expect(writtenContent).toContain('@use github.com/org/repo/SKILL.md');
    expect(writtenContent).not.toContain('https://');
  });

  it('should reject GitHub URLs that include tree/<ref>', async () => {
    await skillsAddCommand(
      'https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit',
      {}
    );

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Drop the "tree/main" segment'));
    expect(mockFail).toHaveBeenCalledWith(
      expect.stringContaining('github.com/coreyhaines31/marketingskills/skills/seo-audit')
    );
    expect(process.exitCode).toBe(1);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should reject GitHub URLs that include blob/<ref>', async () => {
    await skillsAddCommand('github.com/foo/bar/blob/main/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Drop the "blob/main" segment'));
    expect(process.exitCode).toBe(1);
  });

  it('should accept SSH-style git URLs by normalizing them', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('git@github.com:org/repo.git/skills/foo', {
      file: 'entry.prs',
    });

    expect(mockSucceed).toHaveBeenCalledWith('Skill added');

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const lockWriteCall = writeCalls.find((call) => call[0] === 'promptscript.lock');
    const lockContent = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, { gitUrl?: string }>;
    };
    expect(Object.keys(lockContent.dependencies)).toContain('github.com/org/repo/skills/foo');
    expect(lockContent.dependencies['https://github.com/org/repo']?.gitUrl).toBe(
      'git@github.com:org/repo.git'
    );
    expect(mockResolveRemoteDependency).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      ['latest'],
      undefined,
      false,
      'git@github.com:org/repo.git'
    );
    expect(mockCreateGitRegistry).toHaveBeenCalledWith({
      url: 'git@github.com:org/repo.git',
    });
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

  it('should reject traversal segments in remote paths', async () => {
    await skillsAddCommand('github.com/org/repo/skills/../../secret/SKILL.md', {});

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Path traversal'));
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should reject an empty version suffix', async () => {
    mockExistsSync.mockImplementation((p: string) => p.includes('entry.prs'));
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/org/repo/SKILL.md@', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(mockWriteFile).not.toHaveBeenCalled();
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

  it('should not insert after nested use-like content', async () => {
    mockExistsSync.mockImplementation((p: string) => p.includes('entry.prs'));
    mockReadFile.mockResolvedValue(
      [
        '@meta {',
        '  id: "test"',
        '}',
        '',
        '@skills {',
        '  nested: {',
        '    content: """',
        '    @use github.com/example/nested',
        '    """',
        '  }',
        '}',
      ].join('\n')
    );

    await skillsAddCommand('github.com/new/skill/SKILL.md', {
      file: 'entry.prs',
    });

    const prsWriteCall = mockWriteFile.mock.calls.find((call) =>
      String(call[0]).includes('entry.prs')
    )!;
    const written = String(prsWriteCall[1]);
    expect(written.indexOf('@use github.com/new/skill/SKILL.md')).toBeLessThan(
      written.indexOf('@skills {')
    );
  });

  it('should insert after a meta block with nested objects', async () => {
    mockExistsSync.mockImplementation((p: string) => p.includes('entry.prs'));
    mockReadFile.mockResolvedValue(
      [
        '@meta {',
        '  id: "test"',
        '  template: "}"',
        '  note: "value" # }',
        '  params: {',
        '    mode: "strict"',
        '  }',
        '}',
        '',
        '@identity {',
        '  """Test."""',
        '}',
      ].join('\n')
    );

    await skillsAddCommand('github.com/new/skill/SKILL.md', {
      file: 'entry.prs',
    });

    const prsWriteCall = mockWriteFile.mock.calls.find((call) =>
      String(call[0]).includes('entry.prs')
    )!;
    const lines = String(prsWriteCall[1]).split('\n');
    expect(lines.indexOf('@use github.com/new/skill/SKILL.md')).toBe(8);
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
    mockResolveRemoteDependency.mockRejectedValueOnce(
      new Error('Could not resolve host: github.com')
    );

    // Act
    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    // Assert
    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(mockConsoleError).toHaveBeenCalledWith('Could not resolve host: github.com');
    expect(process.exitCode).toBe(1);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should resolve the requested version instead of the default branch', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);

    await skillsAddCommand('github.com/org/repo/SKILL.md@v1.2.3', {
      file: 'entry.prs',
    });

    expect(mockResolveRemoteDependency).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      ['v1.2.3'],
      undefined,
      false
    );
  });

  it('should include unrelated repo imports in version resolution', async () => {
    mockExistsSync.mockImplementation((p: string) => p.includes('entry.prs'));
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockCollectRemoteImports.mockResolvedValueOnce([
      {
        repoUrl: 'github.com/org/repo.git',
        path: 'standards/base',
        version: 'v2.0.0',
      },
    ]);

    await skillsAddCommand('github.com/org/repo/skills/foo@v2.0.0', {
      file: 'entry.prs',
    });

    expect(mockResolveRemoteDependency).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      ['v2.0.0', 'v2.0.0'],
      undefined,
      false
    );
  });

  it('should migrate a canonical-equivalent repository owner pin', async () => {
    const aliasedOwner = {
      version: 'v1.0.0',
      commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      integrity: 'sha256-old',
      source: 'md',
      skills: [],
    };
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('entry.prs') || p === 'promptscript.lock'
    );
    mockReadFile.mockImplementation(async (p: string) =>
      p === 'promptscript.lock'
        ? JSON.stringify({
            version: 1,
            dependencies: {
              'https://github.com/org/repo.git': aliasedOwner,
            },
          })
        : SAMPLE_PRS
    );

    await skillsAddCommand('github.com/org/repo/skills/foo@v1.0.0', {
      file: 'entry.prs',
    });

    expect(mockResolveRemoteDependency).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      ['v1.0.0'],
      aliasedOwner,
      false
    );
    const lockWriteCall = mockWriteFile.mock.calls.find((call) => call[0] === 'promptscript.lock')!;
    const writtenLock = JSON.parse(lockWriteCall[1] as string) as {
      dependencies: Record<string, unknown>;
    };
    expect(writtenLock.dependencies['https://github.com/org/repo.git']).toBeUndefined();
    expect(writtenLock.dependencies['https://github.com/org/repo']).toBeDefined();
  });

  it('should reuse a canonical-equivalent regular repository pin', async () => {
    const regularPin = {
      version: 'v1.0.0',
      commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      integrity: 'sha256-old',
    };
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('entry.prs') || p === 'promptscript.lock'
    );
    mockReadFile.mockImplementation(async (p: string) =>
      p === 'promptscript.lock'
        ? JSON.stringify({
            version: 1,
            dependencies: {
              'https://github.com/org/repo.git': regularPin,
            },
          })
        : SAMPLE_PRS
    );

    await skillsAddCommand('github.com/org/repo/skills/foo@v1.0.0', {
      file: 'entry.prs',
    });

    expect(mockResolveRemoteDependency).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      ['v1.0.0'],
      regularPin,
      false
    );
    const lockWriteCall = mockWriteFile.mock.calls.find((call) => call[0] === 'promptscript.lock')!;
    const writtenLock = JSON.parse(lockWriteCall[1] as string) as {
      dependencies: Record<string, unknown>;
    };
    expect(writtenLock.dependencies['https://github.com/org/repo.git']).toEqual(regularPin);
    expect(writtenLock.dependencies['https://github.com/org/repo']).toBeDefined();
  });

  it('should scan configured and build-profile entries with --file', async () => {
    mockExistsSync.mockImplementation((p: string) => p.includes('entry.prs'));
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      builds: {
        team: { entry: 'team.prs' },
      },
    });

    await skillsAddCommand('github.com/org/repo/skills/foo', {
      file: 'entry.prs',
    });

    const scannedEntries = mockCollectRemoteImports.mock.calls.map((call) => String(call[0]));
    expect(scannedEntries).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/entry\.prs$/),
        expect.stringMatching(/team\.prs$/),
      ])
    );
    expect(scannedEntries.some((entry) => entry.endsWith('.promptscript/project.prs'))).toBe(false);
  });

  it('should scan an existing implicit entry alongside build profiles', async () => {
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('entry.prs') || p.endsWith('.promptscript/project.prs')
    );
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      builds: {
        team: { entry: 'team.prs' },
      },
    });

    await skillsAddCommand('github.com/org/repo/skills/foo', {
      file: 'entry.prs',
    });

    const scannedEntries = mockCollectRemoteImports.mock.calls.map((call) => String(call[0]));
    expect(scannedEntries).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/team\.prs$/),
        expect.stringMatching(/\.promptscript\/project\.prs$/),
      ])
    );
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
    mockResolveRemoteDependency.mockResolvedValueOnce({
      version: 'latest',
      commit: realCommit,
      integrity: 'sha256-pending',
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
      dependencies: Record<string, { commit: string; skills?: string[]; source?: string }>;
    };
    expect(lockContent.dependencies['github.com/org/repo/SKILL.md']?.commit).toBe(realCommit);
    expect(lockContent.dependencies['github.com/org/repo/SKILL.md']?.skills).toBeUndefined();
    expect(lockContent.dependencies['https://github.com/org/repo']?.commit).toBe(realCommit);
    expect(lockContent.dependencies['https://github.com/org/repo']?.skills).toEqual([
      'github.com/org/repo/SKILL.md',
    ]);
    expect(lockContent.dependencies['https://github.com/org/repo']?.source).toBe('md');
    expect(mockValidateSkillFrontmatter).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        filePath: expect.stringMatching(/repo\/SKILL\.md$/),
      })
    );
  });

  it('should reject a remote without a resolvable commit', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return true;
      if (p === 'promptscript.lock') return false;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS);
    mockResolveRemoteDependency.mockRejectedValueOnce(
      new Error('Could not resolve a commit for https://github.com/org/repo')
    );

    await skillsAddCommand('github.com/org/repo/SKILL.md', {
      file: 'entry.prs',
    });

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(mockWriteFile).not.toHaveBeenCalled();
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
        'https://github.com/org/repo': {
          version: 'latest',
          commit: '0000000000000000000000000000000000000000',
          integrity: 'sha256-pending',
          skills: ['github.com/org/repo/SKILL.md'],
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
    const lockWriteCall = writeCalls.find((call) => call[0] === 'promptscript.lock');
    const writtenLock = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, unknown>;
    };
    expect(writtenLock.dependencies).not.toHaveProperty('https://github.com/org/repo');
  });

  it('should preserve a repo pin used by another remote import', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    const source = 'github.com/org/repo/skills/foo@v1.0.0';
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        [source]: {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-foo',
          source: 'md',
        },
        'https://github.com/org/repo': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-pending',
          gitUrl: 'git@github.com:org/repo.git',
          skills: [source],
        },
      },
    });
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('project.prs') || p === 'promptscript.lock'
    );
    mockReadFile
      .mockResolvedValueOnce(`@use ${source}\n@use github.com/org/repo/standards/base@v1.0.0\n`)
      .mockResolvedValueOnce(lockContent);
    mockCollectRemoteImports.mockResolvedValueOnce([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/foo',
        version: 'v1.0.0',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'standards/base',
        version: 'v1.0.0',
      },
    ]);

    await skillsRemoveCommand('skills/foo', {});

    const lockWriteCall = mockWriteFile.mock.calls.find((call) => call[0] === 'promptscript.lock')!;
    const writtenLock = JSON.parse(lockWriteCall[1] as string) as {
      dependencies: Record<string, { gitUrl?: string; skills?: string[]; source?: string }>;
    };
    expect(writtenLock.dependencies['https://github.com/org/repo']).toBeDefined();
    expect(writtenLock.dependencies['https://github.com/org/repo']?.skills).toBeUndefined();
    expect(writtenLock.dependencies['https://github.com/org/repo']?.source).toBeUndefined();
    expect(writtenLock.dependencies['https://github.com/org/repo']?.gitUrl).toBe(
      'git@github.com:org/repo.git'
    );
  });

  it('should preserve lock entries for the same import in another file', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    const source = 'github.com/org/repo/skills/foo@v1.0.0';
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        [source]: {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-foo',
          source: 'md',
        },
        'https://github.com/org/repo': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-pending',
          skills: [source],
        },
      },
    });
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('project.prs') || p === 'promptscript.lock'
    );
    mockReadFile.mockResolvedValueOnce(`@use ${source}\n`).mockResolvedValueOnce(lockContent);
    mockCollectRemoteImports.mockResolvedValueOnce([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/foo',
        version: 'v1.0.0',
        sourceFile: '/project/project.prs',
        sourceLine: 1,
        rawSource: source,
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/foo',
        version: 'v1.0.0',
        sourceFile: '/project/shared.prs',
        sourceLine: 1,
        rawSource: source,
      },
    ]);

    await skillsRemoveCommand('skills/foo', {});

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile.mock.calls[0]?.[0]).toContain('project.prs');
  });

  it('should remove one of multiple identical directives', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    const source = 'github.com/org/repo/skills/foo@v1.0.0';
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('project.prs') || p === 'promptscript.lock'
    );
    mockReadFile.mockResolvedValueOnce(`@use ${source}\n@use ${source}\n`).mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        dependencies: {
          [source]: {
            version: 'v1.0.0',
            commit: 'a'.repeat(40),
            integrity: 'sha256-foo',
            source: 'md',
          },
        },
      })
    );
    mockCollectRemoteImports.mockResolvedValueOnce([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/bar',
        version: 'v1.0.0',
        sourceFile: '/project/project.prs',
        sourceLine: 3,
        rawSource: 'github.com/org/repo/skills/bar@v1.0.0',
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/foo',
        version: 'v1.0.0',
        sourceFile: '/project/project.prs',
        sourceLine: 1,
        rawSource: source,
      },
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/foo',
        version: 'v1.0.0',
        sourceFile: '/project/project.prs',
        sourceLine: 2,
        rawSource: source,
      },
    ]);

    await skillsRemoveCommand(source, {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill removed');
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile.mock.calls[0]?.[1]).toBe(`@use ${source}\n`);
  });

  it('should ignore use-like text inside triple-quoted content', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => p.includes('project.prs'));
    mockReadFile.mockResolvedValue(
      [
        '@meta {',
        '  id: "test"',
        '  syntax: "1.1.0"',
        '}',
        '@identity {',
        '  """',
        '  Example:',
        '  @use github.com/org/repo/skills/foo',
        '  """',
        '}',
      ].join('\n')
    );

    await skillsRemoveCommand('foo', {});

    expect(mockFail).toHaveBeenCalledWith('Skill not found: foo');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('should remove an entire multiline parameterized use declaration', async () => {
    const source = 'github.com/org/repo/skills/foo@v1.0.0';
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('project.prs') || p === 'promptscript.lock'
    );
    mockReadFile
      .mockResolvedValueOnce(
        [
          '@meta { id: "test" syntax: "1.1.0" }',
          `@use ${source}(`,
          '  mode: "strict"',
          ')',
          '@identity { """Test.""" }',
        ].join('\n')
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          version: 1,
          dependencies: {
            [source]: {
              version: 'v1.0.0',
              commit: 'a'.repeat(40),
              integrity: 'sha256-foo',
              source: 'md',
            },
            'https://github.com/org/repo': {
              version: 'v1.0.0',
              commit: 'a'.repeat(40),
              integrity: 'sha256-pending',
              source: 'md',
              skills: [source],
            },
          },
        })
      );
    mockCollectRemoteImports.mockResolvedValueOnce([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'skills/foo',
        version: 'v1.0.0',
        sourceFile: '/project/project.prs',
        sourceLine: 2,
        rawSource: source,
      },
    ]);

    await skillsRemoveCommand('foo', {});

    const prsWriteCall = mockWriteFile.mock.calls.find((call) =>
      String(call[0]).includes('project.prs')
    )!;
    expect(String(prsWriteCall[1])).not.toContain('@use');
    expect(String(prsWriteCall[1])).not.toContain('mode:');
  });

  it('should stop an unterminated parameter scan at the declaration line', async () => {
    const source = 'github.com/org/repo/skills/foo';
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => p.includes('project.prs'));
    mockReadFile.mockResolvedValue(`@use ${source}(\n  // no closing parenthesis`);
    mockParse.mockReturnValueOnce({
      ast: {
        uses: [{ path: { raw: source, loc: { line: 1 } } }],
      },
      errors: [],
    });

    await skillsRemoveCommand('foo', {});

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('project.prs'),
      '  // no closing parenthesis',
      'utf-8'
    );
  });

  it('should reject invalid PromptScript before removal', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => p.includes('project.prs'));
    mockReadFile.mockResolvedValue('@use (');

    await skillsRemoveCommand('foo', {});

    expect(mockFail).toHaveBeenCalledWith('Failed to remove skill');
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Cannot remove a skill from invalid PromptScript')
    );
  });

  it('should ignore imports from a different repository during removal', async () => {
    const source = 'github.com/org/repo/skills/foo';
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => p.includes('project.prs'));
    mockReadFile.mockResolvedValue(`@use ${source}\n`);
    mockCollectRemoteImports.mockResolvedValue([
      {
        repoUrl: 'https://github.com/other/repo',
        path: 'skills/bar',
        version: 'latest',
        sourceFile: '/project/other.prs',
        sourceLine: 1,
      },
    ]);

    await skillsRemoveCommand('foo', {});

    expect(mockSucceed).toHaveBeenCalledWith('Skill removed');
  });

  it('should report a lockfile update during a removal dry run', async () => {
    const source = 'github.com/org/repo/skills/foo';
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation(
      (p: string) => p.includes('project.prs') || p === 'promptscript.lock'
    );
    mockReadFile.mockResolvedValueOnce(`@use ${source}\n`).mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        dependencies: {
          [source]: {
            version: 'latest',
            commit: 'a'.repeat(40),
            integrity: 'sha256-foo',
            source: 'md',
          },
        },
      })
    );

    await skillsRemoveCommand('foo', { dryRun: true });

    expect(mockSucceed).toHaveBeenCalledWith('Dry run — no files modified');
    expect(mockWriteFile).not.toHaveBeenCalled();
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

  it('should reject an ambiguous partial match without writing', async () => {
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockExistsSync.mockImplementation((p: string) => p.includes('project.prs'));
    mockReadFile.mockResolvedValue(
      '@use github.com/a/repo/skills/review\n@use github.com/b/repo/skills/reviewer\n'
    );

    await skillsRemoveCommand('review', {});

    expect(mockFail).toHaveBeenCalledWith('Multiple skills matched: review');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
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
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: 'abc1234567890123456789012345678901234567890'.slice(0, 40),
    });
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
    mockResolveRemoteDependency.mockResolvedValueOnce({
      version: 'v1.0.0',
      commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      integrity: 'sha256-pending',
    });

    await skillsUpdateCommand(undefined, {});

    expect(mockSucceed).toHaveBeenCalledWith('Updated 1 skill(s)');
    expect(mockWriteFile).toHaveBeenCalled();
    const writeCall = mockWriteFile.mock.calls[0]!;
    const written = JSON.parse(writeCall[1] as string);
    const entry = written.dependencies['github.com/org/repo/SKILL.md'];
    expect(entry.commit).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(entry.integrity).toBe('sha256-deadbeef');
    expect(written.dependencies['https://github.com/org/repo'].commit).toBe(
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
    expect(typeof entry.fetchedAt).toBe('string');
  });

  it('should skip md-sourced skills when the remote is unreachable', async () => {
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

    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(lockContent);
    mockResolveRemoteDependency.mockRejectedValueOnce(new Error('remote unreachable'));

    await skillsUpdateCommand(undefined, {});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Skipped github.com/org/repo/SKILL.md')
    );
    expect(process.exitCode).toBe(1);
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

  it('should update lockfile-managed skills without project configuration', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/skills/foo': {
          version: 'latest',
          commit: 'abc123',
          integrity: 'sha256-xyz',
          source: 'md',
        },
      },
    });
    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(lockContent);
    mockFindConfigFile.mockReturnValue(null);

    await skillsUpdateCommand(undefined, {});

    expect(mockResolveRemoteDependency).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalledWith('promptscript.lock', expect.any(String), 'utf-8');
    expect(mockSucceed).toHaveBeenCalledWith('Updated 1 skill(s)');
  });

  it('should update a repository-root skill entry', async () => {
    const key = 'github.com/org/repo';
    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          [key]: {
            version: 'latest',
            commit: 'abc123',
            integrity: 'sha256-xyz',
            source: 'md',
          },
          'github.com/other/repo/skills/foo': {
            version: 'latest',
            commit: 'def456',
            integrity: 'sha256-other',
            source: 'md',
          },
        },
      })
    );

    await skillsUpdateCommand(undefined, {});

    expect(mockReadFile).toHaveBeenCalledWith(expect.stringMatching(/repo\/SKILL\.md$/), 'utf-8');
    expect(mockSucceed).toHaveBeenCalledWith('Updated 2 skill(s)');
  });

  it('should scan a single non-default entry without project configuration', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/skills/foo': {
          version: 'v1.0.0',
          commit: 'a'.repeat(40),
          integrity: 'sha256-foo',
          source: 'md',
        },
      },
    });
    mockExistsSync.mockImplementation(
      (p: string) => p === 'promptscript.lock' || p.endsWith('.promptscript')
    );
    mockReadFile.mockResolvedValue(lockContent);
    mockFindConfigFile.mockReturnValue(null);
    mockReaddir.mockResolvedValue(['custom.prs']);

    await skillsUpdateCommand(undefined, {});

    expect(mockCollectRemoteImports).toHaveBeenCalledWith(
      expect.stringMatching(/\.promptscript\/custom\.prs$/),
      expect.objectContaining({ strict: true })
    );
    expect(mockSucceed).toHaveBeenCalledWith('Updated 1 skill(s)');
  });

  it('should scan an existing default entry without project configuration', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/skills/foo': {
          version: 'latest',
          commit: 'a'.repeat(40),
          integrity: 'sha256-foo',
          source: 'md',
        },
      },
    });
    mockExistsSync.mockImplementation(
      (p: string) => p === 'promptscript.lock' || p.endsWith('.promptscript/project.prs')
    );
    mockReadFile.mockResolvedValue(lockContent);
    mockFindConfigFile.mockReturnValue(null);

    await skillsUpdateCommand(undefined, {});

    expect(mockCollectRemoteImports).toHaveBeenCalledWith(
      expect.stringMatching(/\.promptscript\/project\.prs$/),
      expect.objectContaining({ strict: true })
    );
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

  it('should preserve unrelated import constraints during update', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/skills/foo@v1.0.0': {
          version: 'v1.0.0',
          commit: 'abc123',
          integrity: 'sha256-xyz',
          source: 'md',
        },
      },
    });
    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(lockContent);
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockCollectRemoteImports.mockResolvedValueOnce([
      {
        repoUrl: 'https://github.com/org/repo',
        path: 'standards/base',
        version: 'v1.0.0',
      },
    ]);

    await skillsUpdateCommand(undefined, {});

    expect(mockResolveRemoteDependency).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      ['v1.0.0', 'v1.0.0'],
      undefined,
      true
    );
  });

  it('should reject an ambiguous update name', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/a/repo/skills/review': {
          version: 'latest',
          commit: 'abc123',
          integrity: 'sha256-a',
          source: 'md',
        },
        'github.com/b/repo/skills/reviewer': {
          version: 'latest',
          commit: 'def456',
          integrity: 'sha256-b',
          source: 'md',
        },
      },
    });
    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(lockContent);

    await skillsUpdateCommand('review', {});

    expect(mockFail).toHaveBeenCalledWith('Multiple skills matched: review');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('should skip a skill when remote resolution throws an exception', async () => {
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

    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(lockContent);
    mockResolveRemoteDependency.mockRejectedValueOnce(new Error('network failure'));

    await skillsUpdateCommand(undefined, {});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Skipped github.com/org/repo/SKILL.md')
    );
    expect(process.exitCode).toBe(1);
  });

  it('should report skipped skills and fail a dry-run update', async () => {
    const key = 'github.com/org/repo/SKILL.md';
    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          [key]: {
            version: 'v1.0.0',
            commit: 'abc123',
            integrity: 'sha256-xyz',
            source: 'md',
          },
        },
      })
    );
    mockResolveRemoteDependency.mockRejectedValueOnce(new Error('network failure'));

    await skillsUpdateCommand(undefined, { dryRun: true });

    expect(mockSucceed).toHaveBeenCalledWith('Dry run — lockfile not written');
    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining(`Would skip ${key}`));
    expect(process.exitCode).toBe(1);
  });

  it('should migrate a canonical repository owner during update', async () => {
    const key = 'github.com/org/repo/skills/foo';
    const oldOwner = 'https://github.com/org/repo.git';
    mockExistsSync.mockImplementation((p: string) => p === 'promptscript.lock');
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        version: 1,
        dependencies: {
          [key]: {
            version: 'v1.0.0',
            commit: 'old',
            integrity: 'sha256-old',
            source: 'md',
          },
          [oldOwner]: {
            version: 'v1.0.0',
            commit: 'old',
            integrity: 'sha256-pending',
            source: 'md',
            skills: [key],
          },
        },
      })
    );

    await skillsUpdateCommand(undefined, {});

    const lockWriteCall = mockWriteFile.mock.calls.find((call) => call[0] === 'promptscript.lock')!;
    const lock = JSON.parse(lockWriteCall[1] as string) as {
      dependencies: Record<string, unknown>;
    };
    expect(lock.dependencies[oldOwner]).toBeUndefined();
    expect(lock.dependencies['https://github.com/org/repo']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Frontmatter validation paths added in fix(cli): post-format + validation.
// These exercise extractSubPath / deriveSkillFolderName / collectExistingSkillNames /
// fetchAndValidateRemoteSkill / printValidationIssues plus the new branches in
// skillsAddCommand and skillsUpdateCommand.
// ---------------------------------------------------------------------------

const SAMPLE_PRS_FOR_VALIDATION = `@meta {\n  id: "test"\n  version: "1.0.0"\n}\n\nHello.\n`;

/**
 * Wire mockExistsSync / mockMkdtemp / mockReadFile so the validation path
 * runs end-to-end and "clones" a virtual SKILL.md whose content is `skillContent`.
 */
function arrangeValidation(opts: {
  entryFile?: string;
  lockExists?: boolean;
  lockContent?: string;
  skillContent: string;
  prsContent?: string;
}): void {
  const entry = opts.entryFile ?? 'entry.prs';
  mockMkdtemp.mockReset();
  mockMkdtemp.mockResolvedValue('/tmp/prs-skill-validate-xyz');
  mockExistsSync.mockImplementation((p: string) => {
    if (typeof p !== 'string') return false;
    if (p === 'promptscript.lock') return Boolean(opts.lockExists);
    if (p.includes('prs-skill-validate-xyz')) return !p.endsWith('.prs');
    if (p.includes(entry)) return true;
    return false;
  });
  mockReadFile.mockImplementation((p: string) => {
    if (typeof p !== 'string') return Promise.reject(new Error('bad path'));
    if (p === 'promptscript.lock') {
      return Promise.resolve(opts.lockContent ?? '{"version":1,"dependencies":{}}');
    }
    if (p.includes('prs-skill-validate-xyz')) {
      return Promise.resolve(opts.skillContent);
    }
    if (p.includes(entry)) {
      return Promise.resolve(opts.prsContent ?? SAMPLE_PRS_FOR_VALIDATION);
    }
    return Promise.reject(new Error(`unexpected read: ${p}`));
  });
}

describe('skillsAddCommand frontmatter validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    // Re-prime defaults that vi.clearAllMocks wipes.
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: 'abc1234567890123456789012345678901234567890'.slice(0, 40),
    });
    mockValidateSkillFrontmatter.mockReturnValue({ valid: true, issues: [] });
    mockFormatSkillValidationIssues.mockReturnValue('');
    mockHashContent.mockReturnValue('sha256-deadbeef');
    mockCloneAtTag.mockResolvedValue(undefined);
    mockCheckoutCommit.mockResolvedValue(undefined);
    mockCreateGitRegistry.mockImplementation(() => ({
      cloneAtTag: mockCloneAtTag,
      checkoutCommit: mockCheckoutCommit,
    }));
    mockRm.mockResolvedValue(undefined);
  });

  it('rejects plain http:// sources before any network call', async () => {
    await skillsAddCommand('http://github.com/foo/bar/SKILL.md', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Plain HTTP'));
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('https://'));
    expect(process.exitCode).toBe(1);
    expect(mockMkdtemp).not.toHaveBeenCalled();
    expect(mockValidateRemoteAccess).not.toHaveBeenCalled();
  });

  it('clones, validates and stores the real integrity hash on success', async () => {
    arrangeValidation({ skillContent: '---\nname: x\n---\nbody' });
    mockHashContent.mockReturnValue('sha256-realhash');

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', { file: 'entry.prs' });

    expect(mockCreateGitRegistry).toHaveBeenCalledWith({ url: 'https://github.com/org/repo' });
    expect(mockCloneAtTag).toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const lockWriteCall = writeCalls.find((c) => c[0] === 'promptscript.lock');
    const lock = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, { integrity: string }>;
    };
    expect(lock.dependencies['github.com/org/repo/skills/foo/SKILL.md']!.integrity).toBe(
      'sha256-realhash'
    );
    // tmp dir cleaned up
    expect(mockRm).toHaveBeenCalledWith(
      '/tmp/prs-skill-validate-xyz',
      expect.objectContaining({ recursive: true, force: true })
    );
  });

  it('validates root markdown files under the repository folder name', async () => {
    arrangeValidation({ skillContent: '---\nname: repo\n---\nbody' });

    await skillsAddCommand('github.com/org/repo/rules.md', { file: 'entry.prs' });

    expect(mockValidateSkillFrontmatter).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        filePath: expect.stringMatching(/repo\/rules\.md$/),
      })
    );
  });

  it('validates a versioned skill directory at its resolved tag', async () => {
    arrangeValidation({ skillContent: '---\nname: foo\n---\nbody' });
    mockResolveRemoteDependency.mockResolvedValueOnce({
      version: 'v1.2.3',
      commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      integrity: 'sha256-pending',
    });

    await skillsAddCommand('github.com/org/repo/skills/foo@^1.2.0', {
      file: 'entry.prs',
    });

    expect(mockCloneAtTag).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      'v1.2.3',
      '/tmp/prs-skill-validate-xyz'
    );
    expect(mockCheckoutCommit).toHaveBeenCalledWith(
      '/tmp/prs-skill-validate-xyz',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
    expect(mockReadFile).toHaveBeenCalledWith(
      expect.stringContaining('skills/foo/SKILL.md'),
      'utf-8'
    );
  });

  it('rejects a directory path shadowed by PromptScript source', async () => {
    arrangeValidation({ skillContent: '---\nname: foo\n---\nbody' });
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return false;
      if (p.includes('entry.prs')) return true;
      return p.endsWith('skills/foo.prs');
    });

    await skillsAddCommand('github.com/org/repo/skills/foo', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith('SKILL.md failed validation');
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('does not advance a shared repo pin when a sibling fails validation', async () => {
    arrangeValidation({
      skillContent: '---\nname: skill\n---\nbody',
      lockExists: true,
      lockContent: JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/org/repo/skills/foo': {
            version: 'v1.0.0',
            commit: 'old',
            integrity: 'sha256-old',
            source: 'md',
          },
          'https://github.com/org/repo': {
            version: 'v1.0.0',
            commit: 'old',
            integrity: 'sha256-pending',
            skills: ['github.com/org/repo/skills/foo'],
          },
        },
      }),
    });
    mockValidateSkillFrontmatter.mockReturnValueOnce({
      valid: false,
      issues: [{ severity: 'error', code: 'SK001', message: 'broken sibling' }],
    });

    await skillsAddCommand('github.com/org/repo/skills/bar@v1.0.0', {
      file: 'entry.prs',
    });

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockFail).toHaveBeenCalledWith('SKILL.md failed validation');
    expect(process.exitCode).toBe(1);
  });

  it('updates sibling skill pins when adding to a shared repository', async () => {
    const sibling = 'github.com/org/repo/skills/foo';
    arrangeValidation({
      skillContent: '---\nname: skill\n---\nbody',
      lockExists: true,
      lockContent: JSON.stringify({
        version: 1,
        dependencies: {
          [sibling]: {
            version: 'v1.0.0',
            commit: 'old',
            integrity: 'sha256-old',
            source: 'md',
          },
          'https://github.com/org/repo': {
            version: 'v1.0.0',
            commit: 'old',
            integrity: 'sha256-pending',
            source: 'md',
            skills: [sibling],
          },
        },
      }),
    });

    await skillsAddCommand('github.com/org/repo/skills/bar@v1.0.0', {
      file: 'entry.prs',
    });

    const lockWriteCall = mockWriteFile.mock.calls.find((call) => call[0] === 'promptscript.lock')!;
    const lock = JSON.parse(lockWriteCall[1] as string) as {
      dependencies: Record<string, { integrity?: string; skills?: string[] }>;
    };
    expect(lock.dependencies[sibling]?.integrity).toBe('sha256-deadbeef');
    expect(lock.dependencies['https://github.com/org/repo']?.skills).toEqual([
      sibling,
      'github.com/org/repo/skills/bar@v1.0.0',
    ]);
  });

  it('clones the default branch before checking out a commit selector', async () => {
    arrangeValidation({ skillContent: '---\nname: foo\n---\nbody' });
    const commit = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    mockResolveRemoteDependency.mockResolvedValueOnce({
      version: commit,
      commit,
      integrity: 'sha256-pending',
    });

    await skillsAddCommand(`github.com/org/repo/skills/foo@${commit}`, {
      file: 'entry.prs',
    });

    expect(mockCloneAtTag).toHaveBeenCalledWith(
      'https://github.com/org/repo',
      undefined,
      '/tmp/prs-skill-validate-xyz'
    );
    expect(mockCheckoutCommit).toHaveBeenCalledWith('/tmp/prs-skill-validate-xyz', commit);
  });

  it('aborts on validation errors and prints them', async () => {
    arrangeValidation({ skillContent: '---\nbad\n---' });
    mockValidateSkillFrontmatter.mockReturnValue({
      valid: false,
      issues: [{ severity: 'error', code: 'SK001', message: 'name is required' }],
    });
    mockFormatSkillValidationIssues.mockReturnValue('✗ SK001: name is required');

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith('SKILL.md failed validation');
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('SK001'));
    expect(process.exitCode).toBe(1);
    // No write to entry.prs nor lockfile.
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    expect(writeCalls.find((c) => c[0] === 'promptscript.lock')).toBeUndefined();
  });

  it('surfaces warnings non-strict but still installs', async () => {
    arrangeValidation({ skillContent: '---\nname: x\n---' });
    mockValidateSkillFrontmatter.mockReturnValue({
      valid: true,
      issues: [{ severity: 'warning', code: 'SK050', message: 'description short' }],
    });
    mockFormatSkillValidationIssues.mockReturnValue('⚠ SK050: description short');

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', { file: 'entry.prs' });

    expect(mockWarn).toHaveBeenCalledWith('SKILL.md has validation warnings');
    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
    expect(process.exitCode).not.toBe(1);
  });

  it('treats warnings as errors when --strict is set', async () => {
    arrangeValidation({ skillContent: '---\nname: x\n---' });
    mockValidateSkillFrontmatter.mockReturnValue({
      valid: true,
      issues: [{ severity: 'warning', code: 'SK050', message: 'description short' }],
    });
    mockFormatSkillValidationIssues.mockReturnValue('⚠ SK050: description short');

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', {
      file: 'entry.prs',
      strict: true,
    });

    expect(mockFail).toHaveBeenCalledWith('SKILL.md failed validation');
    expect(process.exitCode).toBe(1);
  });

  it('errors out when the SKILL.md file is missing from the clone', async () => {
    mockMkdtemp.mockReset();
    mockMkdtemp.mockResolvedValue('/tmp/prs-skill-validate-xyz');
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return false;
      if (p.includes('prs-skill-validate-xyz')) return false; // file NOT in clone
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return Promise.resolve(SAMPLE_PRS_FOR_VALIDATION);
      return Promise.reject(new Error('bad'));
    });
    mockFormatSkillValidationIssues.mockReturnValue('✗ SK000: File does not exist');

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith('SKILL.md failed validation');
    expect(process.exitCode).toBe(1);
  });

  it('does not write when the validation clone fails', async () => {
    mockMkdtemp.mockReset();
    mockMkdtemp.mockResolvedValue('/tmp/prs-skill-validate-xyz');
    mockCloneAtTag.mockRejectedValueOnce(new Error('git unreachable'));
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return false;
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockImplementation((p: string) => {
      if (p.includes('entry.prs')) return Promise.resolve(SAMPLE_PRS_FOR_VALIDATION);
      return Promise.reject(new Error('bad'));
    });

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith('Failed to add skill');
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Could not fetch SKILL.md')
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('still fetches and hashes when --skip-validation is set', async () => {
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return false;
      if (p.includes('entry.prs')) return true;
      return false;
    });
    mockReadFile.mockResolvedValue(SAMPLE_PRS_FOR_VALIDATION);

    await skillsAddCommand('github.com/org/repo/skills/foo/SKILL.md', {
      file: 'entry.prs',
      skipValidation: true,
    });

    expect(mockMkdtemp).toHaveBeenCalled();
    expect(mockCreateGitRegistry).toHaveBeenCalled();
    expect(mockValidateSkillFrontmatter).not.toHaveBeenCalled();
    expect(mockSucceed).toHaveBeenCalledWith('Skill added');
  });

  it('rejects imports that omit the skill path', async () => {
    await skillsAddCommand('git@github.com:org/repo.git', { file: 'entry.prs' });

    expect(mockFail).toHaveBeenCalledWith(expect.stringContaining('Include the path'));
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('passes existing skill folder names to the validator for collision detection', async () => {
    arrangeValidation({
      skillContent: '---\nname: foo\n---',
      lockExists: true,
      lockContent: JSON.stringify({
        version: 1,
        dependencies: {
          'github.com/a/b/skills/foo/SKILL.md': {
            version: 'v1',
            commit: 'a',
            integrity: 'sha256-x',
            source: 'md',
          },
          'github.com/c/d': {
            version: 'v1',
            commit: 'b',
            integrity: 'sha256-y',
          },
        },
      }),
    });

    await skillsAddCommand('github.com/org/repo/skills/bar/SKILL.md', { file: 'entry.prs' });

    expect(mockValidateSkillFrontmatter).toHaveBeenCalledTimes(1);
    const call = mockValidateSkillFrontmatter.mock.calls[0] as unknown as [
      string,
      { existingNames: Set<string> },
    ];
    expect(Array.from(call[1].existingNames)).toEqual(['foo']);
  });
});

describe('skillsUpdateCommand frontmatter re-validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    mockFindConfigFile.mockReturnValue('promptscript.yaml');
    mockLoadConfig.mockResolvedValue({
      targets: [],
      input: { entry: 'project.prs' },
    });
    mockValidateRemoteAccess.mockResolvedValue({
      accessible: true,
      headCommit: 'newcommit1234567890123456789012345678901234567890'.slice(0, 40),
    });
    mockValidateSkillFrontmatter.mockReturnValue({ valid: true, issues: [] });
    mockFormatSkillValidationIssues.mockReturnValue('');
    mockHashContent.mockReturnValue('sha256-newhash');
    mockCloneAtTag.mockResolvedValue(undefined);
    mockCheckoutCommit.mockResolvedValue(undefined);
    mockCreateGitRegistry.mockImplementation(() => ({
      cloneAtTag: mockCloneAtTag,
      checkoutCommit: mockCheckoutCommit,
    }));
    mockRm.mockResolvedValue(undefined);
  });

  const lockEntry = {
    version: 'v1.0.0',
    commit: 'old',
    integrity: 'sha256-old',
    source: 'md' as const,
  };

  function arrangeLock(): void {
    mockMkdtemp.mockReset();
    mockMkdtemp.mockResolvedValue('/tmp/prs-skill-validate-xyz');
    mockExistsSync.mockImplementation((p: string) => {
      if (typeof p !== 'string') return false;
      if (p === 'promptscript.lock') return true;
      if (p.includes('prs-skill-validate-xyz')) return !p.endsWith('.prs');
      return false;
    });
    mockReadFile.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') {
        return Promise.resolve(
          JSON.stringify({
            version: 1,
            dependencies: { 'github.com/org/repo/skills/foo/SKILL.md': lockEntry },
          })
        );
      }
      if (p.includes('prs-skill-validate-xyz')) return Promise.resolve('---\nname: foo\n---');
      return Promise.reject(new Error('bad'));
    });
  }

  it('refreshes the integrity hash when re-validation succeeds', async () => {
    arrangeLock();

    await skillsUpdateCommand(undefined, {});

    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    const lockWriteCall = writeCalls.find((c) => c[0] === 'promptscript.lock');
    const lock = JSON.parse(lockWriteCall![1] as string) as {
      dependencies: Record<string, { integrity: string }>;
    };
    expect(lock.dependencies['github.com/org/repo/skills/foo/SKILL.md']!.integrity).toBe(
      'sha256-newhash'
    );
  });

  it('skips an entry when re-validation reports errors', async () => {
    arrangeLock();
    mockValidateSkillFrontmatter.mockReturnValue({
      valid: false,
      issues: [{ severity: 'error', code: 'SK001', message: 'broken' }],
    });
    mockFormatSkillValidationIssues.mockReturnValue('✗ SK001: broken');

    await skillsUpdateCommand(undefined, {});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('SKILL.md failed validation after update')
    );
  });

  it('updates shared-repository skills atomically', async () => {
    const lockContent = JSON.stringify({
      version: 1,
      dependencies: {
        'github.com/org/repo/skills/foo': {
          ...lockEntry,
          integrity: 'sha256-foo',
        },
        'github.com/org/repo/skills/bar': {
          ...lockEntry,
          integrity: 'sha256-bar',
        },
        'https://github.com/org/repo': {
          version: 'v1.0.0',
          commit: 'old',
          integrity: 'sha256-pending',
          skills: ['github.com/org/repo/skills/foo', 'github.com/org/repo/skills/bar'],
        },
      },
    });
    mockMkdtemp.mockResolvedValue('/tmp/prs-skill-validate-xyz');
    mockExistsSync.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return true;
      return p.includes('prs-skill-validate-xyz') && !p.endsWith('.prs');
    });
    mockReadFile.mockImplementation((p: string) => {
      if (p === 'promptscript.lock') return Promise.resolve(lockContent);
      return Promise.resolve('---\nname: skill\n---');
    });
    mockValidateSkillFrontmatter
      .mockReturnValueOnce({ valid: true, issues: [] })
      .mockReturnValueOnce({
        valid: false,
        issues: [{ severity: 'error', code: 'SK001', message: 'broken sibling' }],
      });

    await skillsUpdateCommand('skills/foo', {});

    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('github.com/org/repo/skills/bar')
    );
    expect(process.exitCode).toBe(1);
  });

  it('treats warnings as failures under --strict in update', async () => {
    arrangeLock();
    mockValidateSkillFrontmatter.mockReturnValue({
      valid: true,
      issues: [{ severity: 'warning', code: 'SK050', message: 'soft' }],
    });
    mockFormatSkillValidationIssues.mockReturnValue('⚠ SK050: soft');

    await skillsUpdateCommand(undefined, { strict: true });

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('surfaces warnings under update without --strict and still writes', async () => {
    arrangeLock();
    mockValidateSkillFrontmatter.mockReturnValue({
      valid: true,
      issues: [{ severity: 'warning', code: 'SK050', message: 'soft' }],
    });
    mockFormatSkillValidationIssues.mockReturnValue('⚠ SK050: soft');

    await skillsUpdateCommand(undefined, {});

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('github.com/org/repo/skills/foo/SKILL.md: validation warnings')
    );
    const writeCalls = mockWriteFile.mock.calls as unknown[][];
    expect(writeCalls.find((c) => c[0] === 'promptscript.lock')).toBeDefined();
  });

  it('skips an update when the validation clone fails', async () => {
    arrangeLock();
    mockCloneAtTag.mockRejectedValueOnce(new Error('git boom'));

    await skillsUpdateCommand(undefined, {});

    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('git boom'));
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('fetches without frontmatter validation when --skip-validation is set', async () => {
    arrangeLock();

    await skillsUpdateCommand(undefined, { skipValidation: true });

    expect(mockMkdtemp).toHaveBeenCalled();
    expect(mockCreateGitRegistry).toHaveBeenCalled();
    expect(mockValidateSkillFrontmatter).not.toHaveBeenCalled();
  });
});
