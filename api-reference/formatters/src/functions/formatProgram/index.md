# formatProgram()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatProgram()

> **formatProgram**(`formatter`, `ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatter-adapter.ts:31](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/formatters/src/formatter-adapter.ts#L31)

Format a program and report authored resource blocks the target drops.

## Parameters

### formatter

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

### ast

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

## Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)