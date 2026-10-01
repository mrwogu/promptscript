# extractReservedParams()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractReservedParams()

> **extractReservedParams**(`params`): [`ReservedParamsResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ReservedParamsResult/index.md)

Defined in: [resolver/src/imports.ts:73](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L73)

Extract reserved parameters (only, exclude, includes, excludes) from

## Parameters

### params

[`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)[] \| `undefined`

## Returns

[`ReservedParamsResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ReservedParamsResult/index.md)

## Use

param arguments. These are consumed by the resolver for filtering and must
not be passed to bindParams (which would throw UnknownParamError).

Only extracts when the value is an array. Non-array values are left in
remaining for the validator (PS021) to report as type errors.