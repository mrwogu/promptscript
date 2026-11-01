# displacedProfile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: displacedProfile()

> **displacedProfile**(`candidate`, `profiles`): [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`

Defined in: [core/src/model-drift.ts:296](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L296)

The catalog entry a candidate displaces: the current release of its
family that carries no successor yet.

## Parameters

### candidate

[`ModelDriftCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftCandidate/index.md)

### profiles

readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[]

## Returns

[`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md) \| `undefined`