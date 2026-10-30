# parseSample()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseSample()

> **parseSample**(`value`): [`EvalSampleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSampleV1/index.md) \| `undefined`

Defined in: [eval/src/import/sample.ts:121](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/import/sample.ts#L121)

Check one parsed JSONL line against the closed sample schema
(`schema/eval-sample-v1.json`) and copy it. Anything the schema does not list
makes the sample invalid: a `feedback.comment`, an assignment key, a user,
session or trace id, a nested input, an unknown top-level key. The sample is
rebuilt from the listed fields only, so nothing else can ride along.

## Parameters

### value

`unknown`

The parsed line

## Returns

[`EvalSampleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSampleV1/index.md) \| `undefined`

The sample, or undefined when the line breaks the schema or a size limit