# createLogger()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createLogger()

> **createLogger**(`options`): [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [core/src/logger.ts:54](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/logger.ts#L54)

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