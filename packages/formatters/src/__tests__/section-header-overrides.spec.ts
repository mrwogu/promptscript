import { describe, expect, it } from 'vitest';
import { createBlockBody, type Program, type SourceLocation } from '@promptscript/core';
import { AntigravityFormatter } from '../formatters/antigravity.js';
import { ClaudeFormatter } from '../formatters/claude.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { FactoryFormatter } from '../formatters/factory.js';
import { GitHubFormatter } from '../formatters/github.js';

const loc: SourceLocation = { file: 'headers.prs', line: 4, column: 3, offset: 52 };

function createProgram(): Program {
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.5.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'restrictions',
        content: {
          type: 'ArrayContent',
          elements: ['No unsafe casts', 'No skipped validation'],
          loc,
        },
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              title: 'Forbidden Practices',
              source: 'explicit',
              loc,
              titleLoc: loc,
            },
          ],
          loc
        ),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function createKnowledgeProgram(): Program {
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.5.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'knowledge',
        content: {
          type: 'TextContent',
          value: 'General operational guidance.',
          loc,
        },
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              title: 'Operational Notes',
              source: 'explicit',
              loc,
              titleLoc: loc,
            },
            {
              type: 'TextEntry',
              text: 'General operational guidance.',
              loc,
            },
          ],
          loc
        ),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function createIdentityProgram(): Program {
  const text = 'Preserve this identity body.';
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.5.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: text, loc },
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              title: 'Localized Project',
              source: 'explicit',
              loc,
              titleLoc: loc,
            },
            {
              type: 'TextEntry',
              text,
              loc,
            },
          ],
          loc
        ),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function createContextProgram(
  source: 'explicit' | 'legacy' = 'explicit',
  sectionId?: string,
  mixed = false
): Program {
  const text = 'Preserve this context body.';
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.5.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'context',
        content: mixed
          ? {
              type: 'MixedContent',
              text: { type: 'TextContent', value: text, loc },
              properties: { languages: ['TypeScript'] },
              loc,
            }
          : { type: 'TextContent', value: text, loc },
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              ...(sectionId ? { sectionId, sectionLoc: loc } : {}),
              title: 'Project Notes',
              source,
              loc,
              titleLoc: loc,
            },
            {
              type: 'TextEntry',
              text,
              loc,
            },
          ],
          loc
        ),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function createHeadingContextProgram(): Program {
  // Mirrors the parser output for a 1.5.0 @context whose text opens with a
  // "## Tech Stack" heading: the heading is promoted to a legacy
  // PresentationEntry and the remainder arrives dedented by the parser.
  const text = '\n- React 18 with TypeScript\n- Vite\n\n## Architecture\n\n- Feature folders';
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.5.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'context',
        content: { type: 'TextContent', value: text, loc },
        canonicalBody: createBlockBody(
          [
            {
              type: 'PresentationEntry',
              title: 'Tech Stack',
              source: 'legacy',
              loc,
              titleLoc: loc,
            },
            { type: 'TextEntry', text, loc },
          ],
          loc
        ),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function createPlainTextContextProgram(): Program {
  // Text-only @context without identity or presentation entries: the
  // 1.0.0 shape where nothing consumes the text, so the context section
  // must render it under the default title.
  const text = 'Preserve this context body.';
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.0.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'context',
        content: { type: 'TextContent', value: text, loc },
        canonicalBody: createBlockBody([{ type: 'TextEntry', text, loc }], loc),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function createNestedListContextProgram(): Program {
  // Authored nested lists survive the parser's common-indent strip, so the
  // context section must keep the relative child indentation.
  const text = '- Parent\n  - Child';
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'headers', syntax: '1.0.0' },
      loc,
    },
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'You are a developer.', loc },
        canonicalBody: createBlockBody(
          [{ type: 'TextEntry', text: 'You are a developer.', loc }],
          loc
        ),
        loc,
      },
      {
        type: 'Block',
        name: 'context',
        content: { type: 'TextContent', value: text, loc },
        canonicalBody: createBlockBody([{ type: 'TextEntry', text, loc }], loc),
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

describe('section header overrides across formatters', () => {
  const formatters = [
    ['claude', new ClaudeFormatter()],
    ['factory', new FactoryFormatter()],
    ['github', new GitHubFormatter()],
    ['cursor', new CursorFormatter()],
    ['antigravity', new AntigravityFormatter()],
  ] as const;

  it.each(formatters)(
    'should use source titles and preserve content for %s',
    (_name, formatter) => {
      const output = formatter.format(createProgram(), { version: 'simple' });

      expect(output.content).toContain('Forbidden Practices');
      expect(output.content).toContain('No unsafe casts');
      expect(output.content).toContain('No skipped validation');
    }
  );

  it.each(formatters)('should title free-form knowledge content for %s', (_name, formatter) => {
    const output = formatter.format(createKnowledgeProgram(), { version: 'simple' });

    expect(output.content).toContain('Operational Notes');
    expect(output.content).toContain('General operational guidance.');
  });

  it.each(formatters)('should preserve text-only context content for %s', (_name, formatter) => {
    const output = formatter.format(createContextProgram(), { version: 'simple' });

    expect(output.content).toContain('Project Notes');
    expect(output.content).toContain('Preserve this context body.');
  });

  it.each(formatters)(
    'should preserve legacy context heading content for %s',
    (_name, formatter) => {
      const output = formatter.format(createContextProgram('legacy'), { version: 'simple' });

      expect(output.content).toContain('Project Notes');
      expect(output.content).toContain('Preserve this context body.');
    }
  );

  it.each(formatters)(
    'should render mixed context content exactly once for %s',
    (_name, formatter) => {
      const output = formatter.format(createContextProgram('explicit', undefined, true), {
        version: 'simple',
      });

      expect(output.content).toContain('Project Notes');
      expect(output.content.match(/Preserve this context body\./g)).toHaveLength(1);
    }
  );

  it.each(formatters)(
    'should preserve text-only project content owned by context for %s',
    (_name, formatter) => {
      const output = formatter.format(createContextProgram('explicit', 'project'), {
        version: 'simple',
      });

      expect(output.content).toContain('Project Notes');
      expect(output.content).toContain('Preserve this context body.');
    }
  );

  it.each(formatters)('should title identity content for %s', (_name, formatter) => {
    const output = formatter.format(createIdentityProgram(), { version: 'simple' });

    expect(output.content).toContain('Localized Project');
    expect(output.content).toContain('Preserve this identity body.');
  });

  it.each(formatters)(
    'should render heading-promoted context once and flat for %s',
    (_name, formatter) => {
      const output = formatter.format(createHeadingContextProgram(), { version: 'simple' });

      // One rendering of the context, never duplicated across sections.
      expect(output.content.match(/React 18 with TypeScript/g)).toHaveLength(1);
      expect(output.content.match(/Feature folders/g)).toHaveLength(1);
      // Block-body indentation must not survive as markdown list nesting.
      expect(output.content).not.toMatch(/\n\s+- Vite/);
      // Remaining h2 headings are demoted to h3 under the titled section.
      expect(output.content).toContain('### Architecture');
    }
  );

  it.each(formatters)(
    'should render text-only context without identity once for %s',
    (_name, formatter) => {
      const output = formatter.format(createPlainTextContextProgram(), { version: 'simple' });

      expect(output.content.match(/Preserve this context body\./g)).toHaveLength(1);
      expect(output.content).toContain('Context');
    }
  );

  // github and antigravity deliberately strip all leading whitespace in the
  // context section, so they flatten nested lists by design and are excluded.
  it.each([
    ['claude', new ClaudeFormatter()],
    ['factory', new FactoryFormatter()],
    ['cursor', new CursorFormatter()],
  ] as const)('should preserve nested list indentation in context for %s', (_name, formatter) => {
    const output = formatter.format(createNestedListContextProgram(), { version: 'simple' });

    expect(output.content).toContain('- Parent\n  - Child');
  });
});
