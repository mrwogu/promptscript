# loadSuites()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: loadSuites()

> **loadSuites**(`options`): `Promise`\<[`LoadSuitesResult`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadSuitesResult/index.md)\>

Defined in: [eval/src/suite/load.ts:216](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/suite/load.ts#L216)

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