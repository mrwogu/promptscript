# TEMPLATE_VARIABLE_PATTERN

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: TEMPLATE\_VARIABLE\_PATTERN

> `const` **TEMPLATE\_VARIABLE\_PATTERN**: `RegExp`

Defined in: [core/src/template.ts:218](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/template.ts#L218)

Matches `{{variable}}` and dotted `{{namespace.name}}` placeholders. Global,
so use it with `replace` or `matchAll`, which do not share `lastIndex`.