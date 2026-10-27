# TEMPLATE_VARIABLE_PATTERN

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: TEMPLATE\_VARIABLE\_PATTERN

> `const` **TEMPLATE\_VARIABLE\_PATTERN**: `RegExp`

Defined in: [core/src/template.ts:216](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/template.ts#L216)

Matches `{{variable}}` and dotted `{{namespace.name}}` placeholders. Global,
so use it with `replace` or `matchAll`, which do not share `lastIndex`.