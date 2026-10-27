# normalizeOutputCollisionKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeOutputCollisionKey()

> **normalizeOutputCollisionKey**(`path`): `string`

Defined in: [core/src/output-plan.ts:186](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/output-plan.ts#L186)

Return the stable key used to detect files that cannot coexist on common
project filesystems.

Collision keys use NFC normalization and locale-independent case folding
for every host. Keeping the plan conservative on case-sensitive hosts makes
Node and browser consumers produce the same plan before a filesystem exists.

## Parameters

### path

`string`

## Returns

`string`