# ReservedParamsResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReservedParamsResult

Defined in: [resolver/src/imports.ts:58](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/imports.ts#L58)

Result of extracting reserved parameters from

## Use

arguments.

## Properties

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [resolver/src/imports.ts:62](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/imports.ts#L62)

Block names to exclude (mutually exclusive with only)

***

### excludes?

> `optional` **excludes?**: `string`[]

Defined in: [resolver/src/imports.ts:66](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/imports.ts#L66)

Skill names to exclude (mutually exclusive with includes)

***

### includes?

> `optional` **includes?**: `string`[]

Defined in: [resolver/src/imports.ts:64](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/imports.ts#L64)

Skill names to include (mutually exclusive with excludes)

***

### only?

> `optional` **only?**: `string`[]

Defined in: [resolver/src/imports.ts:60](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/imports.ts#L60)

Block names to include (mutually exclusive with exclude)

***

### remaining

> **remaining**: [`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)[]

Defined in: [resolver/src/imports.ts:68](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/imports.ts#L68)

Remaining non-reserved parameters for template interpolation