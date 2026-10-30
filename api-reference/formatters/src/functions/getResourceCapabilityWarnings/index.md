# getResourceCapabilityWarnings()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getResourceCapabilityWarnings()

> **getResourceCapabilityWarnings**(`ast`, `target`, `version`): [`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

Defined in: [formatters/src/resource-capability-warnings.ts:38](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/resource-capability-warnings.ts#L38)

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