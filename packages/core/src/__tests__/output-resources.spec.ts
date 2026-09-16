import { describe, expect, it } from 'vitest';
import {
  classifyOutputResource,
  isOutputResourceKind,
  OUTPUT_RESOURCE_KINDS,
} from '../output-resources.js';

describe('classifyOutputResource', () => {
  it('classifies Claude outputs', () => {
    expect(classifyOutputResource('claude', 'CLAUDE.md')).toBe('main');
    expect(classifyOutputResource('claude', 'CLAUDE.local.md')).toBe('main');
    expect(classifyOutputResource('claude', '.claude/rules/testing.md')).toBe('main');
    expect(classifyOutputResource('claude', '.claude/skills/security/SKILL.md')).toBe('skills');
    expect(classifyOutputResource('claude', '.claude/skills/promptscript/SKILL.md')).toBe('skills');
    expect(classifyOutputResource('claude', '.claude/agents/reviewer.md')).toBe('agents');
    expect(classifyOutputResource('claude', '.claude/commands/deploy.md')).toBe('commands');
    expect(classifyOutputResource('claude', '.claude/settings.json')).toBe('hooks');
    expect(classifyOutputResource('claude', '.mcp.json')).toBe('mcp');
  });

  it('classifies GitHub outputs including the vscode hook config', () => {
    expect(classifyOutputResource('github', '.github/copilot-instructions.md')).toBe('main');
    expect(classifyOutputResource('github', 'AGENTS.md')).toBe('main');
    expect(classifyOutputResource('github', '.github/agents/reviewer.md')).toBe('agents');
    expect(classifyOutputResource('github', '.github/prompts/deploy.prompt.md')).toBe('commands');
    expect(classifyOutputResource('github', '.github/skills/audit/SKILL.md')).toBe('skills');
    expect(classifyOutputResource('github', '.github/hooks/promptscript.json')).toBe('hooks');
    expect(classifyOutputResource('github', '.github/hooks/promptscript-vscode.json')).toBe(
      'hooks'
    );
    expect(classifyOutputResource('github', '.vscode/mcp.json')).toBe('mcp');
    expect(classifyOutputResource('github', '.github/instructions/testing.md')).toBe('main');
  });

  it('classifies Factory outputs', () => {
    expect(classifyOutputResource('factory', 'AGENTS.md')).toBe('main');
    expect(classifyOutputResource('factory', '.factory/droids/reviewer.md')).toBe('agents');
    expect(classifyOutputResource('factory', '.factory/skills/audit/SKILL.md')).toBe('skills');
    expect(classifyOutputResource('factory', '.factory/commands/deploy.md')).toBe('commands');
    expect(classifyOutputResource('factory', '.factory/rules/standards.md')).toBe('main');
    expect(classifyOutputResource('factory', '.factory/mcp.json')).toBe('mcp');
    expect(classifyOutputResource('factory', '.factory/plugins.json')).toBe('plugins');
  });

  it('classifies Codex outputs', () => {
    expect(classifyOutputResource('codex', 'AGENTS.md')).toBe('main');
    expect(classifyOutputResource('codex', '.codex/agents/reviewer.toml')).toBe('agents');
    expect(classifyOutputResource('codex', '.agents/skills/audit/SKILL.md')).toBe('skills');
    expect(classifyOutputResource('codex', '.codex/hooks.json')).toBe('hooks');
    expect(classifyOutputResource('codex', '.codex/mcp.json')).toBe('mcp');
  });

  it('classifies Grok delegated outputs', () => {
    expect(classifyOutputResource('grok', 'AGENTS.md')).toBe('main');
    expect(classifyOutputResource('grok', 'CLAUDE.md')).toBe('main');
    expect(classifyOutputResource('grok', '.claude/agents/reviewer.md')).toBe('agents');
    expect(classifyOutputResource('grok', '.claude/skills/audit/SKILL.md')).toBe('skills');
    expect(classifyOutputResource('grok', '.grok/hooks/promptscript.json')).toBe('hooks');
    expect(classifyOutputResource('grok', '.grok/plugins.json')).toBe('plugins');
    expect(classifyOutputResource('grok', '.claude/commands/deploy.md')).toBe('commands');
  });

  it('falls back to main for unknown owners and uncovered paths', () => {
    expect(classifyOutputResource('cli', 'CLAUDE.md')).toBe('main');
    expect(classifyOutputResource('claude', '.claude/workflows/release.md')).toBe('main');
    expect(classifyOutputResource('windsurf', '.windsurf/rules/project.md')).toBe('main');
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
  });
});
