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
| `@promptscript/runtime/otel` | `createPromptTelemetry`, `readPricing`, `anthropicResult`, `openAIChatResult`                   |

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

## Telemetry

`@promptscript/runtime/otel` writes OpenTelemetry spans for model calls. It imports nothing: you
pass your own `@opentelemetry/api` namespace, an optional peer (`>=1.9.0 <2`). An app that never
imports the entry pays no bytes for it.

```typescript
import * as otel from '@opentelemetry/api';
import { readFile } from 'node:fs/promises';
import type { RenderedPrompt } from '@promptscript/runtime';
import {
  anthropicResult,
  createPromptTelemetry,
  readPricing,
  type PromptSpanRef,
} from '@promptscript/runtime/otel';

const pricing = readPricing(await readFile('.promptscript/releases/pricing.json', 'utf8'));
const telemetry = createPromptTelemetry(otel, { pricing });

// Your own server-side store, here a map by session id
const calls = new Map<string, { span: PromptSpanRef; meta: RenderedPrompt['meta'] }>();

// callModel is your own function that sends the request and returns the parsed response
const reply = await telemetry.trace(
  rendered,
  (span) => {
    calls.set(sessionId, { span, meta: rendered.meta });
    return callModel(body);
  },
  anthropicResult
);
```

`trace` returns what `call` returns and rethrows what it throws, the same error object. `call`
gets a `span` ref with `traceId`, `spanId` and `traceFlags`. Keep it on the server next to the
session. When the user rates the answer, record it on a new span under the call span:

```typescript
const call = calls.get(sessionId);
if (call) {
  telemetry.feedback({ span: call.span, name: 'user.thumbs', score: 1, prompt: call.meta });
}
```

A feedback has a name, a score, a label and the prompt meta. It has no free text field: a
`comment` or any other key throws `invalid-feedback`, and a prompt meta whose `id` is not a prompt id
is refused too. An all-zero ref (no SDK registered, or the span could not start) records nothing.

Treat the span ref like a session-bound secret. Keep it on your server with the session and never
accept it from a browser. The runtime checks only its shape, and a forged ref with `traceFlags` 1
forces sampling of a span under any trace id.

The span carries these attributes. A value is written only when it passes a check, and the id,
hash, label and experiment names use the patterns of the loader and of the approval record:

| Attribute                          | Value                                                       |
| :--------------------------------- | :---------------------------------------------------------- |
| `promptscript.prompt.id`           | `meta.id`                                                   |
| `promptscript.prompt.content_hash` | `meta.contentHash`                                          |
| `promptscript.prompt.label`        | `meta.label`, when the prompt came through a label          |
| `promptscript.prompt.stale`        | `true`, only when a cached copy was served                  |
| `promptscript.experiment.name`     | `meta.experiment`, when `get(ref, { key })` assigned an arm |
| `promptscript.experiment.variant`  | `meta.variant`, set together with the experiment            |
| `promptscript.usage.cost_usd`      | estimate at list prices, see below                          |

The `gen_ai.*` attributes (model, provider, parameters, token counts, response id and finish
reasons) follow the OpenTelemetry GenAI conventions, which are still in development.
`genAi: false` turns them off and keeps the `promptscript.*` ones and `error.type`.

The cost is an estimate: tokens times the list price from `pricing.json`. It is written only
when the bundle has a model, the model is in the pricing file and both token counts are known.
Cache writes that a provider bills above list price can make it too low. The `find` method of a
custom pricing object must not throw.

Never recorded: inputs, messages, response text, assignment keys, the source, the load time, error
messages and stack traces. A failed call gets `error.type` and an error status, no message and
no exception event.

A failure of the tracer never changes the call. It goes to `onError` as `telemetry-failed`, with
a fixed message and no cause.

The [`examples/runtime-otel`](https://github.com/mrwogu/promptscript/tree/main/examples/runtime-otel)
example sends these spans and the feedback to Phoenix and Langfuse, and CI checks them there.
Langfuse drops span events, so the feedback score is checked in Phoenix only.

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
