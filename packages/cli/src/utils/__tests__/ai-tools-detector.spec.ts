import { describe, it, expect, vi } from 'vitest';
import {
  detectAITools,
  hasMigrationCandidates,
  type AIToolsDetection,
} from '../ai-tools-detector.js';
import type { CliServices } from '../../services.js';

vi.mock('@promptscript/importer', () => ({
  detectFormat: vi.fn().mockReturnValue('claude'),
}));

describe('detectAITools -- enriched migration candidates', () => {
  it('returns MigrationCandidate objects with metadata', async () => {
    const mockServices = {
      fs: {
        existsSync: vi.fn().mockImplementation((p: string) => p === 'CLAUDE.md' || p === '.git'),
        readFile: vi.fn().mockResolvedValue('# My instructions\nYou are a helpful assistant'),
        readdir: vi.fn().mockResolvedValue([]),
        readFileSync: vi.fn().mockReturnValue('# My instructions\nYou are a helpful assistant'),
      },
      prompts: {} as CliServices['prompts'],
      cwd: '/mock',
    } as unknown as CliServices;

    const result = await detectAITools(mockServices);

    const candidate = result.migrationCandidates.find((c) => c.path === 'CLAUDE.md');
    expect(candidate).toBeDefined();
    expect(candidate!.path).toBe('CLAUDE.md');
    expect(candidate!.toolName).toBe('Claude Code');
    expect(typeof candidate!.sizeBytes).toBe('number');
    expect(typeof candidate!.sizeHuman).toBe('string');
  });

  it('deduplicates candidates by real path when file metadata is unavailable', async () => {
    const mockServices = {
      fs: {
        existsSync: vi
          .fn()
          .mockImplementation((p: string) => p === 'CLAUDE.md' || p === 'claude.md'),
        readFile: vi.fn().mockResolvedValue('# My instructions'),
        readdir: vi.fn().mockResolvedValue([]),
        realpath: vi.fn().mockImplementation(async (p: string) => {
          if (p === '/mock') return '/mock';
          return '/mock/CLAUDE.md';
        }),
      },
      prompts: {} as CliServices['prompts'],
      cwd: '/mock',
    } as unknown as CliServices;

    const result = await detectAITools(mockServices);

    expect(result.migrationCandidates).toHaveLength(1);
    expect(result.migrationCandidates[0]?.path).toBe('CLAUDE.md');
  });

  it('hasMigrationCandidates works with enriched type', () => {
    const detection: AIToolsDetection = {
      detected: ['claude'],
      details: { claude: ['CLAUDE.md'] },
      migrationCandidates: [
        {
          path: 'CLAUDE.md',
          format: 'claude',
          sizeBytes: 1024,
          sizeHuman: '1.0 KB',
          toolName: 'Claude Code',
        },
      ],
    };
    expect(hasMigrationCandidates(detection)).toBe(true);
  });

  it('hasMigrationCandidates returns false when empty', () => {
    const detection: AIToolsDetection = {
      detected: [],
      details: {},
      migrationCandidates: [],
    };
    expect(hasMigrationCandidates(detection)).toBe(false);
  });

  it('rejects unreadable instruction candidates', async () => {
    const mockServices = {
      fs: {
        existsSync: vi.fn().mockImplementation((p: string) => p === 'CLAUDE.md'),
        readFile: vi.fn().mockImplementation(async (p: string) => {
          if (p === 'CLAUDE.md') {
            throw new Error('permission denied');
          }
          return '{}';
        }),
        readdir: vi.fn().mockResolvedValue([]),
        readFileSync: vi.fn().mockReturnValue(''),
      },
      prompts: {} as CliServices['prompts'],
      cwd: '/mock',
    } as unknown as CliServices;

    await expect(detectAITools(mockServices)).rejects.toThrow(
      'Cannot read instruction candidate CLAUDE.md'
    );
  });
});
