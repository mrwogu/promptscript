# interpolateEnvVars()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateEnvVars()

> **interpolateEnvVars**(`text`, `environmentProvider`): `string`

Defined in: [core/src/utils/interpolate-env.ts:7](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/interpolate-env.ts#L7)

Interpolate environment variables without regex backtracking.
Supports ${VAR} and ${VAR:-default} syntax.

## Parameters

### text

`string`

### environmentProvider

`EnvironmentVariableProvider`

## Returns

`string`