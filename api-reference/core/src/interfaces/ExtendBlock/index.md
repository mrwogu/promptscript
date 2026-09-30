# ExtendBlock

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ExtendBlock

Defined in: [core/src/types/ast.ts:339](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L339)

Extension block that modifies an existing block.

## Example

```promptscript
@extend identity {
  """
  Additional context.
  """
}

@extend standards.code {
  frameworks: [react]
}
```

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### canonicalBody?

> `optional` **canonicalBody?**: [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/types/ast.ts:346](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L346)

Ordered compatibility metadata retained for canonical consumers

***

### content

> **content**: [`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

Defined in: [core/src/types/ast.ts:344](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L344)

Content to merge

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### replacements?

> `optional` **replacements?**: [`ReplaceModifier`](https://getpromptscript.dev/api-reference/core/src/interfaces/ReplaceModifier/index.md)[]

Defined in: [core/src/types/ast.ts:348](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L348)

Fields whose complete prior values must be replaced

***

### targetPath

> **targetPath**: `string`

Defined in: [core/src/types/ast.ts:342](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L342)

Dot-separated path to target (e.g., "standards.code")

***

### type

> `readonly` **type**: `"ExtendBlock"`

Defined in: [core/src/types/ast.ts:340](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L340)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)