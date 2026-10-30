# TEMPLATE_VARIABLE_PATTERN

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: TEMPLATE\_VARIABLE\_PATTERN

> `const` **TEMPLATE\_VARIABLE\_PATTERN**: `RegExp`

Defined in: [core/src/template.ts:216](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/template.ts#L216)

Matches `{{variable}}` and dotted `{{namespace.name}}` placeholders. Global,
so use it with `replace` or `matchAll`, which do not share `lastIndex`.