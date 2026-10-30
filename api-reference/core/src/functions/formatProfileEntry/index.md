# formatProfileEntry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatProfileEntry()

> **formatProfileEntry**(`candidate`, `pricesCheckedOn`): `string`

Defined in: [core/src/model-drift.ts:315](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-drift.ts#L315)

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