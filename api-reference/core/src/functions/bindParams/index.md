# bindParams()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: bindParams()

> **bindParams**(`args`, `defs`, `templatePath`, `callLocation?`): `Map`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [core/src/template.ts:136](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/template.ts#L136)

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