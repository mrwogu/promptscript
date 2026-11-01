# SECURITY_MODERATE

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: SECURITY\_MODERATE

> `const` **SECURITY\_MODERATE**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:196](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/presets.ts#L196)

Moderate security preset for standard environments.

Enables security rules as warnings for visibility without blocking builds.
Recommended for:
- Development environments
- Internal tools
- Low-risk applications

## Example

```typescript
import { createValidator, SECURITY_MODERATE } from '@promptscript/validator';

const validator = createValidator(SECURITY_MODERATE);
const result = validator.validate(ast);
```