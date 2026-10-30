# readLabels()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: readLabels()

> **readLabels**(`file`, `path`, `context`): `Promise`\<[`ReadLabels`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ReadLabels/index.md)\>

Defined in: [eval/src/labels.ts:225](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/labels.ts#L225)

Read human labels of judge assertions from a JSONL, CSV or YAML file, by the
extension of the path as written. Each label has an `id` (the dataset row),
an `assertion` (an llm-judge assertion of the suite), a `verdict` of `pass`
or `fail`, and an optional `note` that is checked and never output. Values
are never interpolated and a parse error names a position, not a value.

## Parameters

### file

`string`

Real path of the label file, as returned by `loadSuites`

### path

`string`

The same path relative to the project, for messages

### context

[`LabelContext`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LabelContext/index.md)

Assertion ids of the suite

## Returns

`Promise`\<[`ReadLabels`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ReadLabels/index.md)\>

Labels by row and assertion, and findings for labels of other assertions

## Throws

EvalError with code PS6603 for an unreadable, oversized or malformed file