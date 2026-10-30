# resolveGuardRequires()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveGuardRequires()

> **resolveGuardRequires**(`ast`, `options`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/guard-requires.ts:127](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/guard-requires.ts#L127)

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