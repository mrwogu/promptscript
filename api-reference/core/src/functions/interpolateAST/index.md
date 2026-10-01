# interpolateAST()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateAST()

> **interpolateAST**(`ast`, `ctx`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/template.ts:441](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/template.ts#L441)

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