import { describe, expect, it } from 'vitest';
import {
  agentPropsFromFrontmatter,
  commandPropsFromFrontmatter,
  readToolsField,
} from '../markdown-frontmatter.js';
import { parseMarkdownFrontmatter } from '../skills.js';

const FILE = 'agents/test.md';

describe('readToolsField', () => {
  it('should skip empty values', () => {
    expect(readToolsField(undefined, 'tools', FILE)).toBeUndefined();
    expect(readToolsField(null, 'tools', FILE)).toBeUndefined();
    expect(readToolsField('  ', 'tools', FILE)).toBeUndefined();
  });

  it('should drop blank list items and trim names', () => {
    expect(readToolsField([' Read ', '', 'Grep'], 'tools', FILE)).toEqual(['Read', 'Grep']);
  });

  it('should drop empty parts of a comma separated string', () => {
    expect(readToolsField('Read, , Grep,', 'tools', FILE)).toEqual(['Read', 'Grep']);
  });

  it('should fail on a value that is not a string or a list', () => {
    expect(() => readToolsField(42, 'tools', FILE)).toThrow(
      /tools must be a list of tool names or a comma separated string, found 42/
    );
  });
});

describe('agentPropsFromFrontmatter', () => {
  it('should copy known string, list and flag fields', () => {
    const props = agentPropsFromFrontmatter(
      {
        description: '  Reviews code  ',
        model: 'sonnet',
        memory: 'project',
        disallowedTools: 'Write',
        skills: ['review', 'lint'],
        mcpServers: 'github, jira',
        maxTurns: 12,
        background: true,
        isolation: 'worktree',
      },
      FILE
    );

    expect(props).toEqual({
      description: 'Reviews code',
      model: 'sonnet',
      memory: 'project',
      isolation: 'worktree',
      disallowedTools: ['Write'],
      skills: ['review', 'lint'],
      mcpServers: ['github', 'jira'],
      maxTurns: 12,
      background: true,
    });
  });

  it('should turn numbers and booleans in string fields into strings', () => {
    const props = agentPropsFromFrontmatter({ description: 'D', model: 4, memory: false }, FILE);
    expect(props['model']).toBe('4');
    expect(props['memory']).toBe('false');
  });

  it('should skip a blank description and ignore a non numeric maxTurns', () => {
    const props = agentPropsFromFrontmatter(
      { description: '  ', maxTurns: 'many', background: 'yes' },
      FILE
    );
    expect(props).toEqual({});
  });

  it('should fail on a string field with a mapping', () => {
    expect(() => agentPropsFromFrontmatter({ description: { text: 'x' } }, FILE)).toThrow(
      /description must be a string/
    );
  });

  it('should fail on targets that are not a mapping', () => {
    expect(() => agentPropsFromFrontmatter({ targets: ['claude'] }, FILE)).toThrow(
      /targets must be a mapping of target name to overrides/
    );
    expect(() => agentPropsFromFrontmatter({ targets: { claude: 'sonnet' } }, FILE)).toThrow(
      /targets.claude must be a mapping/
    );
  });

  it('should keep only known override fields and skip empty ones', () => {
    const props = agentPropsFromFrontmatter(
      {
        targets: {
          factory: { model: 'inherit', reasoningEffort: null, disallowedTools: 'Execute' },
          claude: { color: 'red' },
        },
      },
      FILE
    );
    expect(props['targets']).toEqual({
      factory: { model: 'inherit', disallowedTools: 'Execute' },
      claude: {},
    });
  });
});

describe('commandPropsFromFrontmatter', () => {
  it('should map command fields to shortcut properties', () => {
    expect(
      commandPropsFromFrontmatter(
        {
          description: 'Run tests',
          'argument-hint': '[pattern]',
          'allowed-tools': 'Bash(pnpm test:*)',
          model: 'haiku',
        },
        FILE
      )
    ).toEqual({
      description: 'Run tests',
      argumentHint: '[pattern]',
      allowedTools: ['Bash(pnpm test:*)'],
      model: 'haiku',
    });
  });

  it('should leave out missing fields', () => {
    expect(commandPropsFromFrontmatter({}, FILE)).toEqual({});
  });
});

describe('parseMarkdownFrontmatter', () => {
  it('should return null without frontmatter', () => {
    expect(parseMarkdownFrontmatter('# Just markdown', FILE)).toBeNull();
  });

  it('should read simple lines when the YAML is invalid', () => {
    const parsed = parseMarkdownFrontmatter(
      [
        '---',
        '# a comment',
        'description: Use when: tests fail',
        '',
        'tools: [\'Read\', "Grep"]',
        "model: 'sonnet'",
        'empty:',
        'stray line',
        '---',
        'Body.',
      ].join('\n'),
      FILE
    );

    expect(parsed).toEqual({
      fields: {
        description: 'Use when: tests fail',
        tools: ['Read', 'Grep'],
        model: 'sonnet',
        empty: null,
      },
      body: 'Body.',
    });
  });

  it('should warn when it falls back to the line reader', () => {
    const warnings: string[] = [];
    const logger = {
      verbose: () => undefined,
      debug: () => undefined,
      warn: (message: string) => warnings.push(message),
    };

    parseMarkdownFrontmatter('---\ndescription: a: b\n---\nBody.', FILE, logger);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(`${FILE}: frontmatter is not valid YAML`);
  });

  it('should fail when invalid YAML has a list item at column 0', () => {
    expect(() =>
      parseMarkdownFrontmatter('---\ndescription: a: b\ntools:\n- Read\n---\nBody.', FILE)
    ).toThrow(/YAML parse error/);
  });
});
