import { describe, expect, it } from 'vitest';
import {
  classifyOutputResource,
  isOutputResourceKind,
  OUTPUT_RESOURCE_KINDS,
  type OutputResourceKind,
} from '../output-resources.js';

/**
 * Assert a batch of classifications from a readable table.
 *
 * Each table line is `<path> => <kind>`; the loop keeps one assertion shape
 * instead of a chain of near-identical expect calls.
 */
function expectKinds(target: string, table: string): void {
  for (const line of table.split('\n')) {
    const entry = line.trim();
    if (!entry) continue;
    const [path, kind] = entry.split(/\s*=>\s*/);
    if (!path || !kind) continue;
    expect(classifyOutputResource(target, path), `${target}: ${path}`).toBe(kind);
  }
}

describe('classifyOutputResource', () => {
  it('classifies Claude outputs', () => {
    expectKinds(
      'claude',
      `
        CLAUDE.md => main
        CLAUDE.local.md => main
        .claude/rules/testing.md => main
        .claude/skills/security/SKILL.md => skills
        .claude/skills/promptscript/SKILL.md => skills
        .claude/agents/reviewer.md => agents
        .claude/commands/deploy.md => commands
        .claude/settings.json => hooks
        .mcp.json => mcp
      `
    );
  });

  it('classifies GitHub outputs including the vscode hook config', () => {
    expectKinds(
      'github',
      `
        .github/copilot-instructions.md => main
        AGENTS.md => main
        .github/agents/reviewer.md => agents
        .github/prompts/deploy.prompt.md => commands
        .github/skills/audit/SKILL.md => skills
        .github/hooks/promptscript.json => hooks
        .github/hooks/promptscript-vscode.json => hooks
        .vscode/mcp.json => mcp
        .github/instructions/testing.md => main
      `
    );
  });

  it('classifies Factory outputs', () => {
    expectKinds(
      'factory',
      `
        AGENTS.md => main
        .factory/droids/reviewer.md => agents
        .factory/skills/audit/SKILL.md => skills
        .factory/commands/deploy.md => commands
        .factory/rules/standards.md => main
        .factory/mcp.json => mcp
        .factory/plugins.json => plugins
      `
    );
  });

  it('classifies Codex outputs', () => {
    expectKinds(
      'codex',
      `
        AGENTS.md => main
        .codex/agents/reviewer.toml => agents
        .agents/skills/audit/SKILL.md => skills
        .codex/hooks.json => hooks
        .codex/mcp.json => mcp
      `
    );
  });

  it('classifies Grok delegated outputs', () => {
    expectKinds(
      'grok',
      `
        AGENTS.md => main
        CLAUDE.md => main
        .claude/agents/reviewer.md => agents
        .claude/skills/audit/SKILL.md => skills
        .grok/hooks/promptscript.json => hooks
        .grok/plugins.json => plugins
        .claude/commands/deploy.md => commands
      `
    );
  });

  it('falls back to main for unknown owners and uncovered paths', () => {
    expectKinds(
      'cli',
      `
        CLAUDE.md => main
        .claude/workflows/release.md => main
      `
    );
    expectKinds('windsurf', '.windsurf/rules/project.md => main');
  });

  it('exposes a stable selectable kind list', () => {
    expect(OUTPUT_RESOURCE_KINDS).toEqual([
      'agents',
      'skills',
      'commands',
      'mcp',
      'hooks',
      'plugins',
      'main',
    ]);
    expect(isOutputResourceKind('agents')).toBe(true);
    expect(isOutputResourceKind('rules')).toBe(false);
    const kind: OutputResourceKind = 'plugins';
    expect(isOutputResourceKind(kind)).toBe(true);
  });
});
