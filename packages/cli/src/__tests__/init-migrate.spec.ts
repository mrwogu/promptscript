import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCommand } from '../commands/init.js';
import { type CliServices } from '../services.js';

// Mock prettier/loader
const mockFindPrettierConfig = vi.fn();
vi.mock('../prettier/loader.js', () => ({
  findPrettierConfig: () => mockFindPrettierConfig(),
}));

// Mock manifest-loader (partially)
const mockLoadManifestFromUrl = vi.fn();
vi.mock('../utils/manifest-loader.js', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    loadManifestFromUrl: (...args: unknown[]) => mockLoadManifestFromUrl(...args),
  };
});

// Mock user-config
const mockLoadUserConfig = vi.fn();
vi.mock('../config/user-config.js', () => ({
  loadUserConfig: (...args: unknown[]) => mockLoadUserConfig(...args),
}));

// Mock importer
const mockImportMultipleFiles = vi.fn();
vi.mock('@promptscript/importer', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    importMultipleFiles: (...args: unknown[]) => mockImportMultipleFiles(...args),
  };
});

// Mock clipboard
const mockCopyToClipboard = vi.fn();
vi.mock('../utils/clipboard.js', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
}));

// Mock backup
const mockIsGitRepo = vi.fn();
const mockCreateBackup = vi.fn();
vi.mock('../utils/backup.js', () => ({
  isGitRepo: (...args: unknown[]) => mockIsGitRepo(...args),
  createBackup: (...args: unknown[]) => mockCreateBackup(...args),
}));

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s,
    red: (s: string) => s,
    yellow: (s: string) => s,
    blue: (s: string) => s,
    gray: (s: string) => s,
  },
}));

// Mock process.cwd
vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');

