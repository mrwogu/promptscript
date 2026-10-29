# getResourceCapabilityWarnings()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getResourceCapabilityWarnings()

> **getResourceCapabilityWarnings**(`ast`, `target`, `version`): [`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

Defined in: [formatters/src/resource-capability-warnings.ts:38](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/resource-capability-warnings.ts#L38)

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