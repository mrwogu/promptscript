# getResourceCapabilityWarnings()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getResourceCapabilityWarnings()

> **getResourceCapabilityWarnings**(`ast`, `target`, `version`): [`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

Defined in: [formatters/src/resource-capability-warnings.ts:37](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/formatters/src/resource-capability-warnings.ts#L37)

Warn when `@skills`, `@mcpServers` or `@plugins` is authored but the target,
or the resolved target version, cannot emit it.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### target

`string`

### version

`string` \| `undefined`

## Returns

[`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]