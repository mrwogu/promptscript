import { describe, expect, it } from 'vitest';
import { hashPromptBundle } from '@promptscript/core';
import { isPromptScriptOwnedOutput } from '../output-ownership.js';
import {
  hasPromptBundleSchemaLine,
  isVerifiedPromptBundleOutput,
} from '../prompt-bundle-ownership.js';

const BUNDLE_SCHEMA = 'https://getpromptscript.dev/schema/prompt-bundle/v1.json';
const INDEX_SCHEMA = 'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json';

function bundleFile(change: Record<string, unknown> = {}, eol = '\n'): string {
  const bundle: Record<string, unknown> = {
    $schema: BUNDLE_SCHEMA,
    id: 'acme/reply',
    description: 'Reply',
    messages: [{ role: 'user', content: 'Hello' }],
    inputs: {},
    governance: {},
    provenance: { entry: 'project.prs', segments: [] },
  };
  const withHash: Record<string, unknown> = { ...bundle, contentHash: hashPromptBundle(bundle) };
  const { $schema, id, description, contentHash, ...rest } = { ...withHash, ...change };
  return `${JSON.stringify({ $schema, id, description, contentHash, ...rest }, null, 2)}\n`.replace(
    /\n/g,
    eol
  );
}

describe('hasPromptBundleSchemaLine', () => {
  it('accepts a bundle and an index that start with $schema', () => {
    expect(hasPromptBundleSchemaLine(bundleFile())).toBe(true);
    expect(
      hasPromptBundleSchemaLine(`{\n  "$schema": "${INDEX_SCHEMA}",\n  "prompts": []\n}\n`)
    ).toBe(true);
  });

  it('accepts CRLF line endings and a byte order mark', () => {
    expect(hasPromptBundleSchemaLine(bundleFile({}, '\r\n'))).toBe(true);
    expect(hasPromptBundleSchemaLine(`\uFEFF${bundleFile()}`)).toBe(true);
  });

  it.each([
    ['a file that only quotes the URL', `{\n  "note": "see ${BUNDLE_SCHEMA}"\n}\n`],
    [
      'a $schema that is not the first key',
      `{\n  "id": "x",\n  "$schema": "${BUNDLE_SCHEMA}",\n  "a": 1\n}\n`,
    ],
    [
      'another schema URL',
      `{\n  "$schema": "https://example.com/prompt-bundle/v1.json",\n  "a": 1\n}\n`,
    ],
    [
      'a later schema version',
      `{\n  "$schema": "https://getpromptscript.dev/schema/prompt-bundle/v2.json",\n  "a": 1\n}\n`,
    ],
    ['a $schema without a following key', `{\n  "$schema": "${BUNDLE_SCHEMA}"\n}\n`],
    ['a one-line file', `{"$schema":"${BUNDLE_SCHEMA}","a":1}`],
    ['an empty file', ''],
  ])('rejects %s', (_name, content) => {
    expect(hasPromptBundleSchemaLine(content)).toBe(false);
  });
});

describe('isVerifiedPromptBundleOutput', () => {
  it('accepts a bundle whose hash verifies', () => {
    expect(isVerifiedPromptBundleOutput(bundleFile())).toBe(true);
  });

  it('accepts a bundle with different provenance, which is outside the hash', () => {
    expect(
      isVerifiedPromptBundleOutput(bundleFile({ provenance: { entry: 'other.prs', segments: [] } }))
    ).toBe(true);
  });

  it('accepts an index', () => {
    expect(
      isVerifiedPromptBundleOutput(
        `{\n  "$schema": "${INDEX_SCHEMA}",\n  "source": "p.prs",\n  "prompts": []\n}\n`
      )
    ).toBe(true);
  });

  it.each([
    ['an edited message', bundleFile({ messages: [{ role: 'user', content: 'Edited' }] })],
    ['a wrong hash', bundleFile({ contentHash: `sha256-${'0'.repeat(64)}` })],
    ['no hash', bundleFile({ contentHash: undefined })],
    ['a numeric hash', bundleFile({ contentHash: 7 })],
    ['a value JSON cannot carry in the hash', bundleFile({ inputs: { n: Number.MAX_VALUE * 2 } })],
    ['invalid JSON', `{\n  "$schema": "${BUNDLE_SCHEMA}",\n  "id": `],
    ['an index without a prompt list', `{\n  "$schema": "${INDEX_SCHEMA}",\n  "prompts": 1\n}\n`],
  ])('rejects %s', (_name, content) => {
    expect(isVerifiedPromptBundleOutput(content)).toBe(false);
  });
});

describe('isPromptScriptOwnedOutput for bundle JSON', () => {
  it('treats a bundle file as generated output', () => {
    expect(isPromptScriptOwnedOutput('prompts/reply.json', bundleFile())).toBe(true);
  });

  it('does not claim a user JSON file that quotes the URL', () => {
    const content = `{\n  "docs": "${BUNDLE_SCHEMA}"\n}\n`;

    expect(isPromptScriptOwnedOutput('prompts/notes.json', content)).toBe(false);
  });

  it('does not apply the bundle rule to a file that is not JSON', () => {
    expect(isPromptScriptOwnedOutput('prompts/reply.txt', bundleFile())).toBe(false);
  });
});
