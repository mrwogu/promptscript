# JSON Output

Some `prs` commands print a JSON document with `--format json`. This page says which of them you
can build on, and what the rules are.

## Stable commands

The output of these commands is a contract. Each one has a JSON Schema in the
[`schema/`](https://github.com/mrwogu/promptscript/tree/main/schema) directory, and a test runs every
command and checks stdout against its schema.

| Command                                                                                  | Schema `$id`                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`prs diff`](https://getpromptscript.dev/reference/cli/index.md#prs-diff)                                                            | `https://getpromptscript.dev/schema/diff/v1.json`            |
| [`prs release`](https://getpromptscript.dev/reference/cli/index.md#prs-release) `build`, `promote`, `rollback`, `split` and `status` | `https://getpromptscript.dev/schema/release-report/v1.json`  |
| [`prs approve`](https://getpromptscript.dev/reference/cli/index.md#prs-approve)                                                      | `https://getpromptscript.dev/schema/approval-report/v1.json` |
| [`prs audit log`](https://getpromptscript.dev/reference/cli/index.md#prs-audit-log)                                                  | `https://getpromptscript.dev/schema/audit-log/v1.json`       |
| [`prs eval run`](https://getpromptscript.dev/reference/cli/index.md#prs-eval-run)                                                    | `https://getpromptscript.dev/schema/eval-report/v1.json`     |
| [`prs eval compare`](https://getpromptscript.dev/reference/cli/index.md#prs-eval-compare)                                            | `https://getpromptscript.dev/schema/eval-comparison/v1.json` |
| [`prs validate`](https://getpromptscript.dev/reference/cli/index.md#prs-validate)                                                    | `https://getpromptscript.dev/schema/validate-report/v1.json` |

## Experimental

`--format json` of every other command is experimental, and its output may change in any minor
release. This covers `prs inspect`, `prs explain`, `prs resolve`,
`prs registry validate`, `prs registry list` and `prs governance codeowners`. `prs eval import` has
a schema (`eval-import-summary/v1.json`), but it is not declared stable either.

## stdout and stderr

For the stable commands, with `--format json`, stdout holds exactly one JSON document and nothing else. Spinners, progress,
warnings, verbose and debug lines, the update notice and the human text go to stderr. That holds with
`--verbose`, `--debug` and `PROMPTSCRIPT_VERBOSE=1` too, so this works:

```bash
prs release status --format json --verbose 2> status.log | jq .success
```

Warnings and errors that belong to the report, like the `warnings` and `errors` arrays of a release
report, are only in the JSON document. In JSON mode they are not printed to stderr as well, so read
them from the document.

When a stable command fails, the document is still printed. It has `success: false`, or for
`prs eval run` an `outcome` other than `passed`. Do not read the shape of the document from the exit
code alone: `prs eval compare --fail-on-regression` exits 1 with `regression: true` in a normal
comparison, and `prs eval run --strict` exits 2 with `outcome: "passed"` when there are warnings. There are four cases with nothing on stdout, only a
message on stderr and exit code 1:

- any error of `prs eval compare`, also a bad `--tolerance` value, because a comparison has no place for errors,
- `prs validate --fix` together with `--format json`, which is refused before anything runs,
- a usage error of Commander, like an unknown option,
- a `--format` value the command does not know.

## Version marker

A document starts with `$schema` and `version`. The schema URL carries the major version, and
`version` repeats it as a number.

```json
{
  "$schema": "https://getpromptscript.dev/schema/release-report/v1.json",
  "version": 1
}
```

Eval reports and comparisons written by older CLI versions have only `$schema`. Read a missing
`version` as 1. A comparison inside an eval report has neither field.

## Exit codes

| Command                                                       | 0                                           | 1                                                                                              | Other                                                   |
| ------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `prs diff`                                                    | Report written, also when it has changes    | `success: false`: a compile or report error                                                    | -                                                       |
| `prs release build`, `promote`, `rollback`, `split`, `status` | `success: true`, also a no-op or a dry run  | `success: false`, also a failed gate of `status --base`                                        | -                                                       |
| `prs approve`                                                 | Record written or listed                    | Any other error                                                                                | 2: the record exists already (`PS5105`)                 |
| `prs audit log`                                               | Log read                                    | Error                                                                                          | -                                                       |
| `prs eval run`                                                | `passed`                                    | `failed`, `regression`, `budget-exceeded` or `error` (a bad option is `PS6309`, still as JSON) | 2: `passed` with warnings under `--strict`. 130: Ctrl+C |
| `prs eval compare`                                            | Compared, also when something regressed     | A regression with `--fail-on-regression`, or any error (no JSON)                               | -                                                       |
| `prs validate`                                                | No errors, and no warnings under `--strict` | `success: false`: errors, warnings under `--strict`, or any error before the compile           | -                                                       |

## Schema versioning

- The file name and the `$id` carry the major version.
- A v1 schema only gains optional properties.
- A change that breaks readers goes into a new `-v2` file with a new `$id`, and the old file stays.
  This is the convention, like `prompt-release-label-v1` and `-v2`.
- `pnpm api:breaking` runs on every pull request and compares the schemas of these commands with the
  base branch. It fails on a removed property, a property that is no longer required, a narrowed
  type, a removed enum value, a changed `const`, a new enum on a free value, or `additionalProperties`
  that becomes stricter. It does not fail on a new required property or a widened type. A pull
  request marked as breaking (`!` in the commit subject that lands on `main`, or a
  `BREAKING CHANGE:` line in a commit message) passes. The check does not
  look for a `-v2` file.
- Schemas are closed (`additionalProperties: false`). Validate a document with the schema of the CLI
  version that wrote it, or a newer one, and let your reader ignore properties it does not know.

## Text output

The default text output is for people. It can change in any release, so do not parse it.