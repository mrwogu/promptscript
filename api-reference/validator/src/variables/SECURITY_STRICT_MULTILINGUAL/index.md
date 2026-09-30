# SECURITY_STRICT_MULTILINGUAL

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: SECURITY\_STRICT\_MULTILINGUAL

> `const` **SECURITY\_STRICT\_MULTILINGUAL**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:311](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/presets.ts#L311)

Strict security preset with ALL language patterns.

Use this for international applications where content may be in any language.
Includes patterns for 26 languages: English, Polish, Spanish, German, French,
Portuguese, Russian, Chinese, Italian, Dutch, Japanese, Korean, Arabic, Turkish,
Swedish, Norwegian, Danish, Finnish, Czech, Hungarian, Ukrainian, Hindi,
Indonesian, Vietnamese, Thai, Greek, Romanian, and Hebrew.

## Example

```typescript
import { createValidator, SECURITY_STRICT_MULTILINGUAL } from '@promptscript/validator';

const validator = createValidator(SECURITY_STRICT_MULTILINGUAL);
const result = validator.validate(ast);
```