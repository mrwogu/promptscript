# applyMergeOperations()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: applyMergeOperations()

> **applyMergeOperations**(`target`, `plan`): `Record`\<`string`, `unknown`\>

Defined in: [formatters/src/structured-output.ts:49](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/structured-output.ts#L49)

Apply merge operations to a parsed settings object.

- Creates intermediate objects as needed.
- Sets the ownership marker on every created object.
- Preserves unknown keys that were not created by PromptScript.
- When `value` is `undefined`, removes the key only if it was previously
  owned by PromptScript (has the ownership marker).

## Parameters

### target

`Record`\<`string`, `unknown`\>

The parsed existing settings (mutated in place)

### plan

[`StructuredMergePlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergePlan/index.md)

The merge plan to apply

## Returns

`Record`\<`string`, `unknown`\>

The mutated target object