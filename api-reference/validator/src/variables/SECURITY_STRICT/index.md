# SECURITY_STRICT

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: SECURITY\_STRICT

> `const` **SECURITY\_STRICT**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:143](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/presets.ts#L143)

Strict security preset for high-security environments.

Enables all security rules as errors and enforces strict validation.
Recommended for:
- Production deployments
- Enterprise environments
- Applications handling sensitive data
- Public-facing AI applications

## Example

```typescript
import { createValidator, SECURITY_STRICT } from '@promptscript/validator';

const validator = createValidator(SECURITY_STRICT);
const result = validator.validate(ast);
```