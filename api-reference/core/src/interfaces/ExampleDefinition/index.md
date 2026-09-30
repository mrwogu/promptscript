# ExampleDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ExampleDefinition

Defined in: [core/src/types/ast.ts:826](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L826)

Typed representation of an example in the

## Examples

block or within @skills.
This is a helper extraction type (like SkillDefinition), NOT an AST node.

## Properties

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/ast.ts:832](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L832)

Optional description

***

### input

> **input**: `string` \| [`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)

Defined in: [core/src/types/ast.ts:828](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L828)

Input data for the example

***

### output

> **output**: `string` \| [`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)

Defined in: [core/src/types/ast.ts:830](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L830)

Expected output