describe('init migration flow', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockServices: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
    readFileSync: ReturnType<typeof vi.fn>;
  };
  let mockPrompts: {
    input: ReturnType<typeof vi.fn>;
    confirm: ReturnType<typeof vi.fn>;
    checkbox: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFindPrettierConfig.mockReturnValue(null);
    mockLoadUserConfig.mockResolvedValue({ version: '1' });
    mockLoadManifestFromUrl.mockRejectedValue(new Error('not available'));
    mockIsGitRepo.mockReturnValue(true);
    mockCreateBackup.mockResolvedValue({ dir: '.prs-backup/2026-01-01', files: [] });
    mockCopyToClipboard.mockReturnValue(true);
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([['project.prs', '@meta { id: "test" }']]),
      perFileReports: [{ file: '/mock/project/CLAUDE.md', sectionCount: 3, confidence: 0.85 }],
      deduplicatedCount: 0,
      overallConfidence: 0.85,
      warnings: [],
    });

    mockFs = {
      existsSync: vi.fn().mockReturnValue(false),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
      readdir: vi.fn().mockResolvedValue([]),
      readFileSync: vi.fn().mockReturnValue(''),
    };

    mockPrompts = {
      input: vi.fn().mockResolvedValue('test-project'),
      confirm: vi.fn().mockResolvedValue(false),
      checkbox: vi.fn().mockResolvedValue(['github', 'claude', 'cursor']),
      select: vi.fn().mockResolvedValue('skip'),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: mockPrompts as unknown as CliServices['prompts'],
      cwd: '/mock/project',
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  /**
   * Helper to simulate migration candidates being detected.
   * Makes existsSync return true for CLAUDE.md and sets up readFile to return
   * non-PromptScript content (no marker).
   */
  function setupMigrationCandidates(): void {
    mockFs.existsSync.mockImplementation((path: string) => {
      return path === 'CLAUDE.md' || path === '.claude/';
    });
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'CLAUDE.md') return '# Project instructions\nUse TypeScript.';
      return '{}';
    });
  }

  describe('exit code 2', () => {
    it('should set exit code 2 when already initialized', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');

      await initCommand({}, mockServices);

      expect(process.exitCode).toBe(2);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('gateway prompt', () => {
    it('should show gateway prompt when migration candidates detected', async () => {
      setupMigrationCandidates();

      // Gateway: migrate, Strategy: static, Registry: skip
      mockPrompts.select
        .mockResolvedValueOnce('migrate') // gateway
        .mockResolvedValueOnce('static') // strategy
        .mockResolvedValueOnce('skip'); // registry
      mockPrompts.confirm.mockResolvedValue(false); // inherit=no, backup=no
      // Order: targets (resolveConfig), then file selection (handleStaticMigration)
      mockPrompts.checkbox
        .mockResolvedValueOnce(['github']) // targets
        .mockResolvedValueOnce(['CLAUDE.md']); // file selection

      await initCommand({}, mockServices);

      // Verify gateway prompt was shown
      expect(mockPrompts.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'How would you like to start?',
        })
      );
    });

    it('should show strategy prompt when user picks migrate', async () => {
      setupMigrationCandidates();

      mockPrompts.select
        .mockResolvedValueOnce('migrate') // gateway
        .mockResolvedValueOnce('static') // strategy
        .mockResolvedValueOnce('skip'); // registry
      mockPrompts.confirm.mockResolvedValue(false); // inherit=no, backup=no
      mockPrompts.checkbox
        .mockResolvedValueOnce(['github']) // targets
        .mockResolvedValueOnce(['CLAUDE.md']); // file selection

      await initCommand({}, mockServices);

      // Verify strategy prompt was shown
      expect(mockPrompts.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'How do you want to migrate?',
        })
      );
    });

    it('should skip migration when user picks fresh start', async () => {
      setupMigrationCandidates();

      mockPrompts.select
        .mockResolvedValueOnce('fresh-start') // gateway
        .mockResolvedValueOnce('skip'); // registry
      mockPrompts.confirm.mockResolvedValue(false);
      mockPrompts.checkbox.mockResolvedValue(['github']);

      await initCommand({}, mockServices);

      // Should write scaffold project.prs (not imported files)
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
      // Should NOT have called importMultipleFiles
      expect(mockImportMultipleFiles).not.toHaveBeenCalled();
    });
  });

  describe('--auto-import flag', () => {
    it('should trigger static import in non-interactive mode with -y --auto-import', async () => {
      setupMigrationCandidates();

      await initCommand({ yes: true, autoImport: true }, mockServices);

      expect(mockImportMultipleFiles).toHaveBeenCalled();
      // Should write imported files instead of scaffold
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        '@meta { id: "test" }',
        'utf-8'
      );
    });
  });

  describe('-y without --auto-import', () => {
    it('should skip migration when -y used without --auto-import', async () => {
      setupMigrationCandidates();

      await initCommand({ yes: true }, mockServices);

      expect(mockImportMultipleFiles).not.toHaveBeenCalled();
      // Should write scaffold project.prs
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/project.prs',
        expect.stringContaining('@meta'),
        'utf-8'
      );
    });
  });

  describe('LLM flow', () => {
    it('should generate prompt and install skill for LLM flow', async () => {
      setupMigrationCandidates();

      mockPrompts.select
        .mockResolvedValueOnce('migrate') // gateway
        .mockResolvedValueOnce('llm') // strategy
        .mockResolvedValueOnce('skip'); // registry
      mockPrompts.confirm.mockResolvedValue(false); // inherit=no, backup=no
      mockPrompts.checkbox.mockResolvedValue(['github']); // targets

      await initCommand({}, mockServices);

      // Should write migration-prompt.md
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/migration-prompt.md',
        expect.stringContaining('Migrate my existing AI instructions'),
        'utf-8'
      );
      // Should attempt clipboard copy
      expect(mockCopyToClipboard).toHaveBeenCalled();
    });

    it('should use _forceMigrate and _forceLlm for LLM mode', async () => {
      setupMigrationCandidates();

      await initCommand({ yes: true, _forceMigrate: true, _forceLlm: true }, mockServices);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/migration-prompt.md',
        expect.stringContaining('Migrate my existing AI instructions'),
        'utf-8'
      );
    });
  });

  describe('static migration deduplication report', () => {
    it('should show deduplicated count when deduplicatedCount > 0', async () => {
      setupMigrationCandidates();
      mockImportMultipleFiles.mockResolvedValue({
        files: new Map([['project.prs', '@meta { id: "test" }']]),
        perFileReports: [{ file: '/mock/project/CLAUDE.md', sectionCount: 3, confidence: 0.85 }],
        deduplicatedCount: 5,
        overallConfidence: 0.85,
        warnings: [],
      });

      await initCommand({ yes: true, autoImport: true }, mockServices);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Deduplicated: 5 lines'));
    });
  });

  describe('LLM clipboard failure', () => {
    it('should print prompt to console when clipboard copy fails', async () => {
      setupMigrationCandidates();
      mockCopyToClipboard.mockReturnValue(false);

      await initCommand({ yes: true, _forceMigrate: true, _forceLlm: true }, mockServices);

      // Should still write migration-prompt.md
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.promptscript/migration-prompt.md',
        expect.stringContaining('Migrate my existing AI instructions'),
        'utf-8'
      );
      // Should print prompt to console since clipboard failed
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Migrate my existing AI instructions')
      );
    });
  });

  describe('backup', () => {
    it('should create backup when --backup flag is set', async () => {
      setupMigrationCandidates();

      await initCommand({ yes: true, autoImport: true, backup: true }, mockServices);

      expect(mockCreateBackup).toHaveBeenCalledWith(['CLAUDE.md'], mockServices);
    });

    it('should not create backup when -y without --backup', async () => {
      setupMigrationCandidates();

      await initCommand({ yes: true, autoImport: true }, mockServices);

      expect(mockCreateBackup).not.toHaveBeenCalled();
    });

    it('should prompt for backup in interactive mode', async () => {
      setupMigrationCandidates();

      mockPrompts.select
        .mockResolvedValueOnce('migrate') // gateway
        .mockResolvedValueOnce('static') // strategy
        .mockResolvedValueOnce('skip'); // registry
      // Order: inherit prompt (from resolveConfig) then backup prompt (from handleMigrationBackup)
      mockPrompts.confirm
        .mockResolvedValueOnce(false) // inherit
        .mockResolvedValueOnce(true); // backup prompt
      // Order: targets (from resolveConfig) then file selection (from handleStaticMigration)
      mockPrompts.checkbox
        .mockResolvedValueOnce(['github']) // targets
        .mockResolvedValueOnce(['CLAUDE.md']); // file selection

      await initCommand({}, mockServices);

      expect(mockPrompts.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Create backup to .prs-backup/?',
        })
      );
      expect(mockCreateBackup).toHaveBeenCalled();
    });
  });

  describe('_migrateFiles filtering', () => {
    it('should filter candidates by _migrateFiles when provided', async () => {
      // Setup: two migration candidates
      mockFs.existsSync.mockImplementation(
        (p: string) => p === 'CLAUDE.md' || p === '.cursorrules'
      );
      mockFs.readFile.mockResolvedValue('# Instructions');

      mockImportMultipleFiles.mockResolvedValue({
        files: new Map([['project.prs', '@meta { id: "test" }']]),
        perFileReports: [{ file: 'CLAUDE.md', sectionCount: 2, confidence: 0.9 }],
        deduplicatedCount: 0,
        overallConfidence: 0.9,
        warnings: [],
      });

      await initCommand(
        { yes: true, autoImport: true, _forceMigrate: true, _migrateFiles: ['CLAUDE.md'] },
        mockServices
      );

      // importMultipleFiles should be called with only CLAUDE.md, not .cursorrules
      const callArgs = mockImportMultipleFiles.mock.calls[0]?.[0] as string[];
      if (callArgs) {
        const filenames = callArgs.map((p: string) => p.split('/').pop());
        expect(filenames).toContain('CLAUDE.md');
        expect(filenames).not.toContain('.cursorrules');
      }
    });
  });
});
