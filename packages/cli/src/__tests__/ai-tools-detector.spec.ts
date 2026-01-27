import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectAITools,
  getAllTargets,
  getSuggestedTargets,
  formatDetectionResults,
  type AIToolsDetection,
} from '../utils/ai-tools-detector.js';
import { type CliServices } from '../services.js';

describe('utils/ai-tools-detector', () => {
  let mockServices: CliServices;
  let mockFs: {
    existsSync: any;
    readdir: any;
  };

  beforeEach(() => {
    mockFs = {
      existsSync: vi.fn(),
      readdir: vi.fn().mockResolvedValue([]),
    };

    mockServices = {
      fs: mockFs as any,
      prompts: {} as any,
      cwd: '/test',
    };
  });

  describe('detectAITools', () => {
    it('should detect GitHub Copilot configuration', async () => {
      mockFs.existsSync.mockImplementation(
        (path: string) => path === '.github/copilot-instructions.md'
      );

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('github');
      expect(result.details.github).toContain('.github/copilot-instructions.md');
    });

    it('should detect Claude configuration', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'CLAUDE.md');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('claude');
      expect(result.details.claude).toContain('CLAUDE.md');
    });

    it('should detect Cursor configuration', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.cursor/rules/project.mdc');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('cursor');
      expect(result.details.cursor).toContain('.cursor/rules/project.mdc');
    });

    it('should detect .claude directory with content', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.claude');
      mockFs.readdir.mockResolvedValue(['settings.json']);

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('claude');
      expect(result.details.claude).toContain('.claude/');
    });

    it('should detect multiple AI tools', async () => {
      mockFs.existsSync.mockImplementation(
        (path: string) =>
          path === '.github/copilot-instructions.md' ||
          path === 'CLAUDE.md' ||
          path === '.cursor/rules/project.mdc'
      );

      const result = await detectAITools(mockServices);

      expect(result.detected).toHaveLength(3);
      expect(result.detected).toContain('github');
      expect(result.detected).toContain('claude');
      expect(result.detected).toContain('cursor');
    });

    it('should return empty when no AI tools detected', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdir.mockRejectedValue(new Error('Not found'));

      const result = await detectAITools(mockServices);

      expect(result.detected).toHaveLength(0);
    });
  });

  describe('getAllTargets', () => {
    it('should return all available targets', () => {
      const targets = getAllTargets();

      expect(targets).toEqual(['github', 'claude', 'cursor', 'antigravity']);
    });
  });

  describe('getSuggestedTargets', () => {
    it('should return detected targets when some exist', () => {
      const detection: AIToolsDetection = {
        detected: ['github', 'claude'],
        details: { github: [], claude: [], cursor: [], antigravity: [] },
        migrationCandidates: [],
      };

      const suggested = getSuggestedTargets(detection);

      expect(suggested).toEqual(['github', 'claude']);
    });

    it('should return all targets when none detected', () => {
      const detection: AIToolsDetection = {
        detected: [],
        details: { github: [], claude: [], cursor: [], antigravity: [] },
        migrationCandidates: [],
      };

      const suggested = getSuggestedTargets(detection);

      expect(suggested).toEqual(['github', 'claude', 'cursor', 'antigravity']);
    });
  });

  describe('formatDetectionResults', () => {
    it('should format detected tools', () => {
      const detection: AIToolsDetection = {
        detected: ['github'],
        details: {
          github: ['.github/copilot-instructions.md'],
          claude: [],
          cursor: [],
          antigravity: [],
        },
        migrationCandidates: [],
      };

      const lines = formatDetectionResults(detection);

      expect(lines).toContain('Detected AI tool configurations:');
      expect(lines.some((l) => l.includes('github'))).toBe(true);
    });

    it('should show message when no tools detected', () => {
      const detection: AIToolsDetection = {
        detected: [],
        details: { github: [], claude: [], cursor: [], antigravity: [] },
        migrationCandidates: [],
      };

      const lines = formatDetectionResults(detection);

      expect(lines).toContain('No existing AI tool configurations detected.');
    });

    it('should detect Antigravity configuration', async () => {
      const detection: AIToolsDetection = {
        detected: ['antigravity'],
        details: {
          github: [],
          claude: [],
          cursor: [],
          antigravity: ['.agent/rules/project.md'],
        },
        migrationCandidates: [],
      };

      const lines = formatDetectionResults(detection);

      expect(lines).toContain('Detected AI tool configurations:');
      expect(lines.some((l) => l.includes('antigravity'))).toBe(true);
    });
  });
});
