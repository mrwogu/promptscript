# AgentProvenance

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: AgentProvenance

Defined in: [core/src/types/ast.ts:131](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L131)

Provenance retained for a resolved agent definition.

## Properties

### action

> **action**: `"local"` \| `"imported"` \| `"qualified"` \| `"native"`

Defined in: [core/src/types/ast.ts:141](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L141)

How the definition entered the resolved program

***

### importPath?

> `optional` **importPath?**: `string`

Defined in: [core/src/types/ast.ts:137](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L137)

Import path used to bring the definition into the current program

***

### loc?

> `optional` **loc?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:143](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L143)

Source location of the definition or import

***

### name

> **name**: `string`

Defined in: [core/src/types/ast.ts:133](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L133)

Resolved agent name

***

### namespace?

> `optional` **namespace?**: `string`

Defined in: [core/src/types/ast.ts:139](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L139)

Namespace added by an aliased import

***

### source

> **source**: `string`

Defined in: [core/src/types/ast.ts:135](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L135)

Source file that defined the agent