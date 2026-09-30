# Lockfile

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Lockfile

Defined in: [core/src/types/lockfile.ts:36](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/lockfile.ts#L36)

PromptScript lockfile (promptscript.lock).
Pins all remote dependencies to exact commits for reproducible builds.

## Properties

### dependencies

> **dependencies**: `Record`\<`string`, [`LockfileDependency`](https://getpromptscript.dev/api-reference/core/src/interfaces/LockfileDependency/index.md)\>

Defined in: [core/src/types/lockfile.ts:40](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/lockfile.ts#L40)

Map of repo URL to locked dependency

***

### references?

> `optional` **references?**: `Record`\<`string`, [`LockfileReference`](https://getpromptscript.dev/api-reference/core/src/interfaces/LockfileReference/index.md)\>

Defined in: [core/src/types/lockfile.ts:42](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/lockfile.ts#L42)

Map of reference key to integrity hash (optional, for registry reference files)

***

### version

> **version**: `number`

Defined in: [core/src/types/lockfile.ts:38](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/lockfile.ts#L38)

Lockfile format version. Use type guard `isValidLockfile()` after parsing.