# isPromptId()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isPromptId()

> **isPromptId**(`value`): `boolean`

Defined in: [core/src/types/approval.ts:113](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/approval.ts#L113)

Is this the prompt id of an approval record: ASCII only, at least two segments split by a
slash, no segment ending in a dot. It has no limit on the number of segments; the CLI adds
its own depth limit for the record path.

## Parameters

### value

`string`

## Returns

`boolean`