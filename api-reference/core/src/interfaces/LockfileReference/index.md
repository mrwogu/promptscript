# LockfileReference

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: LockfileReference

Defined in: [core/src/types/lockfile.ts:25](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/lockfile.ts#L25)

A locked reference file from a registry.
Key format in lockfile: `<repoUrl>\0<relativePath>\0<version>`

## Properties

### hash

> **hash**: `string`

Defined in: [core/src/types/lockfile.ts:27](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/lockfile.ts#L27)

Content integrity hash in SRI format: "sha256-<hex>"

***

### lockedAt

> **lockedAt**: `string`

Defined in: [core/src/types/lockfile.ts:29](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/lockfile.ts#L29)

ISO timestamp of when prs lock recorded this hash