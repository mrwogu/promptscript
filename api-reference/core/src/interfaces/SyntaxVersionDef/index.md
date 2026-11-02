# SyntaxVersionDef

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SyntaxVersionDef

Defined in: [core/src/syntax-versions.ts:30](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/syntax-versions.ts#L30)

Definition of a syntax version's capabilities.
Block lists are cumulative — each version includes all blocks from prior versions.

## Properties

### blocks

> `readonly` **blocks**: readonly `string`[]

Defined in: [core/src/syntax-versions.ts:32](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/syntax-versions.ts#L32)

All block types valid for this version (cumulative, not delta)

***

### features

> `readonly` **features**: readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[]

Defined in: [core/src/syntax-versions.ts:34](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/syntax-versions.ts#L34)

All non-block syntax features valid for this version (cumulative, not delta)