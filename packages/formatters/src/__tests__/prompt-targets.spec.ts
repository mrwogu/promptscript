import { describe, expect, it } from 'vitest';
import {
  hashPromptBundle,
  type Block,
  type BlockContent,
  type PromptBundleIndexV1,
  type PromptBundleV1,
  type Program,
  type ProvenanceTrace,
  type Value,
} from '@promptscript/core';
import { BundleFormatter } from '../formatters/bundle.js';
import { PromptTextFormatter } from '../formatters/prompt-text.js';
import { createAstBuilders } from './ast-builders.js';

const { createLoc, createBlock, createProgram } = createAstBuilders('.promptscript/project.prs');

const text = (value: string): Value => ({ type: 'TextContent', value, loc: createLoc(2) });
const textContent = (value: string): BlockContent => ({
  type: 'TextContent',
  value,
  loc: createLoc(2),
});
const objectContent = (properties: Record<string, Value>): BlockContent => ({
  type: 'ObjectContent',
  properties,
  loc: createLoc(2),
});

interface Fixture {
  prompts?: Record<string, Value>;
  meta?: Record<string, Value>;
  blocks?: Block[];
}

function program({ prompts, meta, blocks = [] }: Fixture = {}): Program {
  const ast = createProgram([
    ...blocks,
    ...(prompts ? [createBlock('prompts', objectContent(prompts), 5)] : []),
  ]);
  ast.meta = {
    type: 'MetaBlock',
    fields: { id: 'acme-support', syntax: '1.6.0', ...meta },
    loc: createLoc(1),
  };
  return ast;
}

const reply = (extra: Record<string, Value> = {}): Record<string, Value> => ({
  'refund-reply': {
    description: 'Answer a refund request',
    user: text('Customer wrote: {{input.message}}'),
    inputs: { message: { type: 'string', description: 'Customer message' } },
    ...extra,
  },
});

function bundleOf(ast: Program, options = {}): PromptBundleV1 {
  const output = new BundleFormatter().format(ast, options);
  const file = output.additionalFiles?.find((f) => f.path === 'prompts/refund-reply.json');
  return JSON.parse(file?.content ?? 'null') as PromptBundleV1;
}

const system = (bundle: PromptBundleV1): string | undefined =>
  bundle.messages.find((message) => message.role === 'system')?.content;

