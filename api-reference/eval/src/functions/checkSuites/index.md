# checkSuites()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkSuites()

> **checkSuites**(`suites`, `context`): [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/suite/check.ts:256](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/check.ts#L256)

Check loaded suites against the compiled prompts and the model catalog:
the prompt exists (else the five nearest ids), fields are declared output
properties, `json-schema` has a schema that compiles, every model in
`models` resolves and is not retired, cost thresholds have a price for
every model the suite runs, regexes do not nest quantifiers, and a dataset
`allow` comes with a deterministic assertion. Judge models are not checked:
`llm-judge` assertions get only the structure and field checks.

## Parameters

### suites

readonly [`LoadedSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadedSuite/index.md)[]

Suites from `loadSuites`

### context

[`CheckContext`](https://getpromptscript.dev/api-reference/eval/src/interfaces/CheckContext/index.md)

Compiled bundles and the model catalog

## Returns

[`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Findings of every suite; errors stop a run before any call