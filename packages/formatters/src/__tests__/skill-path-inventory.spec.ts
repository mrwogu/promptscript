import { describe, it, expect } from 'vitest';
// Import from index to trigger built-in formatter registration
import { FormatterRegistry } from '../index.js';

/**
 * Complete inventory of expected skill paths for all known target formatters.
 * Source of truth: docs/superpowers/specs/2026-03-13-auto-inject-promptscript-skill-design.md
 */
const EXPECTED_SKILL_PATHS: Record<string, { basePath: string | null; fileName: string | null }> = {
  // BaseFormatter subclasses
  claude: { basePath: '.claude/skills', fileName: 'SKILL.md' },
  github: { basePath: '.github/skills', fileName: 'SKILL.md' },
  cursor: { basePath: null, fileName: null },
  antigravity: { basePath: null, fileName: null },
  // MarkdownInstructionFormatter subclasses (hasSkills: false targets return null)
  adal: { basePath: '.adal/skills', fileName: 'SKILL.md' },
  amp: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  augment: { basePath: null, fileName: null },
  cline: { basePath: null, fileName: null },
  codebuddy: { basePath: '.codebuddy/skills', fileName: 'SKILL.md' },
  codex: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  'command-code': { basePath: '.commandcode/skills', fileName: 'SKILL.md' },
  continue: { basePath: null, fileName: null },
  cortex: { basePath: '.cortex/skills', fileName: 'SKILL.md' },
  crush: { basePath: '.crush/skills', fileName: 'SKILL.md' },
  factory: { basePath: '.factory/skills', fileName: 'SKILL.md' },
  gemini: { basePath: '.gemini/skills', fileName: 'skill.md' },
  goose: { basePath: '.goose/skills', fileName: 'SKILL.md' },
  iflow: { basePath: '.iflow/skills', fileName: 'SKILL.md' },
  junie: { basePath: '.junie/skills', fileName: 'SKILL.md' },
  kilo: { basePath: '.kilocode/skills', fileName: 'SKILL.md' },
  kiro: { basePath: '.kiro/skills', fileName: 'SKILL.md' },
  kode: { basePath: '.kode/skills', fileName: 'SKILL.md' },
  mcpjam: { basePath: '.mcpjam/skills', fileName: 'SKILL.md' },
  'mistral-vibe': { basePath: '.vibe/skills', fileName: 'SKILL.md' },
  mux: { basePath: null, fileName: null },
  neovate: { basePath: null, fileName: null },
  openclaw: { basePath: '.openclaw/skills', fileName: 'SKILL.md' },
  opencode: { basePath: '.opencode/skills', fileName: 'SKILL.md' },
  openhands: { basePath: '.openhands/skills', fileName: 'SKILL.md' },
  pi: { basePath: '.pi/skills', fileName: 'SKILL.md' },
  pochi: { basePath: '.pochi/skills', fileName: 'SKILL.md' },
  qoder: { basePath: null, fileName: null },
  'qwen-code': { basePath: '.qwen/skills', fileName: 'SKILL.md' },
  roo: { basePath: null, fileName: null },
  trae: { basePath: '.trae/skills', fileName: 'SKILL.md' },
  windsurf: { basePath: '.windsurf/skills', fileName: 'SKILL.md' },
  zencoder: { basePath: '.zencoder/skills', fileName: 'SKILL.md' },
  // AGENTS.md-only targets (no skill support)
  aider: { basePath: null, fileName: null },
  'amazon-q': { basePath: null, fileName: null },
  warp: { basePath: null, fileName: null },
  zed: { basePath: null, fileName: null },
  jules: { basePath: null, fileName: null },
  devin: { basePath: null, fileName: null },
  grok: { basePath: '.claude/skills', fileName: 'SKILL.md' },
  // Priority B CLI agents (AGENTS.md-only, no skills by default)
  kimi: { basePath: null, fileName: null },
  mimo: { basePath: null, fileName: null },
  'deep-agents': { basePath: null, fileName: null },
  forgecode: { basePath: null, fileName: null },
};

describe('Skill path inventory verification', () => {
  const registeredNames = FormatterRegistry.list();

  it('should have entries for all registered formatters', () => {
    for (const name of registeredNames) {
      expect(EXPECTED_SKILL_PATHS).toHaveProperty(name);
    }
  });

  it('should not have stale entries for unregistered formatters', () => {
    for (const name of Object.keys(EXPECTED_SKILL_PATHS)) {
      expect(registeredNames).toContain(name);
    }
  });

  it.each(
    Object.entries(EXPECTED_SKILL_PATHS).map(([name, paths]) => ({
      name,
      basePath: paths.basePath,
      fileName: paths.fileName,
    }))
  )(
    '$name: getSkillBasePath() = $basePath, getSkillFileName() = $fileName',
    ({ name, basePath, fileName }) => {
      const formatter = FormatterRegistry.get(name);
      expect(formatter).toBeDefined();
      expect(formatter!.getSkillBasePath()).toBe(basePath);
      expect(formatter!.getSkillFileName()).toBe(fileName);
    }
  );
});
