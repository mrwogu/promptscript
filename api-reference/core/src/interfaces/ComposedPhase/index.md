# ComposedPhase

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ComposedPhase

Defined in: [core/src/types/ast.ts:801](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L801)

Metadata about a composed phase in a skill.
Set by the resolver during skill composition — not user-authored.

## Properties

### alias?

> `optional` **alias?**: `string`

Defined in: [core/src/types/ast.ts:811](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L811)

Alias if

#### Use

... as alias was used

***

### composedBlocks

> **composedBlocks**: `string`[]

Defined in: [core/src/types/ast.ts:819](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L819)

Which context blocks were composed from this phase

***

### definitionLoc?

> `optional` **definitionLoc?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:809](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L809)

Source location of the composed child skill definition.

***

### inputs?

> `optional` **inputs?**: `Record`\<`string`, [`SkillContractField`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillContractField/index.md)\>

Defined in: [core/src/types/ast.ts:815](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L815)

Extracted inputs contract (if defined)

***

### loc?

> `optional` **loc?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:807](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L807)

Source location of the parent `@use` declaration.

***

### name

> **name**: `string`

Defined in: [core/src/types/ast.ts:803](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L803)

Phase name (alias or skill name)

***

### outputs?

> `optional` **outputs?**: `Record`\<`string`, [`SkillContractField`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillContractField/index.md)\>

Defined in: [core/src/types/ast.ts:817](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L817)

Extracted outputs contract (if defined)

***

### provenance?

> `optional` **provenance?**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/types/ast.ts:813](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L813)

Provenance trace resolved from the child skill.

***

### source

> **source**: `string`

Defined in: [core/src/types/ast.ts:805](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L805)

Source file path