# resolveUses

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: resolveUses

> `const` **resolveUses**: (`target`, `declaration`, `imported`) => [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) = `resolveUseImport`

Defined in: [resolver/src/imports.ts:10](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/imports.ts#L10)

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