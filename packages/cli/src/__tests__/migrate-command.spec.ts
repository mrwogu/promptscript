import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateCommand } from '../commands/migrate.js';
import type { CliServices } from '../services.js';

const mockInitCommand = vi.fn().mockResolvedValue(undefined);
const mockSelectMigrationStrategy = vi.fn().mockResolvedValue('static');
const mockGetSkillWrites = vi.fn().mockReturnValue([]);
vi.mock('../commands/init.js', () => ({
  initCommand: (...args: unknown[]) => mockInitCommand(...args),
  selectMigrationStrategy: (...args: unknown[]) => mockSelectMigrationStrategy(...args),
  getSkillWrites: (...args: unknown[]) => mockGetSkillWrites(...args),
}));

const mockDetectAITools = vi.fn();
vi.mock('../utils/ai-tools-detector.js', () => ({
  detectAITools: (...args: unknown[]) => mockDetectAITools(...args),
}));

const mockImportMultipleFiles = vi.fn();
vi.mock('@promptscript/importer', () => ({
  importMultipleFiles: (...args: unknown[]) => mockImportMultipleFiles(...args),
}));

const mockCopyToClipboard = vi.fn();
vi.mock('../utils/clipboard.js', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
}));

const mockIsGitRepo = vi.fn();
const mockCreateBackup = vi.fn();
vi.mock('../utils/backup.js', () => ({
  isGitRepo: (...args: unknown[]) => mockIsGitRepo(...args),
  createBackup: (...args: unknown[]) => mockCreateBackup(...args),
}));

vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
  }),
}));

