# displacedProfile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: displacedProfile()

> **displacedProfile**(`candidate`, `profiles`): [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

Defined in: [core/src/model-drift.ts:271](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L271)

The catalog entry a candidate displaces: the current release of its
family that carries no successor yet.

## Parameters

### candidate

[`ModelDriftCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftCandidate/index.md)

### profiles

readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[]

## Returns

[`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`