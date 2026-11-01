# interpolateAST()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateAST()

> **interpolateAST**(`ast`, `ctx`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/template.ts:447](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/template.ts#L447)

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