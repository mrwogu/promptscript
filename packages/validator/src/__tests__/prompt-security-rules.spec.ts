import { describe, expect, it } from 'vitest';
import type { Value } from '@promptscript/core';
import { SCANNED_PAYLOADS } from './object-block-helper.js';
import { PROMPT_LOC, programWith, promptsBlock, runRule, textBlock } from './prompt-helper.js';

const PLACEMENTS: ReadonlyArray<{ title: string; build: (payload: string) => Value }> = [
  { title: 'the system message', build: (p) => ({ description: 'D', system: p }) },
  { title: 'the user message', build: (p) => ({ description: 'D', user: p }) },
  { title: 'a user text block', build: (p) => ({ description: 'D', user: textBlock(p) }) },
  {
    title: 'the description of an input',
    build: (p) => ({
      description: 'D',
      user: 'U',
      inputs: { message: { type: 'string', description: p } },
    }),
  },
  {
    title: 'the description of an output field',
    build: (p) => ({
      description: 'D',
      user: 'U',
      output: { answer: { type: 'string', description: p } },
    }),
  },
  {
    title: 'prompt and input names called resources',
    build: (p) => ({
      description: 'D',
      user: 'U',
      inputs: { resources: { type: 'string', description: p } },
    }),
  },
];

describe.each(SCANNED_PAYLOADS)(
  '$id scans @prompts entries',
  ({ rule, config, payload, finding }) => {
    it.each(PLACEMENTS)('flags a pattern in $title', ({ build }) => {
      const ast = programWith([promptsBlock({ review: build(payload) })]);

      const messages = runRule(rule, ast, config);

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain(finding);
      expect(messages[0]!.location?.file).toBe(PROMPT_LOC.file);
    });

    it('flags a pattern in an entry named resources', () => {
      const ast = programWith([promptsBlock({ resources: { description: 'D', user: payload } })]);

      expect(runRule(rule, ast, config).length).toBeGreaterThan(0);
    });
  }
);
