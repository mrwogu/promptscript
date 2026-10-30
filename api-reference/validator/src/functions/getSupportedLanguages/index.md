# getSupportedLanguages()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getSupportedLanguages()

> **getSupportedLanguages**(): [`SupportedLanguage`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/SupportedLanguage/index.md)[]

Defined in: [validator/src/presets.ts:395](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/presets.ts#L395)

List all supported languages for prompt injection detection.

## Returns

[`SupportedLanguage`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/SupportedLanguage/index.md)[]

Array of supported language codes with descriptions

## Example

```typescript
import { getSupportedLanguages } from '@promptscript/validator';

console.log(getSupportedLanguages());
// ['en', 'pl', 'es', 'de', 'fr', 'pt', 'ru', 'zh', 'it']
```