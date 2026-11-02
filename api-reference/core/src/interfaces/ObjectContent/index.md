# ObjectContent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ObjectContent

Defined in: [core/src/types/ast.ts:419](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/ast.ts#L419)

Object/map content with key-value pairs.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### inlineUses?

> `optional` **inlineUses?**: [`InlineUseDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/InlineUseDeclaration/index.md)[]

Defined in: [core/src/types/ast.ts:426](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/ast.ts#L426)

Inline

#### Use

declarations (consumed by resolver, ephemeral)

***

### listItems?

> `optional` **listItems?**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [core/src/types/ast.ts:424](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/ast.ts#L424)

Dash-list entries interleaved with properties

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### properties

> **properties**: `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [core/src/types/ast.ts:422](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/ast.ts#L422)

Properties

***

### type

> `readonly` **type**: `"ObjectContent"`

Defined in: [core/src/types/ast.ts:420](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/ast.ts#L420)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)