# SyntaxVersionDef

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SyntaxVersionDef

Defined in: [core/src/syntax-versions.ts:29](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/syntax-versions.ts#L29)

Definition of a syntax version's capabilities.
Block lists are cumulative — each version includes all blocks from prior versions.

## Properties

### blocks

> `readonly` **blocks**: readonly `string`[]

Defined in: [core/src/syntax-versions.ts:31](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/syntax-versions.ts#L31)

All block types valid for this version (cumulative, not delta)

***

### features

> `readonly` **features**: readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[]

Defined in: [core/src/syntax-versions.ts:33](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/syntax-versions.ts#L33)

All non-block syntax features valid for this version (cumulative, not delta)