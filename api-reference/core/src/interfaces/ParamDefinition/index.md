# ParamDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParamDefinition

Defined in: [core/src/types/ast.ts:57](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L57)

Parameter definition in

## Meta

.

## Example

```promptscript
@meta {
  params: {
    projectName: string
    strict?: boolean = true
    mode: enum("dev", "prod")
  }
}
```

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### defaultValue?

> `optional` **defaultValue?**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

Defined in: [core/src/types/ast.ts:66](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L66)

Default value if optional

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### name

> **name**: `string`

Defined in: [core/src/types/ast.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L60)

Parameter name

***

### optional

> **optional**: `boolean`

Defined in: [core/src/types/ast.ts:64](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L64)

Whether the parameter is optional

***

### paramType

> **paramType**: [`ParamType`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ParamType/index.md)

Defined in: [core/src/types/ast.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L62)

Parameter type

***

### type

> `readonly` **type**: `"ParamDefinition"`

Defined in: [core/src/types/ast.ts:58](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L58)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)