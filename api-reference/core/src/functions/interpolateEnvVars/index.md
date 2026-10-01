# interpolateEnvVars()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateEnvVars()

> **interpolateEnvVars**(`text`, `environmentProvider`): `string`

Defined in: [core/src/utils/interpolate-env.ts:7](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/interpolate-env.ts#L7)

Interpolate environment variables without regex backtracking.
Supports ${VAR} and ${VAR:-default} syntax.

## Parameters

### text

`string`

### environmentProvider

`EnvironmentVariableProvider`

## Returns

`string`