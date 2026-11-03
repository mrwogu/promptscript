# LoadSuitesResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: LoadSuitesResult

Defined in: [eval/src/suite/load.ts:34](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/suite/load.ts#L34)

Suites that loaded and the problems of those that did not.

## Properties

### findings

> **findings**: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/suite/load.ts:38](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/suite/load.ts#L38)

Errors, reported together so one run shows every broken suite

***

### suites

> **suites**: [`LoadedSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadedSuite/index.md)[]

Defined in: [eval/src/suite/load.ts:36](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/suite/load.ts#L36)

Valid suites sorted by name