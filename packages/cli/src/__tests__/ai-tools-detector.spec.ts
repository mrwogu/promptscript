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
    existsSync: ReturnType<typeof vi.fn>;
    readdir: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockFs = {
      existsSync: vi.fn(),
      readdir: vi.fn().mockResolvedValue([]),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: {} as unknown as CliServices['prompts'],
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
      expect(result.details['github']).toContain('.github/copilot-instructions.md');
    });

    it('should detect Claude configuration', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'CLAUDE.md');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('claude');
      expect(result.details['claude']).toContain('CLAUDE.md');
    });

    it('should detect Cursor configuration', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.cursor/rules/project.mdc');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('cursor');
      expect(result.details['cursor']).toContain('.cursor/rules/project.mdc');
    });

    it('should detect .claude directory with content', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.claude');
      mockFs.readdir.mockResolvedValue(['settings.json']);

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('claude');
      expect(result.details['claude']).toContain('.claude/');
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

    it('should detect Factory AI via AGENTS.md', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === 'AGENTS.md');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('factory');
      expect(result.details['factory']).toContain('AGENTS.md');
    });

    it('should detect Factory AI via .factory directory', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.factory');
      mockFs.readdir.mockResolvedValue(['skills']);

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('factory');
    });

    it('should return empty when no AI tools detected', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdir.mockRejectedValue(new Error('Not found'));

      const result = await detectAITools(mockServices);

      expect(result.detected).toHaveLength(0);
    });

    it('should detect Windsurf configuration', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.windsurfrules');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('windsurf');
      expect(result.details['windsurf']).toContain('.windsurfrules');
    });

    it('should detect Cline configuration', async () => {
      mockFs.existsSync.mockImplementation((path: string) => path === '.clinerules');

      const result = await detectAITools(mockServices);

      expect(result.detected).toContain('cline');
      expect(result.details['cline']).toContain('.clinerules');
    });
  });

  describe('getAllTargets', () => {
    it('should return all registered formatters', () => {
      const targets = getAllTargets();

      // Should include the original 7 plus all additional formatters
      expect(targets).toContain('github');
      expect(targets).toContain('claude');
      expect(targets).toContain('cursor');
      expect(targets).toContain('antigravity');
      expect(targets).toContain('factory');
      expect(targets).toContain('opencode');
      expect(targets).toContain('gemini');
      // Tier 1
      expect(targets).toContain('windsurf');
      expect(targets).toContain('cline');
      expect(targets).toContain('roo');
      expect(targets).toContain('codex');
      expect(targets).toContain('continue');
      // Should have many more than the original 7
      expect(targets.length).toBeGreaterThan(7);
    });
  });

  describe('getSuggestedTargets', () => {
    it('should return detected targets when some exist', () => {
      const detection: AIToolsDetection = {
        detected: ['github', 'claude'],
        details: {},
        migrationCandidates: [],
      };

      const suggested = getSuggestedTargets(detection);

      expect(suggested).toEqual(['github', 'claude']);
    });

    it('should return common defaults when none detected', () => {
      const detection: AIToolsDetection = {
        detected: [],
        details: {},
        migrationCandidates: [],
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
        details: {},
        migrationCandidates: [],
      };

      const lines = formatDetectionResults(detection);

      expect(lines).toContain('No existing AI tool configurations detected.');
    });

    it('should detect Antigravity configuration', async () => {
      const detection: AIToolsDetection = {
        detected: ['antigravity'],
        details: {
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
