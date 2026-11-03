# InlineUseDeclaration

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: InlineUseDeclaration

Defined in: [core/src/types/ast.ts:232](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L232)

Inline

## Use

declaration within a skill block body.
Same syntax as top-level UseDeclaration but appears inside block content.

## Properties

### alias?

> `optional` **alias?**: `string`

Defined in: [core/src/types/ast.ts:239](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L239)

Alias for the phase

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:243](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L243)

Source location

***

### outputDir?

> `optional` **outputDir?**: `string`

Defined in: [core/src/types/ast.ts:241](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L241)

Optional inline output directory (forward-slash relative).

***

### params?

> `optional` **params?**: [`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)[]

Defined in: [core/src/types/ast.ts:237](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L237)

Template parameters

***

### path

> **path**: [`PathReference`](https://getpromptscript.dev/api-reference/core/src/interfaces/PathReference/index.md)

Defined in: [core/src/types/ast.ts:235](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L235)

Path to the sub-skill file

***

### type

> `readonly` **type**: `"InlineUseDeclaration"`

Defined in: [core/src/types/ast.ts:233](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L233)