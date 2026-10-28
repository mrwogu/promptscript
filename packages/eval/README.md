# @promptscript/eval

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Eval suites, datasets, assertions and the runner for PromptScript prompts. The package is private
and not published to npm. `prs eval run` and `prs eval compare` in `@promptscript/cli` use it; see
the [CLI reference](https://getpromptscript.dev/reference/cli/#prs-eval).

## What it does

```
.promptscript/evals/refund.eval.yaml
        │
        ▼
  loadSuites ──────► structure, file names, dataset and label paths
        │            PS6200-PS6202
        ▼
  checkSuites ─────► prompt id, fields, schemas, models, prices
        │            PS6203-PS6206, PS6210, PS6213, PS6501
        │            (the compiled bundles and the model catalog come in)
        ▼
  readDataset ─────► JSONL, CSV or YAML rows, ids, size and row limits
        │            PS6101-PS6104, PS6106
        ├─► checkDatasetRow   inputs and expected against the contract
        │                     PS6104, PS6105
        └─► scanDatasetRow    validator security rules and PII
                              PS6110-PS6114

  runEval ─────► all of the above for every suite, then the cache lookups and
        │        the budget plan; any error stops here, before any call
        ▼
  each case ──► cache hit, or a provider call with a reservation and retries
        │
        ▼
  evaluateAssertions ──► equals, contains, regex, json-schema on the response
        │
        ▼
  EvalReportV1 (schema/eval-report-v1.json)
```

## Suites

A suite is a standalone file under `.promptscript/evals/`: `<name>.eval.yaml`, `.eval.yml` or
`.eval.json`. The name uses lowercase letters, digits and dashes. Its shape is `EvalSuiteV1` from
`@promptscript/core`, with the schema in `schema/eval-suite-v1.json`. Unknown keys are errors.
A suite file is at most 1 MiB of UTF-8. JSON suites are read with `JSON.parse`, so comments and
single quotes are errors, and a repeated key is an error in both formats.

Dataset and label paths are relative to the suite file. Absolute paths, drive letters, UNC
prefixes, NUL bytes and anything whose real path leaves the project are refused, symlinks,
dangling symlinks and link loops included. The loader returns the real path, and the readers open
that path. The format comes from the extension of the path as written in the suite.

## Datasets

| Format | Rules                                                                                                                                                                |
| :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSONL  | One row per line, read as a stream. A line over 1 MiB is refused before it is buffered, and so is a file with more than twice the row limit plus 1000 lines.         |
| CSV    | RFC 4180. Columns `id`, `tags` (split on `\|`), `expected`, `expected.<field>`, `input.<name>`. Cells are coerced by the prompt's input and output types. 5 MiB cap. |
| YAML   | A top-level list. At most 20 aliases, no tags. 5 MiB cap.                                                                                                            |

Every format: at most 1000 rows by default, 64 KiB per string value, unique ids matching
`^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$`, `row-<n>` when a row has no id. Rows are built on
null-prototype objects and a prototype name as a key is refused. Input and `expected` keys follow
the key rule of the bundle schema. Values are never interpolated, so `${HOME}` stays `${HOME}`.

## Dataset scan

Each string value of `inputs` and `expected` runs through the validator rules PS005, PS010,
PS011, PS012 and PS014, one synthetic program per value. Only `validation.allowedPatterns` of the
project applies. A finding names the rule, row id, JSON path and line, never the rule message or
the value. A suite downgrades a rule with `dataset.allow: [{ rule, reason }]`.

Three PII detectors report warnings: email (PS6112), card numbers with a Luhn check (PS6113) and
IBANs of 30 European countries with the mod-97 check (PS6114). `dataset.allowPii: { reason }`
records that personal data is expected.

## Assertions

| Kind          | Passes when                                                                      |
| :------------ | :------------------------------------------------------------------------------- |
| `equals`      | the target equals `value`, else the row's `expected`, trimmed and NFC-normalized |
| `contains`    | the target contains all values, or any with `mode: any`                          |
| `regex`       | the pattern matches; a target over 64 KiB fails instead of running               |
| `json-schema` | Ajv in strict mode accepts the parsed response; no remote `$ref`                 |

`field` reads one property of the response parsed as JSON (trimmed, one fenced block unwrapped,
own properties only). `regex` patterns and the `pattern` keywords of schemas share a 1 second
budget per assertion, and an assertion that runs out fails the case. Reasons are at most 160
characters and quote at most 60 characters of the actual value.

## Runs

`runEval` renders every row with `@promptscript/runtime` before any call; a row the renderer
refuses is a setup error. It never reads the environment and never prints: the caller passes the
providers, the cache mode and the budget, and gets the report back. A failed case never throws; it
becomes a case with status `error`. `llm-judge` assertions are refused (PS6600). A run with no
case is an error too, and so is a budget, concurrency, row limit or output cap that is not a plain
number (PS6504, PS6309), reported together with the suite check errors.

| Cache mode | Hit     | Miss                                      |
| :--------- | :------ | :---------------------------------------- |
| `replay`   | used    | case error PS6402; no provider, ever      |
| `record`   | used    | call, then write the entry                |
| `refresh`  | ignored | every case calls and overwrites its entry |
| `off`      | ignored | call, write nothing                       |

Entries live at `<cache dir>/<first 2 hex>/<key>.json`. The key is the SHA-256 of the canonical
JSON of the request: bundle hash, inputs hash after defaults, model reference, provider, API id,
effective params with the output cap, and the sample index. Every mode but `off` reads the tree
before any call, `refresh` too, and reads go through `lstat`, so a symlink or another file type in
the tree is PS6403. An entry that is too big, broken, has a token count over 1e9 or does not match
its key is a miss with a PS6401 warning. Any other read or write error stops the run (PS6404).
Writes are atomic, and an entry over the 1 MiB read cap is not written (PS6405). Rows with the same
key share one call; the later ones count as replayed, with `off` too. `costUsd` is counted per
case, replayed ones included, while `budget.spentUsd` is what the run paid. To tell whether a run
called a provider, read `cache.mode` and `cache.live`, not `replayed === 0`. The digest hashes the raw bytes of every
entry the run used; with `off` it hashes the entries as they would have been written.

Every mode that calls a provider needs a budget (PS6504) and a price for every model (PS6501). A
project price may raise a built-in one, never lower it (PS6505). Before any call the plan counts
each miss at its worst case: every UTF-8 byte of the messages and of the output schema as an input
token, 16 tokens per message, plus the whole output cap. A plan over the budget is refused
(PS6503). The built-in price is checked for the model reference and for the API id the call goes
to, so a profile cannot point a cheap name at a dearer model. A snapshot id such as `x-20261001`,
`x-2026-10-01`, `x-0806` or `x-latest` is checked as `x` too; a gateway id such as `vendor/model` matches
no built-in price. During the run each call reserves its
worst case; the actual cost replaces it after a success, a refused call (400, 401, 403, 404, 413, 429) gives it back, and any other failure keeps it as spent. 429, 500, 502, 503 and 529 are tried
again at most twice, with `retry-after` up to 30 seconds. A slow regex fails fast on later cases
once it ran out of time.

## Reports

`runEvalDetailed` gives the report of the whole run and one report per suite, each built from its own
cases with its own outcome, cache summary and digest, for a report directory. `planEval` is a run
that stops before any call: the same checks, the cache lookups, and per suite and model entry the
hits, misses, calls, price source and worst-case cost. It creates no provider.

`formatReport` prints a report as `text`, `json`, `markdown` or `junit`. Every string is normalized
first in all four: CR and LF become a space, control and bidi characters are removed. Markdown shows
model text only inside code spans, with a fence one backtick longer than the longest run inside, and
JUnit is XML 1.0 safe. `compareReports` matches suites by name, models by `ref` and cases by id;
`readReport` checks a report file before a comparison reads it (PS6701).

## Providers

`createAnthropicProvider` and `createOpenAICompatibleProvider` build the body with the runtime
mappers and add the URL, fixed headers and the transport rules: https to `api.anthropic.com`,
`api.openai.com` or a host passed in `allowedHosts`; private, link-local and metadata hosts are
refused either way, and `allowLocal` allows loopback over http. No redirects, a time limit over
the whole exchange and a 4 MiB body cap. A 4xx message is echoed in at most 200 characters,
without the key, the values in `secrets`, bearer tokens, control or bidi characters; the key is also taken out of the
text and stop reason of an answer.

`createProviderFactory` builds them from the `eval` config and an environment: `anthropic` and
`openai` have built-in URLs and key variables, other providers need an `eval.providers` entry with
`kind`, `baseUrl` and `apiKeyEnvVar` only (PS6301, PS6303). Keys are read at call time; a missing
variable is PS6306. The run is refused (PS6307) when the config holds the value of a key variable
or of any variable of 8 or more characters named like a secret (`KEY`, `TOKEN`, `SECRET`,
`PASSWORD`, `CREDENTIAL`), a `${VAR}` in `baseUrl` included. `anthropic` or `openai` moved to
another kind or host must name its key in `apiKeyEnvVar` (PS6303). The config decides which
variable goes to which allowed host, so `apiKeyEnvVar` can send any variable: review the config
like code. Every environment value of 8 or more characters is left out of error echoes, and
`secretIn` on the lookup lets `runEval` run the PS6307 check over the models of every suite, so a
`${VAR}` in a model profile stops the run too, replay included. `onUse` reports the provider, variable and host of each provider before its first call.
`createMockProvider` gives scripted answers for tests, with no network code.

## Commands

```bash
pnpm nx build eval
pnpm nx lint eval
pnpm nx test eval
pnpm nx typecheck eval
```
