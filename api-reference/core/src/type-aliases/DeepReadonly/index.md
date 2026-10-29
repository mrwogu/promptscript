# DeepReadonly<T>

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: DeepReadonly\<T\>

> **DeepReadonly**\<`T`\> = `T` *extends* [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) ? `T` : `T` *extends* readonly infer Item[] ? readonly `DeepReadonly`\<`Item`\>[] : `T` *extends* `object` ? `{ readonly [Key in keyof T]: DeepReadonly<T[Key]> }` : `T`

Defined in: [core/src/types/ast.ts:22](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L22)

Recursive readonly projection used by the canonical AST.

## Type Parameters

### T

`T`