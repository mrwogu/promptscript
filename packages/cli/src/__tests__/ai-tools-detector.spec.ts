import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import {
  detectAITools,
  getAllTargets,
  getSuggestedTargets,
  formatDetectionResults,
  type AIToolsDetection,
} from '../utils/ai-tools-detector';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
}));

describe('utils/ai-tools-detector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectAITools', () => {
    it('should detect GitHub Copilot configuration', async () => {
      vi.mocked(existsSync).mockImplementation(
        (path) => path === '.github/copilot-instructions.md'
      );
      vi.mocked(readdir).mockResolvedValue([]);

      const result = await detectAITools();

      expect(result.detected).toContain('github');
      expect(result.details.github).toContain('.github/copilot-instructions.md');
    });

    it('should detect Claude configuration', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === 'CLAUDE.md');
      vi.mocked(readdir).mockResolvedValue([]);

      const result = await detectAITools();

      expect(result.detected).toContain('claude');
      expect(result.details.claude).toContain('CLAUDE.md');
    });

    it('should detect Cursor configuration', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === '.cursorrules');
      vi.mocked(readdir).mockResolvedValue([]);

      const result = await detectAITools();

      expect(result.detected).toContain('cursor');
      expect(result.details.cursor).toContain('.cursorrules');
    });

    it('should detect .claude directory with content', async () => {
      vi.mocked(existsSync).mockImplementation((path) => path === '.claude');
      vi.mocked(readdir).mockResolvedValue(['settings.json'] as never);

      const result = await detectAITools();

      expect(result.detected).toContain('claude');
      expect(result.details.claude).toContain('.claude/');
    });

    it('should detect multiple AI tools', async () => {
      vi.mocked(existsSync).mockImplementation(
        (path) =>
          path === '.github/copilot-instructions.md' ||
          path === 'CLAUDE.md' ||
          path === '.cursorrules'
      );
      vi.mocked(readdir).mockResolvedValue([]);

      const result = await detectAITools();

      expect(result.detected).toHaveLength(3);
      expect(result.detected).toContain('github');
      expect(result.detected).toContain('claude');
      expect(result.detected).toContain('cursor');
    });

    it('should return empty when no AI tools detected', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(readdir).mockRejectedValue(new Error('Not found'));

      const result = await detectAITools();

      expect(result.detected).toHaveLength(0);
    });
  });

  describe('getAllTargets', () => {
    it('should return all available targets', () => {
      const targets = getAllTargets();

      expect(targets).toEqual(['github', 'claude', 'cursor']);
    });
  });

  describe('getSuggestedTargets', () => {
    it('should return detected targets when some exist', () => {
      const detection: AIToolsDetection = {
        detected: ['github', 'claude'],
        details: { github: [], claude: [], cursor: [] },
      };

      const suggested = getSuggestedTargets(detection);

      expect(suggested).toEqual(['github', 'claude']);
    });

    it('should return all targets when none detected', () => {
      const detection: AIToolsDetection = {
        detected: [],
        details: { github: [], claude: [], cursor: [] },
      };

      const suggested = getSuggestedTargets(detection);

      expect(suggested).toEqual(['github', 'claude', 'cursor']);
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
        },
      };

      const lines = formatDetectionResults(detection);

      expect(lines).toContain('Detected AI tool configurations:');
      expect(lines.some((l) => l.includes('github'))).toBe(true);
    });

    it('should show message when no tools detected', () => {
      const detection: AIToolsDetection = {
        detected: [],
        details: { github: [], claude: [], cursor: [] },
      };

      const lines = formatDetectionResults(detection);

      expect(lines).toContain('No existing AI tool configurations detected.');
    });
  });
});
