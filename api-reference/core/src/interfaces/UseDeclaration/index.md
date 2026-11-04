# UseDeclaration

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UseDeclaration

Defined in: [core/src/types/ast.ts:212](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L212)

Import declaration for reusable fragments.

## Example

```promptscript
@use @core/guards/compliance
@use @core/guards/compliance as security
@use @fragments/header(title: "Welcome") as header
```

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### alias?

> `optional` **alias?**: `string`

Defined in: [core/src/types/ast.ts:217](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L217)

Optional alias

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### outputDir?

> `optional` **outputDir?**: `string`

Defined in: [core/src/types/ast.ts:225](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L225)

Optional inline output directory (e.g. `@use foo into skills/seo`).
Stored as a forward-slash relative path. When present this overrides
the global `skillTargets` configuration for this import only.

***

### params?

> `optional` **params?**: [`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)[]

Defined in: [core/src/types/ast.ts:219](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L219)

Template parameters (for parameterized imports)

***

### path

> **path**: [`PathReference`](https://getpromptscript.dev/api-reference/core/src/interfaces/PathReference/index.md)

Defined in: [core/src/types/ast.ts:215](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L215)

Path to imported file

***

### type

> `readonly` **type**: `"UseDeclaration"`

Defined in: [core/src/types/ast.ts:213](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L213)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)