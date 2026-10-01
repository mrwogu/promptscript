# ConsoleOutput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: ConsoleOutput

> `const` **ConsoleOutput**: `object`

Defined in: [cli/src/output/console.ts:104](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/output/console.ts#L104)

Console output utilities for formatted CLI output.
Respects the global log level settings.

## Type Declaration

### debug()

> **debug**(`message`): `void`

Print a debug message (only shown with --verbose).

#### Parameters

##### message

`string`

#### Returns

`void`

### dryRun()

> **dryRun**(`message`): `void`

Print a dry-run indicator.

#### Parameters

##### message

`string`

#### Returns

`void`

### error()

> **error**(`message`): `void`

Print an error message.
Always printed regardless of log level.

#### Parameters

##### message

`string`

#### Returns

`void`

### formatLocation()

> **formatLocation**(`file`, `line?`, `column?`): `string`

Format a location string.

#### Parameters

##### file

`string`

##### line?

`number`

##### column?

`number`

#### Returns

`string`

### formatPath()

> **formatPath**(`path`): `string`

Format a file path for display.

#### Parameters

##### path

`string`

#### Returns

`string`

### header()

> **header**(`message`): `void`

Print a header.

#### Parameters

##### message

`string`

#### Returns

`void`

### info()

> **info**(`message`): `void`

Print an info message.

#### Parameters

##### message

`string`

#### Returns

`void`

### muted()

> **muted**(`message`): `void`

Print a gray/muted message.

#### Parameters

##### message

`string`

#### Returns

`void`

### newline()

> **newline**(): `void`

Print a blank line.

#### Returns

`void`

### skipped()

> **skipped**(`message`): `void`

Print a skipped file message.

#### Parameters

##### message

`string`

#### Returns

`void`

### stats()

> **stats**(`message`): `void`

Print stats in gray.

#### Parameters

##### message

`string`

#### Returns

`void`

### success()

> **success**(`message`): `void`

Print a success message.

#### Parameters

##### message

`string`

#### Returns

`void`

### unchanged()

> **unchanged**(`message`): `void`

Print an unchanged file message.

#### Parameters

##### message

`string`

#### Returns

`void`

### verbose()

> **verbose**(`message`): `void`

Print a verbose message (only shown with --verbose).

#### Parameters

##### message

`string`

#### Returns

`void`

### warn()

> **warn**(`message`): `void`

Print a warning message (alias for warning).

#### Parameters

##### message

`string`

#### Returns

`void`

### warning()

> **warning**(`message`): `void`

Print a warning message.

#### Parameters

##### message

`string`

#### Returns

`void`