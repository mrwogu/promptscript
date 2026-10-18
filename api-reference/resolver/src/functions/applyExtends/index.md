# applyExtends()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: applyExtends()

> **applyExtends**(`ast`, `logger?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/extensions.ts:135](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/resolver/src/extensions.ts#L135)

Apply all

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Program AST with

### logger?

[`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Program with extensions applied and import markers removed

## Extend

blocks to resolve extensions.

## Extend

blocks