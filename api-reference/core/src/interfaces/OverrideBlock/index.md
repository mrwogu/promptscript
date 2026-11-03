# OverrideBlock

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OverrideBlock

Defined in: [core/src/types/ast.ts:374](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/ast.ts#L374)

Explicit replacement of an existing block or nested value.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### replacement

> **replacement**: [`OverrideReplacement`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OverrideReplacement/index.md)

Defined in: [core/src/types/ast.ts:379](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/ast.ts#L379)

Complete replacement value

***

### targetPath

> **targetPath**: `string`

Defined in: [core/src/types/ast.ts:377](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/ast.ts#L377)

Dot-separated path to an existing target

***

### type

> `readonly` **type**: `"OverrideBlock"`

Defined in: [core/src/types/ast.ts:375](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/ast.ts#L375)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)