import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  stripPromptScriptMarkers,
  hashPromptBundle,
  type PromptBundleV1,
} from '@promptscript/core';
import {
  BrowserCompiler,
  VirtualFileSystem,
  compile as compileInBrowser,
} from '@promptscript/browser-compiler';
import { Compiler } from '@promptscript/compiler';
import { validateBundle, validateIndex } from './prompt-bundle-validators.js';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const FILES: Record<string, string> = {
  'project.prs': [
    '@meta {',
    '  id: "acme-support"',
    '  syntax: "1.6.0"',
    '  owner: "team-support"',
    '  dataClasses: ["internal"]',
    '}',
    '',
    '@inherit ./base',
    '',
    '@restrictions {',
    '  - "Escalate refunds above 500"',
    '}',
    '',
    '@prompts {',
    '  refund-reply: {',
    '    description: "Answer a refund request"',
    '    risk: "high"',
    '    dataClasses: ["pii"]',
    '    compose: [identity, restrictions, context]',
    '    model: { ref: "claude-sonnet-5-5", temperature: 0.2, maxTokens: 800, stop: ["END", "STOP"] }',
    '    inputs: {',
    '      message: { type: "string", description: "Customer message" }',
    '      tone: { type: "enum", description: "Tone", options: ["warm", "formal"], default: "warm" }',
    '    }',
    '    output: {',
    '      decision: { type: "enum", options: ["approve", "escalate"], description: "Decision" }',
    '      citations: { type: "list", items: { type: "string" }, description: "Sources" }',
    '    }',
    '    system: "Home is ${HOME}. Answer in the {{input.tone}} tone."',
    '    user: """',
    '      Customer wrote: {{input.message}}',
    '    """',
    '  }',
    '  triage: { description: "Triage a ticket" user: "Triage this ticket." }',
    '}',
    '',
  ].join('\n'),
  'base.prs': [
    '@meta { id: "base" syntax: "1.6.0" }',
    '@identity {',
    '  """',
    '  You are the Acme support assistant. Say {{x}} never.',
    '  """',
    '}',
    '@restrictions {',
    '  - "Never share secrets"',
    '}',
    '@context {',
    '  product: "Acme Cloud"',
    '  regions: ["eu", "us"]',
    '}',
    '',
  ].join('\n'),
};

async function viaCli(files: Record<string, string>): Promise<Map<string, string>> {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'prs-parity-')));
  directories.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  const result = await new Compiler({
    resolver: { registryPath: root, projectRoot: root, localPath: root },
    formatters: ['bundle', 'prompt-text'],
  }).compile(join(root, 'project.prs'));
  expect(result.errors).toEqual([]);
  return new Map([...result.outputs].map(([path, output]) => [path, output.content]));
}

async function viaBrowser(files: Record<string, string>): Promise<Map<string, string>> {
  const result = await compileInBrowser(files, 'project.prs', {
    projectRoot: '.',
    bundledRegistry: false,
    formatters: ['bundle', 'prompt-text'],
  });
  expect(result.errors).toEqual([]);
  return new Map([...result.outputs].map(([path, output]) => [path, output.content]));
}

describe('prompt targets in the CLI compiler and the BrowserCompiler', () => {
  it('writes the same bytes for bundles, the index and the previews', async () => {
    const cli = await viaCli(FILES);
    const browser = await viaBrowser(FILES);

    expect([...browser.keys()].sort()).toEqual([...cli.keys()].sort());
    for (const [path, content] of cli) {
      expect(stripPromptScriptMarkers(content), path).toBe(
        stripPromptScriptMarkers(browser.get(path) ?? '')
      );
    }
  });

  it('writes a bundle whose hash verifies, with the same hash on both sides', async () => {
    const cli = JSON.parse(
      (await viaCli(FILES)).get('prompts/refund-reply.json') ?? ''
    ) as PromptBundleV1;
    const browser = JSON.parse(
      (await viaBrowser(FILES)).get('prompts/refund-reply.json') ?? ''
    ) as PromptBundleV1;

    expect(cli.contentHash).toBe(browser.contentHash);
    expect(hashPromptBundle(cli)).toBe(cli.contentHash);
    expect(cli.provenance.entry).toBe('project.prs');
  });

  it('writes files that validate against the published schemas on both sides', async () => {
    for (const outputs of [await viaCli(FILES), await viaBrowser(FILES)]) {
      const index = JSON.parse(outputs.get('prompts/index.json') ?? '');
      expect(validateIndex(index), JSON.stringify(validateIndex.errors)).toBe(true);
      for (const { file } of index.prompts as { file: string }[]) {
        const bundle = JSON.parse(outputs.get(`prompts/${file}`) ?? '');
        expect(validateBundle(bundle), `${file} ${JSON.stringify(validateBundle.errors)}`).toBe(
          true
        );
      }
    }
  });

  it('keeps ${VAR} as text on both sides', async () => {
    for (const outputs of [await viaCli(FILES), await viaBrowser(FILES)]) {
      const bundle = JSON.parse(outputs.get('prompts/refund-reply.json') ?? '') as PromptBundleV1;
      expect(bundle.messages[0]?.content).toContain('Home is ${HOME}.');
    }
  });

  it('escapes slots in composed blocks on both sides', async () => {
    for (const outputs of [await viaCli(FILES), await viaBrowser(FILES)]) {
      const bundle = JSON.parse(outputs.get('prompts/refund-reply.json') ?? '') as PromptBundleV1;
      expect(bundle.messages[0]?.content).toContain('Say \\{{x}} never.');
      expect(bundle.messages[0]?.content).toContain('Answer in the {{input.tone}} tone.');
    }
  });

  it('gives the same bytes when the sources use CRLF', async () => {
    const crlf = Object.fromEntries(
      Object.entries(FILES).map(([path, content]) => [path, content.replace(/\n/g, '\r\n')])
    );

    const lf = await viaBrowser(FILES);
    const converted = await viaCli(crlf);

    expect(converted.get('prompts/refund-reply.json')).toBe(lf.get('prompts/refund-reply.json'));
    expect(converted.get('prompts/index.json')).toBe(lf.get('prompts/index.json'));
  });
});

describe('BrowserCompiler environment guard', () => {
  const fs = (): VirtualFileSystem => new VirtualFileSystem(FILES);

  it.each([['bundle'], ['prompt-text']])('refuses the %s target with envVars set', (name) => {
    expect(
      () => new BrowserCompiler({ fs: fs(), formatters: [name], envVars: { HOME: '/home/ann' } })
    ).toThrow(/cannot compile with envVars set/);
  });

  it('allows a prompt target with no envVars or an empty map', () => {
    expect(() => new BrowserCompiler({ fs: fs(), formatters: ['bundle'] })).not.toThrow();
    expect(
      () => new BrowserCompiler({ fs: fs(), formatters: ['bundle'], envVars: {} })
    ).not.toThrow();
  });

  it('allows envVars with coding targets only', () => {
    expect(
      () => new BrowserCompiler({ fs: fs(), formatters: ['claude'], envVars: { HOME: 'x' } })
    ).not.toThrow();
  });

  it('leaves the prompt targets out of the default formatter set', async () => {
    const result = await new BrowserCompiler({
      fs: fs(),
      envVars: { HOME: '/home/ann' },
    }).compile('project.prs');

    expect([...result.outputs.keys()].filter((path) => path.startsWith('prompts/'))).toEqual([]);
  });
});
