# applyExtends()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: applyExtends()

> **applyExtends**(`ast`, `logger?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/extensions.ts:135](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/extensions.ts#L135)

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