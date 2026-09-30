# Logger

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Logger

Defined in: [core/src/logger.ts:19](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/logger.ts#L19)

Logger interface for verbose/debug output during compilation.

Components in the PromptScript pipeline accept an optional Logger
to report their progress. The CLI creates a logger that outputs
to the console based on --verbose and --debug flags.

## Example

```typescript
const logger: Logger = {
  verbose: (msg) => console.log(`[verbose] ${msg}`),
  debug: (msg) => console.log(`[debug] ${msg}`),
  warn: (msg) => console.warn(`[warn] ${msg}`),
};

const compiler = new Compiler({ logger });
```

## Methods

### debug()

> **debug**(`message`): `void`

Defined in: [core/src/logger.ts:30](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/logger.ts#L30)

Log debug message.
Shown only with --debug flag.

#### Parameters

##### message

`string`

#### Returns

`void`

***

### verbose()

> **verbose**(`message`): `void`

Defined in: [core/src/logger.ts:24](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/logger.ts#L24)

Log verbose message.
Shown with --verbose and --debug flags.

#### Parameters

##### message

`string`

#### Returns

`void`

***

### warn()

> **warn**(`message`): `void`

Defined in: [core/src/logger.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/logger.ts#L35)

Log warning message. Always shown regardless of verbosity flags.

#### Parameters

##### message

`string`

#### Returns

`void`