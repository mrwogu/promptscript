# TemplateContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TemplateContext

Defined in: [core/src/template.ts:33](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/template.ts#L33)

Context for template interpolation.

## Properties

### params

> **params**: `Map`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [core/src/template.ts:35](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/template.ts#L35)

Bound parameter values

***

### sourceFile

> **sourceFile**: `string`

Defined in: [core/src/template.ts:37](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/template.ts#L37)

Source file being interpolated (for error messages)