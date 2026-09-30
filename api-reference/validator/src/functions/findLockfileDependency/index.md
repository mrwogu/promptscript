# findLockfileDependency()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findLockfileDependency()

> **findLockfileDependency**(`importSource`, `lockfile`): [`ResolvedImportDependency`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ResolvedImportDependency/index.md) \| `undefined`

Defined in: [validator/src/import-exclusions.ts:184](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/import-exclusions.ts#L184)

Resolve an exclude's import source against lockfile dependency keys.

Exact normalized match first; otherwise the longest lockfile key that is a
path prefix, so an exclude declared with a sub-path (`org/repo/skills/foo`)
still binds to its repository pin (`org/repo`).

## Parameters

### importSource

`string`

### lockfile

[`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

## Returns

[`ResolvedImportDependency`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ResolvedImportDependency/index.md) \| `undefined`