describe('bundle target', () => {
  describe('files', () => {
    it('writes nothing for a program without prompts', () => {
      const output = new BundleFormatter().format(program());

      expect(output.omit).toBe(true);
      expect(output.path).toBe('prompts/index.json');
      expect(output.additionalFiles).toBeUndefined();
    });

    it('writes nothing for an empty @prompts block', () => {
      expect(new BundleFormatter().format(program({ prompts: {} })).omit).toBe(true);
    });

    it('writes one bundle per prompt and an index as the primary file', () => {
      const output = new BundleFormatter().format(program({ prompts: reply() }));

      expect(output.path).toBe('prompts/index.json');
      expect(output.additionalFiles?.map((file) => file.path)).toEqual([
        'prompts/refund-reply.json',
      ]);
      expect(output.managedOutputDirectories).toEqual(['prompts']);
      expect(output.omit).toBeUndefined();
    });

    it('serializes with two spaces and a final newline and no timestamp', () => {
      const output = new BundleFormatter().format(program({ prompts: reply() }));
      const file = output.additionalFiles?.[0]?.content ?? '';

      expect(file.endsWith('}\n')).toBe(true);
      expect(file).toBe(`${JSON.stringify(JSON.parse(file), null, 2)}\n`);
      expect(file).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('puts $schema first in a bundle and in the index', () => {
      const output = new BundleFormatter().format(program({ prompts: reply() }));

      expect(Object.keys(JSON.parse(output.content))[0]).toBe('$schema');
      expect(Object.keys(JSON.parse(output.additionalFiles?.[0]?.content ?? '{}'))).toEqual([
        '$schema',
        'id',
        'description',
        'contentHash',
        'messages',
        'inputs',
        'governance',
        'provenance',
      ]);
    });

    it('lists the prompts in the index sorted by id', () => {
      const prompts = {
        ...reply(),
        alpha: { description: 'First', user: 'a' },
        Zulu: { description: 'Last', user: 'z' },
      };

      const output = new BundleFormatter().format(program({ prompts }));
      const index = JSON.parse(output.content) as PromptBundleIndexV1;

      expect(index.prompts.map((entry) => entry.id)).toEqual([
        'acme-support/Zulu',
        'acme-support/alpha',
        'acme-support/refund-reply',
      ]);
      expect(index.prompts[2]?.file).toBe('refund-reply.json');
    });

    it('moves the bundles with the primary file', () => {
      const output = new BundleFormatter().format(program({ prompts: reply() }), {
        outputPath: 'build/ai/index.json',
      });

      expect(output.path).toBe('build/ai/index.json');
      expect(output.additionalFiles?.[0]?.path).toBe('build/ai/refund-reply.json');
      expect(output.managedOutputDirectories).toEqual(['build/ai']);
    });

    it('refuses an output path without a directory', () => {
      expect(() =>
        new BundleFormatter().format(program({ prompts: reply() }), { outputPath: 'index.json' })
      ).toThrow(/must name one/);
    });

    it('refuses an output path whose directory is the project root', () => {
      for (const outputPath of ['./index.json', '././index.json', '.\\index.json', '/index.json']) {
        expect(
          () => new BundleFormatter().format(program({ prompts: reply() }), { outputPath }),
          outputPath
        ).toThrow(/must name one/);
      }
    });

    it('drops leading dot segments from a nested output path', () => {
      const output = new BundleFormatter().format(program({ prompts: reply() }), {
        outputPath: '././x/index.json',
      });

      expect(output.path).toBe('x/index.json');
      expect(output.managedOutputDirectories).toEqual(['x']);
    });

    it('locates the refusal at the @meta block', () => {
      expect(() =>
        new PromptTextFormatter().format(program({ prompts: reply() }), { outputPath: './a.md' })
      ).toThrow(expect.objectContaining({ location: expect.objectContaining({ line: 1 }) }));
    });
  });

  describe('bundle fields', () => {
    it('describes a minimal prompt', () => {
      const bundle = bundleOf(program({ prompts: reply() }));

      expect(bundle).toMatchObject({
        $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
        id: 'acme-support/refund-reply',
        description: 'Answer a refund request',
        messages: [{ role: 'user', content: 'Customer wrote: {{input.message}}' }],
        inputs: { message: { type: 'string', description: 'Customer message', required: true } },
        governance: {},
      });
      expect(bundle.output).toBeUndefined();
      expect(bundle.model).toBeUndefined();
    });

    it('carries a content hash that matches its content and ignores provenance', () => {
      const bundle = bundleOf(program({ prompts: reply() }));

      expect(bundle.contentHash).toMatch(/^sha256-[0-9a-f]{64}$/);
      expect(hashPromptBundle(bundle)).toBe(bundle.contentHash);
      expect(hashPromptBundle({ ...bundle, provenance: { entry: 'x', segments: [] } })).toBe(
        bundle.contentHash
      );
    });

    it('changes the hash when a message changes', () => {
      const first = bundleOf(program({ prompts: reply() }));
      const second = bundleOf(program({ prompts: reply({ user: text('Other') }) }));

      expect(second.contentHash).not.toBe(first.contentHash);
    });

    it('marks an input with a default as optional', () => {
      const bundle = bundleOf(
        program({
          prompts: reply({
            inputs: {
              tone: {
                type: 'enum',
                description: 'Tone',
                options: ['warm', 'formal'],
                default: 'warm',
              },
              limit: { type: 'number', description: 'Limit', default: 100.0 },
            },
          }),
        })
      );

      expect(bundle.inputs).toEqual({
        tone: {
          type: 'enum',
          description: 'Tone',
          options: ['warm', 'formal'],
          default: 'warm',
          required: false,
        },
        limit: { type: 'number', description: 'Limit', default: 100, required: false },
      });
    });

    it('turns the output contract into a JSON Schema subset', () => {
      const bundle = bundleOf(
        program({
          prompts: reply({
            output: {
              verdict: { type: 'enum', options: ['approve', 'escalate'], description: 'Verdict' },
              citations: { type: 'list', items: { type: 'string' }, description: 'Sources' },
              score: { type: 'number', description: 'Score' },
              ok: { type: 'boolean', description: 'Ok' },
            },
          }),
        })
      );

      expect(bundle.output).toEqual({
        type: 'object',
        properties: {
          verdict: { type: 'string', description: 'Verdict', enum: ['approve', 'escalate'] },
          citations: { type: 'array', description: 'Sources', items: { type: 'string' } },
          score: { type: 'number', description: 'Score' },
          ok: { type: 'boolean', description: 'Ok' },
        },
        required: ['citations', 'ok', 'score', 'verdict'],
        additionalProperties: false,
      });
    });

    it('turns a list of enum items into array items with an enum', () => {
      const bundle = bundleOf(
        program({
          prompts: reply({
            output: {
              tags: {
                type: 'list',
                items: { type: 'enum', options: ['a', 'b'] },
                description: 'Tags',
              },
              scores: { type: 'list', items: { type: 'number' }, description: 'Scores' },
            },
          }),
        })
      );

      expect(bundle.output?.properties).toEqual({
        tags: { type: 'array', description: 'Tags', items: { type: 'string', enum: ['a', 'b'] } },
        scores: { type: 'array', description: 'Scores', items: { type: 'number' } },
      });
    });

    it('keeps ${VAR} and other text as it is', () => {
      const bundle = bundleOf(
        program({ prompts: reply({ system: 'Home is ${HOME} and $PATH.', user: 'x' }) })
      );

      expect(system(bundle)).toBe('Home is ${HOME} and $PATH.');
    });
  });

  describe('model', () => {
    const modelPrompt = (model: Record<string, Value>): Fixture => ({
      prompts: reply({ model }),
    });

    it('records the authored reference, the resolved identity and ordered parameters', () => {
      const bundle = bundleOf(
        program(
          modelPrompt({
            seed: 7,
            stop: ['B', 'A'],
            maxTokens: 800,
            temperature: 0.2,
            ref: 'claude-sonnet-5-5',
          })
        )
      );

      expect(bundle.model).toEqual({
        ref: 'claude-sonnet-5-5',
        profile: 'claude-sonnet-5-5',
        provider: 'anthropic',
        apiId: expect.any(String),
        params: { temperature: 0.2, maxTokens: 800, stop: ['B', 'A'], seed: 7 },
      });
      expect(Object.keys(bundle.model?.params ?? {})).toEqual([
        'temperature',
        'maxTokens',
        'stop',
        'seed',
      ]);
    });

    it('resolves a floating alias to the release it points at', () => {
      const bundle = bundleOf(program(modelPrompt({ ref: 'sonnet' })));

      expect(bundle.model?.ref).toBe('sonnet');
      expect(bundle.model?.provider).toBe('anthropic');
      expect(bundle.model?.profile).toMatch(/^claude-sonnet-/);
    });

    it('uses a profile from the models config', () => {
      const models = {
        profiles: {
          'acme-model': { provider: 'acme', family: 'acme', version: '1', apiId: 'acme-1' },
        },
      };

      const bundle = bundleOf(program(modelPrompt({ ref: 'acme-model' })), { models });

      expect(bundle.model).toMatchObject({ provider: 'acme', apiId: 'acme-1' });
    });

    it('refuses a model the catalog does not know', () => {
      expect(() => bundleOf(program(modelPrompt({ ref: 'no-such-model' })))).toThrow(
        /not in the model catalog/
      );
    });
  });

  describe('governance', () => {
    it('takes the entry value over the @meta default and unions data classes', () => {
      const ast = program({
        meta: {
          risk: 'low',
          owner: 'team-a',
          domain: 'support',
          dataClasses: ['pii', 'internal'],
          reviewers: ['ann'],
        },
        prompts: reply({
          risk: 'high',
          owner: 'team-b',
          dataClasses: ['financial', 'pii'],
          reviewers: ['zed', 'bob', 'bob'],
        }),
      });

      expect(bundleOf(ast).governance).toEqual({
        risk: 'high',
        owner: 'team-b',
        domain: 'support',
        dataClasses: ['financial', 'internal', 'pii'],
        reviewers: ['bob', 'zed'],
      });
    });

    it('falls back to @meta and leaves out empty lists', () => {
      const ast = program({ meta: { risk: 'medium', reviewers: ['ann'] }, prompts: reply() });

      expect(bundleOf(ast).governance).toEqual({ risk: 'medium', reviewers: ['ann'] });
    });

    it('sorts lists by UTF-16 code units, not by locale', () => {
      const ast = program({ prompts: reply({ dataClasses: ['b', 'B', 'a', 'Z'] }) });

      expect(bundleOf(ast).governance.dataClasses).toEqual(['B', 'Z', 'a', 'b']);
    });
  });

  describe('line endings', () => {
    it('turns CRLF and CR into LF in every string', () => {
      const ast = program({
        prompts: {
          'refund-reply': {
            description: 'Line one\r\nLine two\rLine three',
            system: 'Be kind.\r\nBe brief.',
            user: text('Ask\r\nnow'),
            inputs: { message: { type: 'string', description: 'A\r\nB' } },
          },
        },
      });

      const bundle = bundleOf(ast);

      expect(bundle.description).toBe('Line one\nLine two\nLine three');
      expect(bundle.messages.map((m) => m.content)).toEqual(['Be kind.\nBe brief.', 'Ask\nnow']);
      expect(bundle.inputs['message']?.description).toBe('A\nB');
      expect(JSON.stringify(bundle)).not.toContain('\\r');
    });

    it('gives a CRLF source the same hash as an LF source', () => {
      const lf = bundleOf(program({ prompts: reply({ system: 'a\nb' }) }));
      const crlf = bundleOf(program({ prompts: reply({ system: 'a\r\nb' }) }));

      expect(crlf.contentHash).toBe(lf.contentHash);
    });
  });

  describe('composition', () => {
    const blocks = (): Block[] => [
      createBlock('examples', objectContent({ one: { input: 'in', output: 'out' } }), 9),
      createBlock(
        'restrictions',
        { type: 'ArrayContent', elements: ['No secrets'], loc: createLoc(8) },
        8
      ),
      createBlock('standards', objectContent({ tone: 'warm' }), 7),
      createBlock('knowledge', textContent('Refunds take 5 days.'), 6),
      createBlock('context', objectContent({ product: 'Acme Cloud' }), 4),
      createBlock('identity', textContent('You are the Acme support assistant.'), 3),
    ];

    it('uses the fixed order whatever order compose lists them in', () => {
      const ast = program({
        blocks: blocks(),
        prompts: reply({
          compose: ['examples', 'restrictions', 'standards', 'knowledge', 'context', 'identity'],
          system: 'Own text.',
        }),
      });

      expect(system(bundleOf(ast))).toBe(
        [
          'You are the Acme support assistant.',
          '## Context\n\n- product: Acme Cloud',
          '## Knowledge\n\nRefunds take 5 days.',
          '## Standards\n\n- tone: warm',
          '## Restrictions\n\n- No secrets',
          '## Examples\n\n### Example: one\n\n**Input:**\n\n```\nin\n```\n\n**Output:**\n\n```\nout\n```',
          'Own text.',
        ].join('\n\n')
      );
    });

    it('composes only the blocks that are listed', () => {
      const ast = program({
        blocks: blocks(),
        prompts: reply({ compose: ['identity'], system: 'Own text.' }),
      });

      expect(system(bundleOf(ast))).toBe('You are the Acme support assistant.\n\nOwn text.');
    });

    it('uses only the own text without compose', () => {
      const ast = program({ blocks: blocks(), prompts: reply({ system: 'Own text.' }) });

      expect(system(bundleOf(ast))).toBe('Own text.');
    });

    it('makes a system message from composed blocks alone', () => {
      const ast = program({ blocks: blocks(), prompts: reply({ compose: ['identity'] }) });

      expect(system(bundleOf(ast))).toBe('You are the Acme support assistant.');
    });

    it('keeps every piece of content of every composed block', () => {
      const ast = program({
        blocks: [
          createBlock(
            'context',
            {
              type: 'MixedContent',
              text: { type: 'TextContent', value: 'ctx-text', loc: createLoc(2) },
              properties: {
                scalar: 'ctx-scalar',
                list: ['ctx-a', 'ctx-b'],
                nested: { deep: { value: 'ctx-deep' } },
                flag: true,
                count: 3,
              },
              listItems: ['ctx-item'],
              loc: createLoc(2),
            },
            2
          ),
          createBlock('knowledge', textContent('know-1\nknow-2'), 3),
          createBlock(
            'restrictions',
            {
              type: 'MixedContent',
              text: { type: 'TextContent', value: '- text-rule', loc: createLoc(2) },
              properties: {},
              listItems: ['list-rule'],
              loc: createLoc(2),
            },
            4
          ),
        ],
        prompts: reply({ compose: ['context', 'knowledge', 'restrictions'] }),
      });

      const message = system(bundleOf(ast)) ?? '';

      for (const piece of [
        'ctx-text',
        'ctx-scalar',
        'ctx-a',
        'ctx-b',
        'ctx-deep',
        'ctx-item',
        'flag: true',
        'count: 3',
        'know-1',
        'know-2',
        '- text-rule',
        '- list-rule',
      ]) {
        expect(message, piece).toContain(piece);
      }
    });

    it('escapes every {{ in composed blocks and leaves the own text live', () => {
      const ast = program({
        blocks: [
          createBlock(
            'identity',
            textContent('Say {{input.message}} and {{name}} and \\{{x}}.'),
            3
          ),
        ],
        prompts: reply({ compose: ['identity'], system: 'Own {{input.message}}.' }),
      });

      expect(system(bundleOf(ast))).toBe(
        'Say \\{{input.message}} and \\{{name}} and \\\\{{x}}.\n\nOwn {{input.message}}.'
      );
    });

    it('trims trailing spaces and normalizes line endings in composed blocks', () => {
      const ast = program({
        blocks: [createBlock('identity', textContent('First line   \r\nSecond line\t\r\n'), 3)],
        prompts: reply({ compose: ['identity'] }),
      });

      expect(system(bundleOf(ast))).toBe('First line\nSecond line');
    });

    it('ignores @header on a composed block', () => {
      const ast = program({
        blocks: [createBlock('context', objectContent({ a: 'b' }), 3)],
        prompts: reply({ compose: ['context'] }),
      });

      expect(system(bundleOf(ast))).toBe('## Context\n\n- a: b');
    });

    it('renders nested values as indented bullets and drops what has no text', () => {
      const ast = program({
        blocks: [
          createBlock(
            'context',
            {
              type: 'MixedContent',
              text: { type: 'TextContent', value: 'Intro\n    indented line', loc: createLoc(2) },
              properties: {
                matrix: [['a', 'b'], { name: 'n', tags: ['t'] }],
                nested: { empty: {}, deep: { leaf: 'v' } },
                note: { type: 'TextContent', value: 'first\n  second', loc: createLoc(2) },
                expr: { type: 'TypeExpression', kind: 'range', loc: createLoc(2) },
                hidden: null,
                __internal: 'x',
                items: 'not a list',
              },
              loc: createLoc(2),
            } as BlockContent,
            2
          ),
        ],
        prompts: reply({ compose: ['context'] }),
      });

      expect(system(bundleOf(ast))).toBe(
        [
          '## Context',
          '',
          'Intro\nindented line',
          '',
          '- matrix:',
          '    - a',
          '    - b',
          '  - name: n',
          '  - tags:',
          '    - t',
          '- nested:',
          '  - deep:',
          '    - leaf: v',
          '- note: first',
          '  second',
          '- items: not a list',
        ].join('\n')
      );
    });

    it('skips empty text, unreadable items, internal names and incomplete examples', () => {
      const ast = program({
        blocks: [
          createBlock(
            'context',
            {
              type: 'MixedContent',
              text: { type: 'TextContent', value: '   ', loc: createLoc(2) },
              properties: { list: ['kept', null, { type: 'TypeExpression', kind: 'range' }] },
              loc: createLoc(2),
            } as BlockContent,
            2
          ),
          createBlock(
            'knowledge',
            { type: 'ArrayContent', elements: ['first', ''], loc: createLoc(3) },
            3
          ),
          createBlock(
            'examples',
            objectContent({
              __hidden: { input: 'a', output: 'b' },
              text: 'not an example',
              noOutput: { input: 'only input' },
              objectInput: { input: { a: 1 }, output: 'x' },
              ok: { input: 'in', output: 'out', description: 'Multi\n\n  line  description' },
            }),
            4
          ),
        ],
        prompts: reply({ compose: ['context', 'knowledge', 'examples'] }),
      });

      expect(system(bundleOf(ast))).toBe(
        [
          '## Context\n\n- list:\n  - kept',
          '## Knowledge\n\n- first',
          '## Examples\n\n### Example: ok\n\nMulti line  description\n\n**Input:**\n\n```\nin\n```\n\n**Output:**\n\n```\nout\n```',
        ].join('\n\n')
      );
    });

    it('keeps blocks without text out of the message and out of the provenance', () => {
      const ast = program({
        blocks: [
          createBlock('examples', textContent('plain text'), 3),
          createBlock('knowledge', objectContent({}), 4),
          createBlock('identity', textContent('You help.'), 5),
        ],
        prompts: reply({ compose: ['examples', 'knowledge', 'identity'] }),
      });

      const bundle = bundleOf(ast);

      expect(system(bundle)).toBe('You help.');
      expect(bundle.provenance.segments.map((segment) => segment.path)).toEqual([
        'identity',
        'prompts.refund-reply.user',
      ]);
    });

    it('renders a list merged from several layers as plain bullets', () => {
      const ast = program({
        blocks: [
          createBlock(
            'restrictions',
            objectContent({ items: ['Never share secrets', 'Escalate refunds'], severity: 'high' }),
            3
          ),
          createBlock(
            'context',
            {
              type: 'MixedContent',
              properties: { product: 'Acme Cloud' },
              loc: createLoc(2),
            } as BlockContent,
            4
          ),
        ],
        prompts: reply({ compose: ['context', 'restrictions'] }),
      });

      expect(system(bundleOf(ast))).toBe(
        [
          '## Context\n\n- product: Acme Cloud',
          '## Restrictions\n\n- Never share secrets\n- Escalate refunds\n- severity: high',
        ].join('\n\n')
      );
    });

    it('dedents continuation lines and ignores blank ones', () => {
      const ast = program({
        blocks: [
          createBlock('knowledge', textContent('Title\n    indented\n      deeper\n\n'), 3),
          createBlock('identity', textContent('One\n\n'), 4),
        ],
        prompts: reply({ compose: ['knowledge', 'identity'] }),
      });

      expect(system(bundleOf(ast))).toBe('One\n\n## Knowledge\n\nTitle\nindented\n  deeper');
    });

    it('fences an example with more backticks than its content holds', () => {
      const ast = program({
        blocks: [
          createBlock(
            'examples',
            objectContent({ code: { input: '```js\nx\n```', output: 'y' } }),
            3
          ),
        ],
        prompts: reply({ compose: ['examples'] }),
      });

      expect(system(bundleOf(ast))).toContain('````\n```js\nx\n```\n````');
    });
  });

  describe('provenance', () => {
    const trace: ProvenanceTrace = {
      version: 1,
      entry: '.promptscript/project.prs',
      entries: [
        {
          path: 'identity',
          kind: 'block',
          source: { file: '@acme/tone@1.2.0', line: 2, column: 1 },
          history: [
            {
              operation: 'declaration',
              action: 'selected',
              source: { file: '@acme/tone@1.2.0', line: 2, column: 1 },
              chain: [],
            },
            {
              operation: 'extend',
              action: 'appended',
              source: { file: '.promptscript/project.prs', line: 9, column: 1 },
              chain: [],
            },
            {
              operation: 'inherit',
              action: 'selected',
              source: { file: '.promptscript/ignored.prs', line: 1, column: 1 },
              chain: [],
            },
          ],
        },
        {
          path: 'identity.text[0]',
          kind: 'text',
          source: { file: '@acme/tone@1.2.0', line: 2, column: 13 },
          history: [],
        },
        {
          path: 'prompts.refund-reply.user',
          kind: 'value',
          source: { file: '.promptscript/project.prs', line: 6, column: 3 },
          history: [],
        },
      ],
    };

    const withTrace = (): PromptBundleV1 =>
      bundleOf(
        program({
          blocks: [createBlock('identity', textContent('You help.'), 3)],
          prompts: reply({ compose: ['identity'], system: 'Own.' }),
        }),
        { provenance: trace }
      );

    it('lists the distinct files of each segment in trace order, without positions', () => {
      expect(withTrace().provenance).toEqual({
        entry: '.promptscript/project.prs',
        segments: [
          {
            message: 'system',
            path: 'identity',
            files: ['@acme/tone@1.2.0', '.promptscript/project.prs'],
          },
          { message: 'system', path: 'prompts.refund-reply.system', files: [] },
          {
            message: 'user',
            path: 'prompts.refund-reply.user',
            files: ['.promptscript/project.prs'],
          },
        ],
      });
    });

    it('keeps the hash the same when provenance changes', () => {
      const ast = program({ prompts: reply() });
      const other: ProvenanceTrace = { ...trace, entry: 'other/entry.prs' };

      expect(bundleOf(ast, { provenance: other }).contentHash).toBe(
        bundleOf(ast, { provenance: trace }).contentHash
      );
    });

    it('never writes an absolute path, even from a raw trace', () => {
      const raw: ProvenanceTrace = {
        ...trace,
        entry: '/Users/ann/work/app/.promptscript/project.prs',
        entries: [
          {
            path: 'prompts.refund-reply.user',
            kind: 'value',
            source: { file: '/Users/ann/.promptscript/.cache/git/ab/tone.prs', line: 1, column: 1 },
            history: [],
          },
        ],
      };

      const text = JSON.stringify(
        new BundleFormatter().format(program({ prompts: reply() }), { provenance: raw })
      );

      expect(text).not.toContain('/Users');
      expect(text).not.toContain('.cache');
      expect(text).toContain('external:project.prs');
    });

    it('names the source of the index', () => {
      const output = new BundleFormatter().format(program({ prompts: reply() }), {
        provenance: trace,
      });

      expect((JSON.parse(output.content) as PromptBundleIndexV1).source).toBe(
        '.promptscript/project.prs'
      );
    });
  });

  describe('refusals', () => {
    it.each(['1.5.0', '1.0.0'])('refuses to emit below syntax 1.6.0 (%s)', (syntax) => {
      expect(() =>
        new BundleFormatter().format(program({ meta: { syntax }, prompts: reply() }))
      ).toThrow(/needs syntax 1\.6\.0/);
    });

    it('accepts a later syntax version', () => {
      const ast = program({ meta: { syntax: '1.7.0' }, prompts: reply() });

      expect(new BundleFormatter().format(ast).omit).toBeUndefined();
    });

    it('does not complain about old syntax when there are no prompts', () => {
      expect(new BundleFormatter().format(program({ meta: { syntax: '1.2.0' } })).omit).toBe(true);
    });

    it('refuses a syntax that is unreadable, not a version or below 1.6.0', () => {
      for (const syntax of ['latest', 7, '1.5.0-rc.1', '1.6.0-rc.1', '1.6'] as const) {
        const ast = program({ meta: { syntax }, prompts: reply() });

        expect(() => new BundleFormatter().format(ast), String(syntax)).toThrow(
          /needs syntax 1\.6\.0 or later/
        );
      }
    });

    it('refuses a program without a declared syntax and names it', () => {
      const ast = program({ prompts: reply() });
      delete ast.meta?.fields['syntax'];

      expect(() => new PromptTextFormatter().format(ast)).toThrow(/declares none/);
    });

    it('locates the syntax error at the program when there is no @meta', () => {
      const ast = program({ prompts: reply() });
      delete ast.meta;

      expect(() => new BundleFormatter().format(ast)).toThrow(/declares none/);
    });

    it('accepts a later syntax', () => {
      const ast = program({ meta: { syntax: '1.7.0' }, prompts: reply() });

      expect(new BundleFormatter().format(ast).omit).toBeUndefined();
    });

    it('counts the problems after the first one', () => {
      const ast = program({ prompts: { one: { user: 'x' }, two: { user: 'y' } } });

      expect(() => new BundleFormatter().format(ast)).toThrow(/1 more problems in @prompts/);
    });

    it('names an unknown source when there is neither a trace nor a file', () => {
      const ast = program({ prompts: reply() });
      delete (ast as { loc?: unknown }).loc;

      const output = new BundleFormatter().format(ast);

      expect((JSON.parse(output.content) as PromptBundleIndexV1).source).toBe('unknown');
    });

    it('names the file of the program as external when there is no trace', () => {
      const ast = program({ prompts: reply() });
      ast.loc = { file: '/Users/ann/work/project.prs', line: 1, column: 1 };

      const output = new BundleFormatter().format(ast);

      expect((JSON.parse(output.content) as PromptBundleIndexV1).source).toBe(
        'external:project.prs'
      );
    });

    it('needs an id in @meta', () => {
      const ast = program({ prompts: reply() });
      ast.meta = { type: 'MetaBlock', fields: { syntax: '1.6.0' }, loc: createLoc(1) };

      expect(() => new BundleFormatter().format(ast)).toThrow(/id in @meta/);
    });

    it('reports an invalid entry with its location', () => {
      const ast = program({ prompts: { broken: { user: 'x' } } });

      expect(() => new BundleFormatter().format(ast)).toThrow(/Prompt "broken"/);
    });

    it('fails when composition leaves a prompt without a message', () => {
      const ast = program({
        blocks: [createBlock('identity', textContent('   '), 3)],
        prompts: { empty: { description: 'd', system: 'x', compose: ['identity'] } },
      });
      ast.blocks = [
        ...ast.blocks.slice(0, 1),
        createBlock(
          'prompts',
          objectContent({ empty: { description: 'd', compose: ['identity'] } }),
          5
        ),
      ];

      expect(() => new BundleFormatter().format(ast)).toThrow();
    });
  });
});

describe('prompt-text target', () => {
  const formatter = new PromptTextFormatter();

  it('writes nothing for a program without prompts', () => {
    const output = formatter.format(program());

    expect(output.omit).toBe(true);
    expect(output.path).toBe('prompts/README.md');
  });

  it('writes the composed system message under a hash comment and lists it in the README', () => {
    const ast = program({
      blocks: [createBlock('identity', textContent('You help.'), 3)],
      prompts: reply({ compose: ['identity'], system: 'Own {{input.message}}.' }),
    });

    const output = formatter.format(ast);
    const file = output.additionalFiles?.[0];
    const bundle = bundleOf(ast);

    expect(file?.path).toBe('prompts/refund-reply.md');
    expect(file?.content).toBe(
      `<!-- bundle: ${bundle.contentHash} -->\n\nYou help.\n\nOwn {{input.message}}.\n`
    );
    expect(output.path).toBe('prompts/README.md');
    expect(output.content).toContain(
      '| `refund-reply` | Answer a refund request | [refund-reply.md](refund-reply.md) |'
    );
    expect(output.managedOutputDirectories).toEqual(['prompts']);
  });

  it('does not call itself ready to paste', () => {
    const output = formatter.format(program({ prompts: reply({ system: 'x' }) }));

    expect(output.content.toLowerCase()).not.toContain('paste');
    expect(output.content).toContain('preview');
  });

  it('skips a prompt without a system message and says so', () => {
    const ast = program({
      prompts: {
        ...reply({ system: 'Has system' }),
        'user-only': { description: 'U', user: 'hi' },
      },
    });

    const output = formatter.format(ast);

    expect(output.additionalFiles?.map((file) => file.path)).toEqual(['prompts/refund-reply.md']);
    expect(output.content).not.toContain('user-only');
    expect(output.warnings).toEqual([
      expect.objectContaining({
        code: 'PS4002',
        message: expect.stringContaining('"user-only"'),
      }),
    ]);
  });

  it('writes nothing, with a warning, when no prompt has a system message', () => {
    const output = formatter.format(program({ prompts: reply() }));

    expect(output.omit).toBe(true);
    expect(output.warnings).toHaveLength(1);
  });

  it('keeps README cells on one line and escapes pipes', () => {
    const ast = program({
      prompts: reply({ description: 'Line one\r\nLine | two', system: 'x' }),
    });

    expect(formatter.format(ast).content).toContain('| Line one Line \\| two |');
  });

  it('lists several previews sorted by key and escapes backslashes in descriptions', () => {
    const ast = program({
      prompts: {
        zeta: { description: 'Last', system: 'z' },
        alpha: { description: 'Path C:\\temp', system: 'a' },
      },
    });

    const rows = formatter
      .format(ast)
      .content.split('\n')
      .filter((line) => line.startsWith('| `'));

    expect(rows).toEqual([
      '| `alpha` | Path C:\\\\temp | [alpha.md](alpha.md) |',
      '| `zeta` | Last | [zeta.md](zeta.md) |',
    ]);
  });

  it('refuses to emit below syntax 1.6.0', () => {
    expect(() =>
      formatter.format(program({ meta: { syntax: '1.5.0' }, prompts: reply({ system: 'x' }) }))
    ).toThrow(/needs syntax 1\.6\.0/);
  });
});
