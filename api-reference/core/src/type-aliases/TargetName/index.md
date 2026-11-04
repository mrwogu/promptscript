# TargetName

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetName

> **TargetName** = [`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md) \| [`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

Defined in: [core/src/types/config.ts:890](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L890)

Supported output targets.
Includes all known built-in targets plus custom targets registered via `registerFormatter`.

- Use `KnownTarget` when you need exhaustiveness checks in switch/if-else.
- Use `TargetName` when you need to accept both known and custom targets.
- Use `isKnownTarget()` to narrow a `TargetName` to `KnownTarget` at runtime.
- Use `customTarget()` to create a `CustomTarget` from a plain string.