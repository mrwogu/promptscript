import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { validateSkillFrontmatter, formatSkillValidationIssues } from '../skill-validation.js';

function makeSkill(name: string, description: string, extra = ''): string {
  return [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    extra,
    '---',
    '',
    '# Body',
    'Skill content.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

describe('validateSkillFrontmatter', () => {
  describe('frontmatter presence (SK001)', () => {
    it('errors when frontmatter delimiters are missing', () => {
      const result = validateSkillFrontmatter('# Just a body\n\nNo frontmatter here.');
      expect(result.valid).toBe(false);
      expect(result.issues[0]?.code).toBe('SK001');
    });

    it('errors when only a single delimiter is present', () => {
      const result = validateSkillFrontmatter('---\nname: foo\n# no closing delimiter');
      expect(result.valid).toBe(false);
      expect(result.issues[0]?.code).toBe('SK001');
    });
  });

  describe('name field', () => {
    it('errors when name is missing (SK002)', () => {
      const content = '---\ndescription: A useful description that says when to use it.\n---\nBody';
      const result = validateSkillFrontmatter(content);
      const codes = result.issues.map((i) => i.code);
      expect(codes).toContain('SK002');
      expect(result.valid).toBe(false);
    });

    it('errors when name exceeds 64 chars (SK003)', () => {
      const longName = 'a'.repeat(65);
      const result = validateSkillFrontmatter(
        makeSkill(longName, 'A description that mentions when to use this skill.')
      );
      expect(result.issues.map((i) => i.code)).toContain('SK003');
    });

    it.each([
      ['UPPER', 'uppercase'],
      ['-leading', 'leading hyphen'],
      ['trailing-', 'trailing hyphen'],
      ['double--hyphen', 'consecutive hyphens'],
      ['has_underscore', 'underscore'],
      ['has.dot', 'dot'],
    ])('errors on invalid name "%s" (%s, SK004)', (name) => {
      const result = validateSkillFrontmatter(
        makeSkill(name, 'A description that mentions when to use this skill.')
      );
      expect(result.issues.map((i) => i.code)).toContain('SK004');
    });

    it.each(['skill-name', 'name123', 'a', 'pdf-processing'])('accepts valid name "%s"', (name) => {
      const result = validateSkillFrontmatter(
        makeSkill(name, 'A description that mentions when to use this skill.')
      );
      const nameIssues = result.issues.filter((i) => i.field === 'name');
      expect(nameIssues).toEqual([]);
    });

    it('errors when name does not match parent directory (SK005)', () => {
      const dir = mkdtempSync(join(tmpdir(), 'skill-val-'));
      const skillDir = join(dir, 'wrong-folder');
      mkdirSync(skillDir);
      const filePath = join(skillDir, 'SKILL.md');
      const content = makeSkill(
        'different-name',
        'A description that mentions when to use this skill.'
      );
      writeFileSync(filePath, content);

      const result = validateSkillFrontmatter(content, { filePath });
      const sk005 = result.issues.find((i) => i.code === 'SK005');
      expect(sk005).toBeDefined();
      expect(sk005?.message).toContain('wrong-folder');
      expect(sk005?.message).toContain('different-name');
    });

    it('passes when name matches parent directory', () => {
      const dir = mkdtempSync(join(tmpdir(), 'skill-val-'));
      const skillDir = join(dir, 'my-skill');
      mkdirSync(skillDir);
      const filePath = join(skillDir, 'SKILL.md');
      const content = makeSkill('my-skill', 'A description that mentions when to use this skill.');
      writeFileSync(filePath, content);

      const result = validateSkillFrontmatter(content, { filePath });
      expect(result.issues.find((i) => i.code === 'SK005')).toBeUndefined();
    });

    it('detects name collision with existing skills (SK006)', () => {
      const result = validateSkillFrontmatter(
        makeSkill('duplicate', 'A description that mentions when to use this skill.'),
        { existingNames: new Set(['duplicate', 'other']) }
      );
      expect(result.issues.map((i) => i.code)).toContain('SK006');
      expect(result.valid).toBe(false);
    });
  });

  describe('description field', () => {
    it('errors when description is missing (SK010)', () => {
      const content = '---\nname: my-skill\n---\nBody';
      const result = validateSkillFrontmatter(content);
      expect(result.issues.map((i) => i.code)).toContain('SK010');
    });

    it('errors when description is empty string (SK010)', () => {
      const content = '---\nname: my-skill\ndescription: ""\n---\nBody';
      const result = validateSkillFrontmatter(content);
      expect(result.issues.map((i) => i.code)).toContain('SK010');
    });

    it('errors when description exceeds 1024 chars (SK011)', () => {
      const longDesc = 'a'.repeat(1025);
      const result = validateSkillFrontmatter(makeSkill('my-skill', longDesc));
      expect(result.issues.map((i) => i.code)).toContain('SK011');
    });

    it('warns on very short description (SK012)', () => {
      const result = validateSkillFrontmatter(makeSkill('my-skill', 'Short.'));
      expect(result.issues.map((i) => i.code)).toContain('SK012');
    });

    it('warns when description omits when/use (SK013)', () => {
      const result = validateSkillFrontmatter(
        makeSkill(
          'my-skill',
          'This skill processes PDF files and extracts tables from them in good time.'
        )
      );
      expect(result.issues.map((i) => i.code)).toContain('SK013');
    });

    it('passes when description is long and mentions "when"', () => {
      const result = validateSkillFrontmatter(
        makeSkill(
          'my-skill',
          'Extracts text and tables from PDF files. Use when handling PDFs or documents.'
        )
      );
      const descIssues = result.issues.filter((i) => i.field === 'description');
      expect(descIssues).toEqual([]);
    });
  });

  describe('compatibility field (SK020)', () => {
    it('errors when compatibility exceeds 500 chars', () => {
      const compatibility = 'a'.repeat(501);
      const content = makeSkill(
        'my-skill',
        'Use when you need a thing done well.',
        `compatibility: "${compatibility}"`
      );
      const result = validateSkillFrontmatter(content);
      expect(result.issues.map((i) => i.code)).toContain('SK020');
    });

    it('accepts short compatibility string', () => {
      const content = makeSkill(
        'my-skill',
        'Use when you need a thing done well.',
        'compatibility: Requires Python 3.14+ and uv'
      );
      const result = validateSkillFrontmatter(content);
      expect(result.issues.find((i) => i.code === 'SK020')).toBeUndefined();
    });
  });

  describe('license field (SK030)', () => {
    it('warns when license is absent', () => {
      const result = validateSkillFrontmatter(
        makeSkill('my-skill', 'Use when you need a thing done well.')
      );
      expect(result.issues.map((i) => i.code)).toContain('SK030');
    });

    it('does not warn when license is set', () => {
      const content = makeSkill('my-skill', 'Use when you need a thing done well.', 'license: MIT');
      const result = validateSkillFrontmatter(content);
      expect(result.issues.find((i) => i.code === 'SK030')).toBeUndefined();
    });
  });

  describe('body size (SK040)', () => {
    it('warns when body exceeds 500 lines', () => {
      const body = Array.from({ length: 600 }, (_, i) => `line ${i}`).join('\n');
      const content = `---\nname: my-skill\ndescription: Use when you need a thing done well.\nlicense: MIT\n---\n\n${body}`;
      const result = validateSkillFrontmatter(content);
      expect(result.issues.map((i) => i.code)).toContain('SK040');
    });
  });

  describe('references field', () => {
    it('errors on references that escape the skill directory (SK050)', () => {
      const dir = mkdtempSync(join(tmpdir(), 'skill-val-'));
      const skillDir = join(dir, 'my-skill');
      mkdirSync(skillDir);
      const filePath = join(skillDir, 'SKILL.md');
      const content = [
        '---',
        'name: my-skill',
        'description: Use when you need a thing done well.',
        'license: MIT',
        'references:',
        '  - ../escapes.md',
        '  - /absolute.md',
        '---',
        'Body',
      ].join('\n');
      writeFileSync(filePath, content);

      const result = validateSkillFrontmatter(content, { filePath });
      const sk050 = result.issues.filter((i) => i.code === 'SK050');
      expect(sk050).toHaveLength(2);
    });

    it('errors when referenced file is missing (SK051)', () => {
      const dir = mkdtempSync(join(tmpdir(), 'skill-val-'));
      const skillDir = join(dir, 'my-skill');
      mkdirSync(skillDir);
      const filePath = join(skillDir, 'SKILL.md');
      const content = [
        '---',
        'name: my-skill',
        'description: Use when you need a thing done well.',
        'license: MIT',
        'references:',
        '  - missing.md',
        '---',
        'Body',
      ].join('\n');
      writeFileSync(filePath, content);

      const result = validateSkillFrontmatter(content, { filePath });
      expect(result.issues.map((i) => i.code)).toContain('SK051');
    });

    it('passes when referenced files exist', () => {
      const dir = mkdtempSync(join(tmpdir(), 'skill-val-'));
      const skillDir = join(dir, 'my-skill');
      mkdirSync(skillDir);
      const filePath = join(skillDir, 'SKILL.md');
      writeFileSync(join(skillDir, 'extra.md'), '# extra');
      const content = [
        '---',
        'name: my-skill',
        'description: Use when you need a thing done well.',
        'license: MIT',
        'references:',
        '  - extra.md',
        '---',
        'Body',
      ].join('\n');
      writeFileSync(filePath, content);

      const result = validateSkillFrontmatter(content, { filePath });
      const refIssues = result.issues.filter((i) => i.field === 'references');
      expect(refIssues).toEqual([]);
    });
  });

  describe('allowed-tools (SK060)', () => {
    it('warns on malformed tool entry', () => {
      const content = makeSkill(
        'my-skill',
        'Use when you need a thing done well.',
        'allowed-tools: "Bash(git:*) 123-bad Read"'
      );
      const result = validateSkillFrontmatter(content);
      expect(result.issues.map((i) => i.code)).toContain('SK060');
    });

    it('passes on valid tool entries', () => {
      const content = makeSkill(
        'my-skill',
        'Use when you need a thing done well.',
        'allowed-tools: "Bash(git:*) Read Write"'
      );
      const result = validateSkillFrontmatter(content);
      expect(result.issues.find((i) => i.code === 'SK060')).toBeUndefined();
    });
  });

  describe('overall result', () => {
    it('returns valid=true when only warnings are present', () => {
      const result = validateSkillFrontmatter(
        makeSkill('my-skill', 'Use when you need a thing done well.')
      );
      // SK030 (license warning) is expected but valid stays true
      expect(result.valid).toBe(true);
      expect(result.issues.some((i) => i.severity === 'warning')).toBe(true);
    });

    it('returns valid=false when any error is present', () => {
      const result = validateSkillFrontmatter(
        makeSkill('BAD-NAME', 'Use when you need a thing done well.')
      );
      expect(result.valid).toBe(false);
    });
  });
});

describe('formatSkillValidationIssues', () => {
  it('formats errors and warnings with codes and fields', () => {
    const formatted = formatSkillValidationIssues([
      { severity: 'error', code: 'SK004', field: 'name', message: 'bad name' },
      { severity: 'warning', code: 'SK030', field: 'license', message: 'no license' },
    ]);
    expect(formatted).toContain('✗ SK004 [name]: bad name');
    expect(formatted).toContain('⚠ SK030 [license]: no license');
  });

  it('omits the field segment when not provided', () => {
    const formatted = formatSkillValidationIssues([
      { severity: 'error', code: 'SK001', message: 'no frontmatter' },
    ]);
    expect(formatted).toBe('  ✗ SK001: no frontmatter');
  });
});
