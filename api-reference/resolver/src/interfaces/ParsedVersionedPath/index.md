# ParsedVersionedPath

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParsedVersionedPath

Defined in: [resolver/src/git-url-utils.ts:35](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/git-url-utils.ts#L35)

Parsed versioned path structure.

## Properties

### path

> **path**: `string`

Defined in: [resolver/src/git-url-utils.ts:37](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/git-url-utils.ts#L37)

Path without version (e.g., @company/base)

***

### version?

> `optional` **version?**: `string`

Defined in: [resolver/src/git-url-utils.ts:39](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/git-url-utils.ts#L39)

Version tag if specified (e.g., v1.0.0)