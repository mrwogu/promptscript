# ReservedParamsResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReservedParamsResult

Defined in: [resolver/src/imports.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L52)

Result of extracting reserved parameters from

## Use

arguments.

## Properties

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [resolver/src/imports.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L56)

Block names to exclude (mutually exclusive with only)

***

### excludes?

> `optional` **excludes?**: `string`[]

Defined in: [resolver/src/imports.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L60)

Skill names to exclude (mutually exclusive with includes)

***

### includes?

> `optional` **includes?**: `string`[]

Defined in: [resolver/src/imports.ts:58](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L58)

Skill names to include (mutually exclusive with excludes)

***

### only?

> `optional` **only?**: `string`[]

Defined in: [resolver/src/imports.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L54)

Block names to include (mutually exclusive with exclude)

***

### remaining

> **remaining**: [`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)[]

Defined in: [resolver/src/imports.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L62)

Remaining non-reserved parameters for template interpolation