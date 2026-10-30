# @promptscript/runtime

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Loads, verifies and renders the prompt bundles that the `bundle` target of `prs compile` writes.
It has no dependencies and runs on Node.js 22+, Deno, browsers and edge workers.

## Status

The package is not published to npm yet. Its API can still change.

## Entries

| Entry                        | Exports                                                                                         |
| :--------------------------- | :---------------------------------------------------------------------------------------------- |
| `@promptscript/runtime`      | `createPromptClient`, `loadPrompt`, `httpSource`, `toAnthropicMessages`, `toOpenAIChat`, errors |
| `@promptscript/runtime/node` | `directorySource`, the only code that imports `node:` modules                                   |

## How a prompt is resolved

```
client.get('acme-support/refund-reply')
│
├─ label 'prod' ──► prod.json ──► bundles/sha256-<hex>.json ─┐
│                                                             ├─► check $schema, structure,
└─ no label ──────► index.json ─► refund-reply.json ─────────┘    contentHash, pointer
                                                                   │
                                                                   └─► frozen Prompt
```

A reference `id@sha256-<hex>` pins a hash. With a label it reads `bundles/<hash>.json` straight
away; without one the hash must match `index.json`.

## Usage

```typescript
import { createPromptClient, toAnthropicMessages } from '@promptscript/runtime';
import { directorySource } from '@promptscript/runtime/node';

const client = createPromptClient({
  source: directorySource('.promptscript/releases'),
  label: 'prod',
});

const prompt = await client.get('acme-support/refund-reply');
const rendered = prompt.render({ message: 'Where is my refund?' });
const body = toAnthropicMessages(rendered, { maxTokens: 1024 });
```

`loadPrompt(bundle)` checks and freezes a bundle you already hold. `httpSource(baseUrl)` reads
the same files over HTTPS, for example from the raw file URL of a Git branch.

## Experiments

While an entry of a label runs an experiment (`prs release split`), the label is version 2 and
`client.get(ref, { key })` picks an arm by key. The same key always gets the same arm, a read
without a key gets the entry hash, and a pinned ref ignores the experiment. The result has
`meta.experiment` and `meta.variant` when an arm was picked. A key of 1 to 256 characters without
control characters, format characters, U+2028, U+2029 or lone surrogates is hashed and never
kept; anything else throws `invalid-key`. A label of a version newer than this runtime knows fails with
`unsupported-label`, or serves the last verified prompt as stale in open mode. A runtime from before label v2 cannot read the label at all and keeps serving
stale prompts, so upgrade the readers before the first split. The rules and test vectors are in
[`conformance/prompt-release-label/v2`](https://github.com/mrwogu/promptscript/blob/main/conformance/prompt-release-label/v2/README.md).

```typescript
const prompt = await client.get('acme-support/refund-reply', { key: user.id });
prompt.meta.variant; // 'control', or the arm name
```

## Rules

- Every load checks `$schema`, the structure and the `contentHash`. Verification cannot be
  turned off, and unverified content is never served.
- Unknown fields are ignored, so a v1 reader accepts later v1 bundles. `provenance` is neither
  checked nor exposed.
- `render()` inserts values as text in one pass and never scans them again. Numbers render in
  RFC 8785 form, booleans as `true` or `false`. `${VAR}` stays text: the package reads no
  environment.
- A missing input, a wrong type or a value outside the options throws `PromptRenderError`. Extra
  keys are ignored and reported as an `unknown-input` warning.
- Errors and warnings name inputs, files and positions, never values. The package does not log.
- `httpSource` accepts `https` only, refuses redirects, credentials in the URL and loopback,
  link-local or metadata hosts, and limits time and size per file. Host names are not resolved,
  so pin hosts with `allowedHosts` where that matters.
- The client caches pointer files for `cache.ttlMs` (60 s) and verified bundles by hash. In
  `failMode: 'open'` (the default) a failed refresh serves the last verified prompt with
  `meta.stale: true` and calls `onError`; `failMode: 'closed'` throws instead. A label that no
  longer lists a prompt is final in both modes.
- Never pass a ref from an untrusted caller to `client.get()`. With a label, a pinned ref
  reads any bundle that was ever built, also one that was rolled back.
- The mappers return plain request bodies and never override the model or limits of the
  bundle. Newer Anthropic models and API versions reject `temperature`, `top_p` and `top_k`; the
  mapper passes what the bundle sets.

## License

MIT
