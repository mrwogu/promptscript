# createProviderFactory()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createProviderFactory()

> **createProviderFactory**(`options`): [`EvalProviderLookup`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderLookup/index.md)

Defined in: [eval/src/provider-setup.ts:159](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider-setup.ts#L159)

Build the provider lookup of a run from the `eval` config, the environment
and the host flags. `anthropic` and `openai` have built-in URLs and key
variables; other providers need an `eval.providers` entry. Keys are read
from the environment at call time, never from the config. A key value, or
the value of any variable named like a secret, that appears anywhere in the
config refuses the whole run; `secretIn` lets `runEval` run the same check
over the models of each suite. A built-in provider moved to another kind or
host must name its key in `apiKeyEnvVar`. Error echoes leave out every
environment value of 8 or more characters, not only the key.

## Parameters

### options

[`ProviderFactoryOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderFactoryOptions/index.md)

Config, environment, host flags and the use callback

## Returns

[`EvalProviderLookup`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderLookup/index.md)

A lookup that creates each provider once, on first use

## Throws

EvalProviderError `PS6307` when a key value appears in the config