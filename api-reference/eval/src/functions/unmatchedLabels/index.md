# unmatchedLabels()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: unmatchedLabels()

> **unmatchedLabels**(`labels`, `rowIds`, `suiteFile`): [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/labels.ts:259](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/labels.ts#L259)

Warn about labels whose row the run did not read, as one finding: rows can
be cut by the row limit or removed from the dataset, so it is no error.

## Parameters

### labels

`ReadonlyMap`\<`string`, `unknown`\>

Labels from [readLabels](https://getpromptscript.dev/api-reference/eval/src/functions/readLabels/index.md)

### rowIds

`ReadonlySet`\<`string`\>

Ids of the rows the run read

### suiteFile

`string`

Suite file, for the message

## Returns

[`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

One warning, or nothing when every label has its row