# resolveInheritance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveInheritance()

> **resolveInheritance**(`parent`, `child`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/inheritance.ts:26](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/inheritance.ts#L26)

Resolve inheritance by merging a parent program into a child program.

Rules:
- Child's meta is merged with parent's (child wins on conflict)
- Blocks with same name are deep merged (child wins on conflict)
- TextContent is concatenated (parent + child)
- Arrays are unique concatenated
- Objects are deep merged
- Child's

## Parameters

### parent

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Parent program AST

### child

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Child program AST

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Merged program

## Inherit

is cleared after resolution