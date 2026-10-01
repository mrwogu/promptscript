# MixedContent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MixedContent

Defined in: [core/src/types/ast.ts:439](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L439)

Mixed content with both text and properties.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### inlineUses?

> `optional` **inlineUses?**: [`InlineUseDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/InlineUseDeclaration/index.md)[]

Defined in: [core/src/types/ast.ts:448](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L448)

Inline

#### Use

declarations (consumed by resolver, ephemeral)

***

### listItems?

> `optional` **listItems?**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [core/src/types/ast.ts:446](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L446)

Dash-list entries interleaved with text or properties

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### properties

> **properties**: `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [core/src/types/ast.ts:444](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L444)

Properties

***

### text?

> `optional` **text?**: [`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)

Defined in: [core/src/types/ast.ts:442](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L442)

Optional text content

***

### type

> `readonly` **type**: `"MixedContent"`

Defined in: [core/src/types/ast.ts:440](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L440)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)