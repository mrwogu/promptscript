# interpolateAST()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateAST()

> **interpolateAST**(`ast`, `ctx`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/template.ts:441](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/template.ts#L441)

Interpolate the entire AST with template parameters.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The AST to interpolate

### ctx

[`TemplateContext`](https://getpromptscript.dev/api-reference/core/src/interfaces/TemplateContext/index.md)

Template context with bound parameters

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

A new AST with all template variables interpolated