import { describe, it, expect } from 'vitest';
import { generateMigrationPrompt, type MigrationPromptInput } from '../migration-prompt.js';

describe('generateMigrationPrompt', () => {
  const candidates: MigrationPromptInput[] = [
    { path: 'CLAUDE.md', sizeHuman: '3.4 KB', toolName: 'Claude Code' },
    { path: '.cursorrules', sizeHuman: '1.8 KB', toolName: 'Cursor' },
  ];

  it('includes all candidate files in the prompt', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('CLAUDE.md');
    expect(prompt).toContain('.cursorrules');
  });

  it('includes file sizes and tool names', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('3.4 KB');
    expect(prompt).toContain('Claude Code');
  });

  it('includes /promptscript skill reference', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('/promptscript');
  });

  it('includes modular .prs structure instructions', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('project.prs');
    expect(prompt).toContain('context.prs');
    expect(prompt).toContain('standards.prs');
    expect(prompt).toContain('restrictions.prs');
  });

  it('includes validation steps', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('prs validate');
    expect(prompt).toContain('prs compile');
  });

  it('handles single candidate', () => {
    const prompt = generateMigrationPrompt([candidates[0]!]);
    expect(prompt).toContain('CLAUDE.md');
    expect(prompt).not.toContain('.cursorrules');
  });
});
