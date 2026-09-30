# OverrideBlock

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OverrideBlock

Defined in: [core/src/types/ast.ts:372](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L372)

Explicit replacement of an existing block or nested value.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### replacement

> **replacement**: [`OverrideReplacement`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OverrideReplacement/index.md)

Defined in: [core/src/types/ast.ts:377](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L377)

Complete replacement value

***

### targetPath

> **targetPath**: `string`

Defined in: [core/src/types/ast.ts:375](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L375)

Dot-separated path to an existing target

***

### type

> `readonly` **type**: `"OverrideBlock"`

Defined in: [core/src/types/ast.ts:373](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L373)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)