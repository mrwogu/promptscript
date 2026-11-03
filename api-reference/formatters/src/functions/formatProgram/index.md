# formatProgram()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatProgram()

> **formatProgram**(`formatter`, `ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatter-adapter.ts:33](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatter-adapter.ts#L33)

Format a program, resolve `{{prs.*}}` path tokens for the target, and
report authored resource blocks the target drops.

## Parameters

### formatter

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

### ast

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

## Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)