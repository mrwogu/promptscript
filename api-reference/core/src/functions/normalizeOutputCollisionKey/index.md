# normalizeOutputCollisionKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeOutputCollisionKey()

> **normalizeOutputCollisionKey**(`path`): `string`

Defined in: [core/src/output-plan.ts:165](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L165)

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