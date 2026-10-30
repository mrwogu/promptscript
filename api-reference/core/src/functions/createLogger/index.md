# createLogger()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createLogger()

> **createLogger**(`options`): [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [core/src/logger.ts:54](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/logger.ts#L54)

Create a logger from callback functions.

## Parameters

### options

Logger callbacks

#### debug?

(`message`) => `void`

#### verbose?

(`message`) => `void`

#### warn?

(`message`) => `void`

## Returns

[`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Logger instance