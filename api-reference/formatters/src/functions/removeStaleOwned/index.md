# removeStaleOwned()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: removeStaleOwned()

> **removeStaleOwned**(`target`, `plan`): `void`

Defined in: [formatters/src/structured-output.ts:103](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/structured-output.ts#L103)

Remove previously owned entries that have disappeared from generated output.

Walks the target object and removes any key that has the ownership marker
but is not present in the current plan's operations.

## Parameters

### target

`Record`\<`string`, `unknown`\>

The parsed settings object (mutated in place)

### plan

[`StructuredMergePlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergePlan/index.md)

The current merge plan

## Returns

`void`