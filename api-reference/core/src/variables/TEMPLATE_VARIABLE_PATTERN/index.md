# TEMPLATE_VARIABLE_PATTERN

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: TEMPLATE\_VARIABLE\_PATTERN

> `const` **TEMPLATE\_VARIABLE\_PATTERN**: `RegExp`

Defined in: [core/src/template.ts:218](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/template.ts#L218)

Matches `{{variable}}` and dotted `{{namespace.name}}` placeholders. Global,
so use it with `replace` or `matchAll`, which do not share `lastIndex`.