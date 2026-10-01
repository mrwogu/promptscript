# resolveUses

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: resolveUses

> `const` **resolveUses**: (`target`, `declaration`, `imported`) => [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) = `resolveUseImport`

Defined in: [resolver/src/imports.ts:10](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L10)

Merge one resolved top-level import into a program.

## Parameters

### target

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### declaration

[`UseDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/UseDeclaration/index.md)

### imported

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)