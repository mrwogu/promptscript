# CanonicalNode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalNode

Defined in: [core/src/types/ast.ts:495](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L495)

Base interface for immutable canonical AST nodes.

## Extended by

- [`ScalarValueNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/ScalarValueNode/index.md)
- [`TextValueNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextValueNode/index.md)
- [`TemplateValueNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/TemplateValueNode/index.md)
- [`TypeExpressionValueNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/TypeExpressionValueNode/index.md)
- [`ArrayElementNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/ArrayElementNode/index.md)
- [`ArrayValueNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/ArrayValueNode/index.md)
- [`ObjectFieldNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectFieldNode/index.md)
- [`ObjectValueNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectValueNode/index.md)
- [`TextEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextEntry/index.md)
- [`FieldEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/FieldEntry/index.md)
- [`ListEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/ListEntry/index.md)
- [`InlineUseEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/InlineUseEntry/index.md)
- [`PresentationEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PresentationEntry/index.md)
- [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)
- [`CanonicalBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalBlock/index.md)
- [`CanonicalExtendBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalExtendBlock/index.md)
- [`CanonicalOverrideBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalOverrideBlock/index.md)
- [`InheritOperation`](https://getpromptscript.dev/api-reference/core/src/interfaces/InheritOperation/index.md)
- [`UseOperation`](https://getpromptscript.dev/api-reference/core/src/interfaces/UseOperation/index.md)
- [`BlockOperation`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockOperation/index.md)
- [`ExtendOperation`](https://getpromptscript.dev/api-reference/core/src/interfaces/ExtendOperation/index.md)
- [`OverrideOperation`](https://getpromptscript.dev/api-reference/core/src/interfaces/OverrideOperation/index.md)
- [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

## Properties

### loc

> `readonly` **loc**: `object`

Defined in: [core/src/types/ast.ts:497](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L497)

#### column

> `readonly` **column**: `number`

Column number (1-indexed)

#### file

> `readonly` **file**: `string`

File path

#### line

> `readonly` **line**: `number`

Line number (1-indexed)

#### offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

***

### type

> `readonly` **type**: `string`

Defined in: [core/src/types/ast.ts:496](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L496)