# DeepReadonly<T>

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) ? `T` : `T` *extends* readonly infer Item[] ? readonly `DeepReadonly`\<`Item`\>[] : `T` *extends* `object` ? `{ readonly [Key in keyof T]: DeepReadonly<T[Key]> }` : `T`

Defined in: [core/src/types/ast.ts:22](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/types/ast.ts#L22)

Recursive readonly projection used by the canonical AST.

## Type Parameters

### T

`T`