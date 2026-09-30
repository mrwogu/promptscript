# resolveSectionTitle()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveSectionTitle()

> **resolveSectionTitle**(`ast`, `sectionIdOrAlias`, `options?`): `string`

Defined in: [formatters/src/section-title-resolver.ts:64](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/section-title-resolver.ts#L64)

Resolve a generated section title without changing its output protocol.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### sectionIdOrAlias

`string`

### options?

[`SectionTitleOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SectionTitleOptions/index.md) = `{}`

## Returns

`string`