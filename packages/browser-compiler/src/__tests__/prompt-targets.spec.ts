import { describe, expect, it } from 'vitest';
import { hashPromptBundle, type PromptBundleV1 } from '@promptscript/core';
import { BrowserCompiler } from '../compiler.js';
import { compile } from '../index.js';
import { VirtualFileSystem } from '../virtual-fs.js';

const FILES = {
  'project.prs': `@meta { id: "demo" syntax: "1.6.0" }
@inherit ./base
@prompts {
  greet: {
    description: "Greet a user"
    compose: [identity]
    system: "Reply with ${'$'}{HOME} left as text."
    user: "Hello {{input.name}}"
    inputs: { name: { type: "string", description: "Name" } }
  }
}
`,
  'base.prs': `@meta { id: "base" syntax: "1.6.0" }
@identity { """You are a greeter.""" }
`,
};

describe('prompt targets in the BrowserCompiler', () => {
  it('writes a bundle whose provenance names relative files and whose hash verifies', async () => {
    const result = await compile(FILES, 'project.prs', {
      projectRoot: '.',
      bundledRegistry: false,
      formatters: ['bundle'],
    });

    const bundle = JSON.parse(
      result.outputs.get('prompts/greet.json')?.content ?? 'null'
    ) as PromptBundleV1;
    expect(result.errors).toEqual([]);
    expect(hashPromptBundle(bundle)).toBe(bundle.contentHash);
    expect(bundle.provenance.entry).toBe('project.prs');
    expect(bundle.provenance.segments[0]).toEqual({
      message: 'system',
      path: 'identity',
      files: ['base.prs'],
    });
    expect(bundle.messages[0]?.content).toBe(
      'You are a greeter.\n\nReply with ${HOME} left as text.'
    );
  });

  it('leaves the prompt targets out of the default formatter set', async () => {
    const result = await compile(FILES, 'project.prs', { projectRoot: '.' });

    expect([...result.outputs.keys()].some((path) => path.startsWith('prompts/'))).toBe(false);
  });

  describe('environment guard', () => {
    const fs = (): VirtualFileSystem => new VirtualFileSystem(FILES);

    it.each(['bundle', 'prompt-text'])('refuses the %s target when envVars are set', (name) => {
      expect(
        () => new BrowserCompiler({ fs: fs(), formatters: [name], envVars: { HOME: '/home/ann' } })
      ).toThrow(/cannot compile with envVars set/);
    });

    it('names the rule it protects in the message', () => {
      expect(
        () => new BrowserCompiler({ fs: fs(), formatters: ['bundle'], envVars: { A: 'b' } })
      ).toThrow(/keep \$\{VAR\} as text/);
    });

    it('accepts prompt targets without variables, and variables without prompt targets', () => {
      expect(() => new BrowserCompiler({ fs: fs(), formatters: ['bundle'] })).not.toThrow();
      expect(
        () => new BrowserCompiler({ fs: fs(), formatters: ['bundle'], envVars: {} })
      ).not.toThrow();
      expect(
        () => new BrowserCompiler({ fs: fs(), formatters: ['claude'], envVars: { A: 'b' } })
      ).not.toThrow();
    });

    it('does not apply the guard to the default formatter set', () => {
      expect(() => new BrowserCompiler({ fs: fs(), envVars: { A: 'b' } })).not.toThrow();
    });
  });
});
