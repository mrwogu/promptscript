# Eval API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# eval/src

Eval suites, datasets and assertions for PromptScript prompts.

Loads suite files from `.promptscript/evals/`, reads and checks their
datasets, scans dataset values with the validator's security rules and PII
detectors, and checks responses with deterministic assertions.

## Classes

- [EvalDatasetError](https://getpromptscript.dev/api-reference/eval/src/classes/EvalDatasetError/index.md)
- [EvalError](https://getpromptscript.dev/api-reference/eval/src/classes/EvalError/index.md)
- [EvalProviderError](https://getpromptscript.dev/api-reference/eval/src/classes/EvalProviderError/index.md)

## Interfaces

- [AssertionContext](https://getpromptscript.dev/api-reference/eval/src/interfaces/AssertionContext/index.md)
- [CheckContext](https://getpromptscript.dev/api-reference/eval/src/interfaces/CheckContext/index.md)
- [DatasetCheckContext](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetCheckContext/index.md)
- [DatasetRecord](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetRecord/index.md)
- [EvalFinding](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)
- [EvalProviderContext](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderContext/index.md)
- [EvalProviderLookup](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderLookup/index.md)
- [EvalRequest](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalRequest/index.md)
- [LoadedSuite](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadedSuite/index.md)
- [LoadSuitesOptions](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadSuitesOptions/index.md)
- [LoadSuitesResult](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadSuitesResult/index.md)
- [MockCall](https://getpromptscript.dev/api-reference/eval/src/interfaces/MockCall/index.md)
- [ProviderConfig](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderConfig/index.md)
- [ProviderDeps](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderDeps/index.md)
- [ProviderFactoryOptions](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderFactoryOptions/index.md)
- [ProviderUse](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderUse/index.md)
- [ReadDatasetOptions](https://getpromptscript.dev/api-reference/eval/src/interfaces/ReadDatasetOptions/index.md)
- [RunEvalOptions](https://getpromptscript.dev/api-reference/eval/src/interfaces/RunEvalOptions/index.md)
- [ScanOptions](https://getpromptscript.dev/api-reference/eval/src/interfaces/ScanOptions/index.md)

## Type Aliases

- [DeterministicAssertion](https://getpromptscript.dev/api-reference/eval/src/type-aliases/DeterministicAssertion/index.md)
- [EvalCode](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)
- [EvalProgress](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProgress/index.md)
- [EvalProvider](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)
- [EvalResponse](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md)
- [MockAnswer](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)
- [MockProvider](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockProvider/index.md)
- [MockScript](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockScript/index.md)

## Variables

- [DEFAULT\_PROVIDER\_HOSTS](https://getpromptscript.dev/api-reference/eval/src/variables/DEFAULT_PROVIDER_HOSTS/index.md)
- [EVAL\_CODES](https://getpromptscript.dev/api-reference/eval/src/variables/EVAL_CODES/index.md)

## Functions

- [checkDatasetRow](https://getpromptscript.dev/api-reference/eval/src/functions/checkDatasetRow/index.md)
- [checkSuites](https://getpromptscript.dev/api-reference/eval/src/functions/checkSuites/index.md)
- [createAnthropicProvider](https://getpromptscript.dev/api-reference/eval/src/functions/createAnthropicProvider/index.md)
- [createMockProvider](https://getpromptscript.dev/api-reference/eval/src/functions/createMockProvider/index.md)
- [createOpenAICompatibleProvider](https://getpromptscript.dev/api-reference/eval/src/functions/createOpenAICompatibleProvider/index.md)
- [createProviderFactory](https://getpromptscript.dev/api-reference/eval/src/functions/createProviderFactory/index.md)
- [evaluateAssertions](https://getpromptscript.dev/api-reference/eval/src/functions/evaluateAssertions/index.md)
- [loadSuites](https://getpromptscript.dev/api-reference/eval/src/functions/loadSuites/index.md)
- [readDataset](https://getpromptscript.dev/api-reference/eval/src/functions/readDataset/index.md)
- [refuseProviderUrl](https://getpromptscript.dev/api-reference/eval/src/functions/refuseProviderUrl/index.md)
- [resolveProjectPath](https://getpromptscript.dev/api-reference/eval/src/functions/resolveProjectPath/index.md)
- [runEval](https://getpromptscript.dev/api-reference/eval/src/functions/runEval/index.md)
- [scanDatasetRow](https://getpromptscript.dev/api-reference/eval/src/functions/scanDatasetRow/index.md)