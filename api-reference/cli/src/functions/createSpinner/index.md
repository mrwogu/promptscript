# createSpinner()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createSpinner()

> **createSpinner**(`text`): `Ora`

Defined in: [cli/src/output/console.ts:90](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/cli/src/output/console.ts#L90)

Creates a spinner for async operations.
Returns a no-op spinner in quiet mode.

## Parameters

### text

`string`

Initial text to display.

## Returns

`Ora`

An ora spinner instance.