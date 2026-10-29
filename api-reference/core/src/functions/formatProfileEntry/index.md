# formatProfileEntry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatProfileEntry()

> **formatProfileEntry**(`candidate`, `pricesCheckedOn`): `string`

Defined in: [core/src/model-drift.ts:315](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-drift.ts#L315)

Draft text for model-profiles.ts: the helper call for one candidate,
with the fields OpenRouter knows about. A price is dated with the day
of the run, `pricesCheckedOn`, for a human to verify against the
provider page.

## Parameters

### candidate

[`ModelDriftCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftCandidate/index.md)

### pricesCheckedOn

`string`

## Returns

`string`