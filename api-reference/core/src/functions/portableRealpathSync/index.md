# portableRealpathSync()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: portableRealpathSync()

> **portableRealpathSync**(`path`): `string`

Defined in: [core/src/utils/realpath.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/realpath.ts#L16)

realpathSync that works across runtimes. Node exposes the faster
realpathSync.native binding, but Deno only implements realpathSync, so the
native path is probed and used only where it exists. Results are identical
on both runtimes.

## Parameters

### path

`string`

Absolute or relative path to resolve

## Returns

`string`

The fully resolved canonical path