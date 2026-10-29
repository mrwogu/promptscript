# MetaBlock

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MetaBlock

Defined in: [core/src/types/ast.ts:174](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L174)

Metadata block containing file identification.

## Example

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
  params: {
    projectName: string
    strict?: boolean = true
  }
}
```

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### fields

> **fields**: `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [core/src/types/ast.ts:177](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L177)

Key-value pairs

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### params?

> `optional` **params?**: [`ParamDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamDefinition/index.md)[]

Defined in: [core/src/types/ast.ts:179](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L179)

Template parameter definitions (for parameterized inheritance)

***

### type

> `readonly` **type**: `"MetaBlock"`

Defined in: [core/src/types/ast.ts:175](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L175)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)