# loadSuites()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: loadSuites()

> **loadSuites**(`options`): `Promise`\<[`LoadSuitesResult`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadSuitesResult/index.md)\>

Defined in: [eval/src/suite/load.ts:216](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/suite/load.ts#L216)

Load the suite files under `.promptscript/evals/`: `<name>.eval.yaml`,
`.eval.yml` or `.eval.json`, with a lowercase name. Each file is parsed
with an alias cap and no tags, checked for structure, and its dataset and
label paths are resolved inside the project. Suite files never
interpolate `${VAR}`.

## Parameters

### options

[`LoadSuitesOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadSuitesOptions/index.md)

Project root and the suite names to load

## Returns

`Promise`\<[`LoadSuitesResult`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadSuitesResult/index.md)\>

Valid suites sorted by name and the findings of the rest