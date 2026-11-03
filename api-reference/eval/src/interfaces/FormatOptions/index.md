# FormatOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatOptions

Defined in: [eval/src/format.ts:21](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/format.ts#L21)

Options of [formatReport](https://getpromptscript.dev/api-reference/eval/src/functions/formatReport/index.md) and [formatComparison](https://getpromptscript.dev/api-reference/eval/src/functions/formatComparison/index.md).

## Properties

### color?

> `optional` **color?**: `boolean`

Defined in: [eval/src/format.ts:23](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/format.ts#L23)

Color the text format; set it only for a terminal

***

### missing?

> `optional` **missing?**: readonly `string`[]

Defined in: [eval/src/format.ts:25](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/format.ts#L25)

Suites or `suite/model` entries the baseline has and the candidate lacks, shown as a visible note