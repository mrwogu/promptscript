# createMultilingualConfig()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createMultilingualConfig()

> **createMultilingualConfig**(`basePreset`, `languages`): [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:338](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/presets.ts#L338)

Create a security config with patterns for specific languages.

Use this when you know which languages your content will be in.
This is more efficient than using all languages.

## Parameters

### basePreset

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

The base security preset to extend

### languages

[`SupportedLanguage`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/SupportedLanguage/index.md)[]

Array of language codes to include

## Returns

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

A ValidatorConfig with the specified language patterns

## Example

```typescript
import { createValidator, createMultilingualConfig, SECURITY_STRICT } from '@promptscript/validator';

// Polish and German support
const config = createMultilingualConfig(SECURITY_STRICT, ['pl', 'de']);
const validator = createValidator(config);

// Or for a Polish-only project:
const polishConfig = createMultilingualConfig(SECURITY_STRICT, ['pl']);
```