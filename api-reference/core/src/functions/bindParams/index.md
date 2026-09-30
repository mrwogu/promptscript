# bindParams()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: bindParams()

> **bindParams**(`args`, `defs`, `templatePath`, `callLocation?`): `Map`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [core/src/template.ts:136](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/template.ts#L136)

Bind parameter arguments to parameter definitions.

## Parameters

### args

[`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)[] \| `undefined`

Arguments provided at the call site

### defs

[`ParamDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamDefinition/index.md)[] \| `undefined`

Parameter definitions from the template

### templatePath

`string`

Path to the template file (for error messages)

### callLocation?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Location of the @inherit/@use call (for error messages)

## Returns

`Map`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Map of parameter names to their bound values

## Throws

MissingParamError if a required parameter is not provided

## Throws

UnknownParamError if an unknown parameter is provided

## Throws

ParamTypeMismatchError if a parameter value has the wrong type