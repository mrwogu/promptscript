# SECURITY_MINIMAL

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: SECURITY\_MINIMAL

> `const` **SECURITY\_MINIMAL**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:237](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/presets.ts#L237)

Minimal security preset for trusted environments.

Only enables critical security checks. Use only when you have
other security measures in place and trust your .prs sources.
Recommended for:
- Trusted internal pipelines
- Quick prototyping
- Environments with other security layers

## Example

```typescript
import { createValidator, SECURITY_MINIMAL } from '@promptscript/validator';

const validator = createValidator(SECURITY_MINIMAL);
const result = validator.validate(ast);
```