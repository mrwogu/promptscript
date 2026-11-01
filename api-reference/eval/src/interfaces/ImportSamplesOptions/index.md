# ImportSamplesOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ImportSamplesOptions

Defined in: [eval/src/import/import.ts:34](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L34)

Options of [importSamples](https://getpromptscript.dev/api-reference/eval/src/functions/importSamples/index.md).

## Properties

### allowedPatterns?

> `optional` **allowedPatterns?**: readonly `string`[]

Defined in: [eval/src/import/import.ts:64](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L64)

`validation.allowedPatterns` of the project, for the scan

***

### contractFor

> **contractFor**: (`contentHash`) => [`ImportContract`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/ImportContract/index.md)

Defined in: [eval/src/import/import.ts:43](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L43)

The contract a sample's inputs must fit: the verified bundle of its content hash when
there is one, else the current compile. Called with `undefined` for a sample without a hash.

#### Parameters

##### contentHash

`string` \| `undefined`

#### Returns

[`ImportContract`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/ImportContract/index.md)

***

### current

> **current**: [`ImportContract`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/ImportContract/index.md)

Defined in: [eval/src/import/import.ts:48](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L48)

The contract of the current compile. A row is written only when its inputs fit this one
too, because `prs eval run` checks rows against it.

***

### expectedFromOutput?

> `optional` **expectedFromOutput?**: `boolean`

Defined in: [eval/src/import/import.ts:62](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L62)

Copy the scrubbed output as `expected`

***

### file

> **file**: `string`

Defined in: [eval/src/import/import.ts:36](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L36)

Real path of the sample file

***

### labels?

> `optional` **labels?**: readonly `string`[]

Defined in: [eval/src/import/import.ts:58](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L58)

Keep only samples with one of these feedback labels

***

### maxRows

> **maxRows**: `number`

Defined in: [eval/src/import/import.ts:52](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L52)

Largest number of rows kept

***

### maxScore?

> `optional` **maxScore?**: `number`

Defined in: [eval/src/import/import.ts:56](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L56)

Keep only samples with a feedback score at or below this

***

### outFile

> **outFile**: `string`

Defined in: [eval/src/import/import.ts:50](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L50)

Dataset path relative to the project root, for the findings

***

### prompt

> **prompt**: `string`

Defined in: [eval/src/import/import.ts:38](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L38)

Prompt id of the suite; samples of other prompts are left out

***

### redactInputs?

> `optional` **redactInputs?**: readonly `string`[]

Defined in: [eval/src/import/import.ts:60](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L60)

Names of string inputs replaced by `[redacted]`

***

### seed

> **seed**: `number`

Defined in: [eval/src/import/import.ts:54](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/import/import.ts#L54)

Seed of the reservoir sampling