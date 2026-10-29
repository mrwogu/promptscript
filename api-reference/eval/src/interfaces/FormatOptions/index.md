# FormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatOptions

Defined in: [eval/src/format.ts:20](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/format.ts#L20)

Options of [formatReport](https://getpromptscript.dev/api-reference/eval/src/functions/formatReport/index.md) and [formatComparison](https://getpromptscript.dev/api-reference/eval/src/functions/formatComparison/index.md).

## Properties

### color?

> `optional` **color?**: `boolean`

Defined in: [eval/src/format.ts:22](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/format.ts#L22)

Color the text format; set it only for a terminal

***

### missing?

> `optional` **missing?**: readonly `string`[]

Defined in: [eval/src/format.ts:24](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/format.ts#L24)

Suites or `suite/model` entries the baseline has and the candidate lacks, shown as a visible note