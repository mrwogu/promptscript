# generateVSCodeHooks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: generateVSCodeHooks()

> **generateVSCodeHooks**(`hooks`): `Record`\<`string`, `unknown`[]\>

Defined in: [formatters/src/hook-adapters.ts:892](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/hook-adapters.ts#L892)

Generate VS Code Copilot Agent hook entries.

VS Code uses the Claude-compatible PascalCase event schema, but its
workspace hook loader currently ignores matcher values. The matcher is
retained for readability and the compatibility warning directs users to
filter tool input inside the command when exact filtering matters.

## Parameters

### hooks

[`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

## Returns

`Record`\<`string`, `unknown`[]\>