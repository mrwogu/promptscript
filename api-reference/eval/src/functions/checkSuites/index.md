# checkSuites()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkSuites()

> **checkSuites**(`suites`, `context`): [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/suite/check.ts:211](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/suite/check.ts#L211)

Check loaded suites against the compiled prompts and the model catalog:
the prompt exists (else the five nearest ids), fields are declared output
properties, `json-schema` has a schema that compiles, every model in
`models` resolves and is not retired, cost thresholds have a price for
every model the suite runs, regexes do not nest quantifiers, and a dataset
`allow` comes with a deterministic assertion. Each `llm-judge` assertion
needs a rubric prompt that fits the judge call (inputs, slots, output) and a
judge model that resolves.

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