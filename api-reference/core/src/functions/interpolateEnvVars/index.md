# interpolateEnvVars()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateEnvVars()

> **interpolateEnvVars**(`text`, `environmentProvider`): `string`

Defined in: [core/src/utils/interpolate-env.ts:7](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/utils/interpolate-env.ts#L7)

Interpolate environment variables without regex backtracking.
Supports ${VAR} and ${VAR:-default} syntax.

## Parameters

### text

`string`

### environmentProvider

`EnvironmentVariableProvider`

## Returns

`string`