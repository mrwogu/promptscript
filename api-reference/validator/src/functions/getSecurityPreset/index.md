# getSecurityPreset()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getSecurityPreset()

> **getSecurityPreset**(`environment`): [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:274](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/presets.ts#L274)

Get the recommended security preset based on environment.

## Parameters

### environment

`string`

The deployment environment

## Returns

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

The recommended security preset

## Example

```typescript
import { createValidator, getSecurityPreset } from '@promptscript/validator';

const preset = getSecurityPreset(process.env.NODE_ENV);
const validator = createValidator(preset);
```