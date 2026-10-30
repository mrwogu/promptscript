# importSamples()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: importSamples()

> **importSamples**(`options`): `Promise`\<[`ImportResult`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ImportResult/index.md)\>

Defined in: [eval/src/import/import.ts:413](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/import/import.ts#L413)

Turn a JSONL file of production samples into dataset rows. Every step runs before
anything is written, and the function writes nothing itself.

A line that breaks the closed sample schema is skipped and counted; its content is
never kept. Inputs the prompt does not declare skip the sample, and so does a sample that
fits the bundle of its hash but not the current prompt. Every string input goes through
`scrubPii`, and the result is checked with `detectPii`: a value that still holds personal
data stops the import with PS6714, so a raw value is never returned. A sample that hides a
value with zero-width characters, fullwidth forms or dots is skipped, and so is one with a
number input that could be a card number. Rows are deduplicated by their scrubbed inputs and
sampled down with a seeded reservoir.

## Parameters

### options

[`ImportSamplesOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ImportSamplesOptions/index.md)

## Returns

`Promise`\<[`ImportResult`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ImportResult/index.md)\>

## Throws

EvalError PS6711 when the file cannot be read, PS6712 over the line limit,
PS6714 when the scrub left personal data