describe('migrateCommand', () => {
  let services: CliServices;
  let mockFs: {
    existsSync: ReturnType<typeof vi.fn>;
    readFile: ReturnType<typeof vi.fn>;
    readFileSync: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    mkdir: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    delete process.env['PROMPTSCRIPT_CONFIG'];
    mockIsGitRepo.mockReturnValue(true);
    mockCopyToClipboard.mockReturnValue(true);
    mockDetectAITools.mockResolvedValue({
      detected: ['claude'],
      details: { claude: ['CLAUDE.md'] },
      migrationCandidates: [
        {
          path: 'CLAUDE.md',
          format: 'claude',
          sizeBytes: 10,
          sizeHuman: '10 B',
          toolName: 'Claude Code',
        },
      ],
    });
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([
        ['project.prs', '@meta { id: "preserved" syntax: "1.4.0" }\n\n@use ./context\n'],
        ['context.prs', '@context { project: "preserved" }\n'],
      ]),
      perFileReports: [{ file: 'CLAUDE.md', sectionCount: 1, confidence: 1 }],
      deduplicatedCount: 0,
      overallConfidence: 1,
      warnings: [],
    });

    mockFs = {
      existsSync: vi.fn((path: string) =>
        ['promptscript.yaml', '.promptscript/project.prs', 'CLAUDE.md'].includes(path)
      ),
      readFile: vi.fn(async (path: string) => {
        if (path === 'promptscript.yaml') {
          return 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - claude\ncustom: keep-me\n';
        }
        if (path === '.promptscript/project.prs') {
          return '@meta { id: "preserved" syntax: "1.4.0" }\n';
        }
        return '# Existing instructions';
      }),
      readFileSync: vi.fn().mockReturnValue(''),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
    };
    services = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {
        input: vi.fn(),
        confirm: vi.fn().mockResolvedValue(false),
        checkbox: vi.fn().mockResolvedValue(['CLAUDE.md']),
        select: vi.fn().mockResolvedValue('static'),
      } as unknown as CliServices['prompts'],
      cwd: '/project',
    };
  });

  afterEach(() => {
    delete process.env['PROMPTSCRIPT_CONFIG'];
    delete process.env['MIGRATION_PROJECT_ID'];
  });

  it('preserves existing config during static migration', async () => {
    await migrateCommand({ static: true }, services);

    expect(mockFs.writeFile).not.toHaveBeenCalledWith(
      'promptscript.yaml',
      expect.anything(),
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/migrated/context.prs',
      expect.any(String),
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/project.prs',
      expect.stringContaining('@use ./migrated/project'),
      'utf-8'
    );
    expect(mockGetSkillWrites).not.toHaveBeenCalled();
  });

  it('creates a stable entry shell when the configured entry is missing', async () => {
    mockFs.existsSync.mockImplementation((path: string) =>
      ['promptscript.yaml', 'CLAUDE.md'].includes(path)
    );

    await migrateCommand({ static: true }, services);

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/migrated/project.prs',
      expect.stringContaining('@use ./context'),
      'utf-8'
    );
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/project.prs',
      expect.stringMatching(
        /^# promptscript-generated: migration[\s\S]*@meta \{[\s\S]*@use \.\/migrated\/project\n$/
      ),
      'utf-8'
    );
  });

  it('changes nothing when no migration candidates exist', async () => {
    mockDetectAITools.mockResolvedValue({
      detected: [],
      details: {},
      migrationCandidates: [],
    });

    await migrateCommand({ static: true }, services);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(mockInitCommand).not.toHaveBeenCalled();
  });

  it('cancels successfully when interactive file selection is empty', async () => {
    vi.mocked(services.prompts.checkbox).mockResolvedValue([]);

    await migrateCommand({}, services);

    expect(process.exitCode).toBeUndefined();
    expect(mockImportMultipleFiles).not.toHaveBeenCalled();
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('backs up interactive static migration updates', async () => {
    vi.mocked(services.prompts.confirm).mockResolvedValue(true);
    mockCreateBackup.mockResolvedValue({
      dir: '.prs-backup/test',
      files: ['.promptscript/project.prs'],
    });

    await migrateCommand({}, services);

    expect(mockImportMultipleFiles).toHaveBeenCalledWith(
      ['/project/CLAUDE.md'],
      expect.any(Object)
    );
    expect(mockCreateBackup).toHaveBeenCalledWith(
      expect.arrayContaining(['.promptscript/project.prs']),
      services
    );
  });

  it('handles interactive prompt cancellation', async () => {
    const error = new Error('cancelled');
    error.name = 'ExitPromptError';
    mockDetectAITools.mockRejectedValueOnce(error);

    await migrateCommand({}, services);

    expect(process.exitCode).toBeUndefined();
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('delegates uninitialized migration to init without hooks', async () => {
    mockFs.existsSync.mockImplementation((path: string) => path === 'CLAUDE.md');

    await migrateCommand({ static: true, targets: ['claude'], force: true }, services);

    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        _forceMigrate: true,
        yes: true,
        targets: ['claude'],
        force: true,
        hooks: false,
      }),
      services
    );
  });

  it('rejects mutually exclusive modes before writing', async () => {
    await migrateCommand({ static: true, llm: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects requested files that were not detected', async () => {
    await migrateCommand({ static: true, files: ['missing.md'] }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('normalizes and deduplicates requested files', async () => {
    await migrateCommand({ static: true, files: ['./CLAUDE.md', 'CLAUDE.md'] }, services);

    expect(mockImportMultipleFiles).toHaveBeenCalledWith(
      ['/project/CLAUDE.md'],
      expect.any(Object)
    );
  });

  it('rejects partial imports before writing', async () => {
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([['project.prs', '@meta { id: "preserved" syntax: "1.4.0" }\n']]),
      perFileReports: [],
      deduplicatedCount: 0,
      overallConfidence: 0,
      warnings: ['Could not import CLAUDE.md: unreadable'],
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects unsafe importer output paths', async () => {
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([
        ['project.prs', '@meta { id: "preserved" syntax: "1.4.0" }\n'],
        ['../outside.prs', '@context { project: "preserved" }\n'],
      ]),
      perFileReports: [{ file: 'CLAUDE.md', sectionCount: 1, confidence: 1 }],
      deduplicatedCount: 0,
      overallConfidence: 1,
      warnings: [],
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects importer output without a project entry', async () => {
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([['context.prs', '@context { project: "preserved" }\n']]),
      perFileReports: [{ file: 'CLAUDE.md', sectionCount: 1, confidence: 1 }],
      deduplicatedCount: 0,
      overallConfidence: 1,
      warnings: [],
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects target overrides for initialized projects', async () => {
    await migrateCommand({ static: true, targets: ['factory'] }, services);

    expect(process.exitCode).toBe(1);
    expect(mockImportMultipleFiles).not.toHaveBeenCalled();
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects malformed existing configuration', async () => {
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'promptscript.yaml') {
        return 'id: preserved\ntargets:\n  - claude\n';
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockImportMultipleFiles).not.toHaveBeenCalled();
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects an entry inside the reserved migration output directory', async () => {
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'promptscript.yaml') {
        return [
          'id: preserved',
          'syntax: "1.4.0"',
          'targets:',
          '  - claude',
          'input:',
          '  entry: .promptscript/migrated/project.prs',
          '',
        ].join('\n');
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects an entry path outside the project', async () => {
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'promptscript.yaml') {
        return [
          'id: preserved',
          'syntax: "1.4.0"',
          'targets:',
          '  - claude',
          'input:',
          '  entry: ../outside.prs',
          '',
        ].join('\n');
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBe(1);
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('recognizes alternate configuration file names', async () => {
    mockFs.existsSync.mockImplementation((path: string) =>
      ['.promptscriptrc.yml', '.promptscript/project.prs', 'CLAUDE.md'].includes(path)
    );
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === '.promptscriptrc.yml') {
        return 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - claude\n';
      }
      if (path === '.promptscript/project.prs') {
        return '@meta { id: "preserved" syntax: "1.4.0" }\n';
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(process.exitCode).toBeUndefined();
    expect(mockFs.writeFile).not.toHaveBeenCalledWith(
      '.promptscriptrc.yml',
      expect.anything(),
      'utf-8'
    );
  });

  it('uses and interpolates PROMPTSCRIPT_CONFIG', async () => {
    process.env['PROMPTSCRIPT_CONFIG'] = '/project/custom.yaml';
    process.env['MIGRATION_PROJECT_ID'] = 'from-env';
    mockFs.existsSync.mockImplementation((path: string) =>
      ['/project/custom.yaml', '.promptscript/project.prs', 'CLAUDE.md'].includes(path)
    );
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === '/project/custom.yaml') {
        return 'id: ${MIGRATION_PROJECT_ID}\nsyntax: "1.4.0"\ntargets:\n  - claude\n';
      }
      if (path === '.promptscript/project.prs') {
        return '@meta { id: "from-env" syntax: "1.4.0" }\n';
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(mockImportMultipleFiles).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ projectName: 'from-env' })
    );
  });

  it('does not mistake a commented use directive for composition', async () => {
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'promptscript.yaml') {
        return 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - claude\n';
      }
      if (path === '.promptscript/project.prs') {
        return '@meta { id: "preserved" syntax: "1.4.0" }\n# @use ./migrated/project\n';
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/project.prs',
      expect.stringContaining('\n@use ./migrated/project\n'),
      'utf-8'
    );
  });

  it('recognizes an indented existing use directive', async () => {
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'promptscript.yaml') {
        return 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - claude\n';
      }
      if (path === '.promptscript/project.prs') {
        return '@meta { id: "preserved" syntax: "1.4.0" }\n  @use ./migrated/project\n';
      }
      return '# Existing instructions';
    });

    await migrateCommand({ static: true }, services);

    expect(mockFs.writeFile).not.toHaveBeenCalledWith(
      '.promptscript/project.prs',
      expect.anything(),
      'utf-8'
    );
  });

  it('supports dry-run without writing', async () => {
    await migrateCommand({ static: true, dryRun: true }, services);

    expect(mockFs.writeFile).not.toHaveBeenCalled();
    expect(mockImportMultipleFiles).toHaveBeenCalled();
  });

  it('does not create backups during dry-run', async () => {
    await migrateCommand({ static: true, dryRun: true, backup: true }, services);

    expect(mockCreateBackup).not.toHaveBeenCalled();
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('writes LLM prompt without changing config', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await migrateCommand({ llm: true }, services);

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/migration-prompt.md',
      expect.stringMatching(
        /^<!-- PromptScript migration prompt - do not edit -->[\s\S]*Migrate my existing AI instructions/
      ),
      'utf-8'
    );
    expect(mockFs.writeFile).not.toHaveBeenCalledWith(
      'promptscript.yaml',
      expect.anything(),
      'utf-8'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Migrate my existing AI instructions')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Do not modify promptscript.yaml')
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('<!-- PromptScript'));
    consoleSpy.mockRestore();
  });

  it('copies an interactive LLM prompt to the clipboard', async () => {
    mockSelectMigrationStrategy.mockResolvedValueOnce('llm');

    await migrateCommand({}, services);

    expect(mockCopyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('Migrate my existing AI instructions')
    );
  });

  it('uses enabled object-form targets for LLM skill writes', async () => {
    mockFs.readFile.mockImplementation(async (path: string) => {
      if (path === 'promptscript.yaml') {
        return [
          'id: preserved',
          'syntax: "1.4.0"',
          'targets:',
          '  - claude:',
          '      enabled: true',
          '  - cursor:',
          '      enabled: false',
          '',
        ].join('\n');
      }
      return '# Existing instructions';
    });

    await migrateCommand({ llm: true }, services);

    expect(mockGetSkillWrites).toHaveBeenCalledWith(['claude']);
  });
});
