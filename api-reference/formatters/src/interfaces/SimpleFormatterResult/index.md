# SimpleFormatterResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SimpleFormatterResult

Defined in: [formatters/src/create-simple-formatter.ts:63](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L63)

Return type from the factory: the class itself (with static
`getSupportedVersions()`) plus the pre-built VERSIONS constant.

## Properties

### Formatter

> **Formatter**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \}

Defined in: [formatters/src/create-simple-formatter.ts:65](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L65)

Concrete formatter class (instantiable via `new`)

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

***

### VERSIONS

> **VERSIONS**: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

Defined in: [formatters/src/create-simple-formatter.ts:70](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L70)

Pre-built version map, exported as `<NAME>_VERSIONS`