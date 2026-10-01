# getPatternsForLanguage()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getPatternsForLanguage()

> **getPatternsForLanguage**(`language`): `RegExp`[]

Defined in: [validator/src/presets.ts:378](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/presets.ts#L378)

Get patterns for a specific language.

Useful when you want to add patterns to an existing config manually.

## Parameters

### language

[`SupportedLanguage`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/SupportedLanguage/index.md)

The language code

## Returns

`RegExp`[]

Array of RegExp patterns for the language, or empty array if not found

## Example

```typescript
import { createValidator, getPatternsForLanguage } from '@promptscript/validator';

const validator = createValidator({
  blockedPatterns: [
    ...getPatternsForLanguage('pl'),
    ...getPatternsForLanguage('de'),
    /my-custom-pattern/i,
  ],
});
```