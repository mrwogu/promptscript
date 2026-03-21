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

  it('sets sizeBytes to 0 when readFile throws during enrichment', async () => {
    let claudeReadCount = 0;
    const mockServices = {
      fs: {
        existsSync: vi.fn().mockImplementation((p: string) => p === 'CLAUDE.md'),
        readFile: vi.fn().mockImplementation(async (p: string) => {
          if (p === 'CLAUDE.md') {
            claudeReadCount++;
            // First call: isPromptScriptGenerated check — return non-PS content
            // Second call: size enrichment — throw
            if (claudeReadCount <= 1) return 'No marker here';
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

    const result = await detectAITools(mockServices);
    const candidate = result.migrationCandidates.find((c) => c.path === 'CLAUDE.md');
    expect(candidate).toBeDefined();
    expect(candidate!.sizeBytes).toBe(0);
    expect(candidate!.sizeHuman).toBe('0 B');
  });
});
