# getSecurityPreset()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getSecurityPreset()

> **getSecurityPreset**(`environment`): [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/presets.ts:274](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/presets.ts#L274)

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