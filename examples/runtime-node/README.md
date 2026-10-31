# Runtime example for Node.js

This example renders the prompt that the `prod` label points at, with `@promptscript/runtime`.
It prints the request body for the Anthropic Messages API. It makes no API call and needs no key.

## Files

| Path                                            | What it is                                                                                         |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `.promptscript/`                                | The PromptScript source, one prompt: `acme-support/refund-reply`                                   |
| `promptscript.yaml`                             | Project config with two environments, `staging` and `prod`                                         |
| `.promptscript/releases`                        | The release the CLI built: `manifest.json`, `pricing.json`, the bundle and one label each          |
| `.promptscript/evals`                           | One eval suite for the prompt, `refund-reply.eval.yaml`, and its four-row dataset                  |
| `.promptscript/eval-cache`                      | Recorded model answers of that suite, written by a test from a scripted mock provider, no API call |
| `.promptscript/eval-reports/prod-baseline.json` | The report of the suite on the `prod` label, written by the same test                              |
| `index.mjs`                                     | Loads the `prod` label, renders the prompt with sample inputs, prints JSON                         |
| `expected-output.json`                          | What `index.mjs` prints                                                                            |

The release files were made with these commands, run from the repository root as CI does:

```bash
pnpm prs release build --cwd examples/runtime-node
pnpm prs release promote acme-support/refund-reply --to staging --cwd examples/runtime-node
pnpm prs release promote acme-support/refund-reply --to prod --cwd examples/runtime-node
```

## Run it

`@promptscript/runtime` is not published to npm. The example depends on the workspace build in
`dist/packages/runtime`, so build it first. From the repository root:

```bash
pnpm nx build runtime
cd examples/runtime-node
npm install
node index.mjs
```

CI does the same with a packed tarball of that build: it installs the tarball into a copy of this
directory without the registry, runs it and compares the output with `expected-output.json`. It
also runs `prs release build` here and fails when the committed release files are not what the
CLI builds.

## Drift check

`examples/workflows/prompt-drift.yml` is a weekly GitHub Actions workflow that runs eval suites
against the `prod` label with live model calls. CI replays its commands on this example from the
recorded cache, with no key and with `fetch` blocked, so the recipe and the cache stay in sync.
When a change here makes the cache or the baseline stale, review the diff and regenerate them with:

```bash
UPDATE_DRIFT_EXAMPLE=true pnpm exec vitest run --config packages/cli/vitest.config.mts prompt-drift-recipe
```
