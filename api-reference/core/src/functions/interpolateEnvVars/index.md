# interpolateEnvVars()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateEnvVars()

> **interpolateEnvVars**(`text`, `environmentProvider`): `string`

Defined in: [core/src/utils/interpolate-env.ts:7](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/utils/interpolate-env.ts#L7)

Interpolate environment variables without regex backtracking.
Supports ${VAR} and ${VAR:-default} syntax.

## Parameters

### text

`string`

### environmentProvider

[`EnvironmentVariableProvider`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EnvironmentVariableProvider/index.md)

## Returns

`string`