# @promptscript/eval

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Eval suites, datasets and assertions for PromptScript prompts. The package is private and not
published to npm. No CLI command uses it yet, and it makes no model calls.

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

  evaluateAssertions ──► equals, contains, regex, json-schema on a response
  createMockProvider ──► scripted answers for tests, no network code
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

## Commands

```bash
pnpm nx build eval
pnpm nx lint eval
pnpm nx test eval
pnpm nx typecheck eval
```
