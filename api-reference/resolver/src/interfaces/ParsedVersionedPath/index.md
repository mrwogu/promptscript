# ParsedVersionedPath

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParsedVersionedPath

Defined in: [resolver/src/git-url-utils.ts:35](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L35)

Parsed versioned path structure.

## Properties

### path

> **path**: `string`

Defined in: [resolver/src/git-url-utils.ts:37](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L37)

Path without version (e.g., @company/base)

***

### version?

> `optional` **version?**: `string`

Defined in: [resolver/src/git-url-utils.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L39)

Version tag if specified (e.g., v1.0.0)