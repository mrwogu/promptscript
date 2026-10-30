# extractPromptDefinitions()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractPromptDefinitions()

> **extractPromptDefinitions**(`program`): [`PromptExtraction`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptExtraction/index.md)

Defined in: [core/src/prompt-definitions.ts:714](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/prompt-definitions.ts#L714)

Read every `@prompts` entry of a program into typed definitions.

Accepts the canonical AST (`CanonicalBlock` with `FieldEntry` values) and the
legacy AST (`ObjectContent` with `TextContent` values). Problems do not stop
the read: the entry keeps what is valid and each problem becomes an issue.
An entry whose key is reserved, malformed or collides with another key
(case-insensitively) is reported and left out of `prompts`.

## Parameters

### program

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

A resolved program, canonical or legacy

## Returns

[`PromptExtraction`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptExtraction/index.md)

The definitions and the issues found

## Example

```ts
const { prompts, issues } = extractPromptDefinitions(program);
```