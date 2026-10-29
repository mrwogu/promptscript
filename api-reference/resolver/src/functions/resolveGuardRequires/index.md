# resolveGuardRequires()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveGuardRequires()

> **resolveGuardRequires**(`ast`, `options`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/guard-requires.ts:127](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/guard-requires.ts#L127)

Resolve guard `requires` dependencies by injecting `__resolvedRequires`
into guard entries that declare dependencies.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The program AST

### options

[`GuardRequiresOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GuardRequiresOptions/index.md)

Resolution options including maxDepth

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

The AST with `__resolvedRequires` injected into guard entries