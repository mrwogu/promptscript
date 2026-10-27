# buildPromptBundles()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildPromptBundles()

> **buildPromptBundles**(`program`, `options`, `target`): `BuiltPrompts`

Defined in: [formatters/src/prompt/bundle.ts:297](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/bundle.ts#L297)

Build the bundles of every prompt in a resolved program.

## Parameters

### program

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The resolved program

### options

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md) \| `undefined`

Format options; `provenance` supplies the source files of each segment

### target

`string`

Target name, used in diagnostics

## Returns

`BuiltPrompts`

One bundle per prompt, in authored order, or none when the program has no prompts

## Throws

when the syntax is below 1.6.0 or an entry or model is invalid