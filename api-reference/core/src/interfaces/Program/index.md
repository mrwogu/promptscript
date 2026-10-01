# Program

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Program

Defined in: [core/src/types/ast.ts:108](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L108)

Root AST node representing a complete PromptScript file.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### agentProvenance?

> `optional` **agentProvenance?**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]

Defined in: [core/src/types/ast.ts:123](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L123)

Resolved agent names and their source/import provenance

***

### blocks

> **blocks**: [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [core/src/types/ast.ts:117](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L117)

Content blocks (@identity, @context, etc.)

***

### extends

> **extends**: [`ExtendBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/ExtendBlock/index.md)[]

Defined in: [core/src/types/ast.ts:119](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L119)

Extension blocks (@extend)

***

### inherit?

> `optional` **inherit?**: [`InheritDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/InheritDeclaration/index.md)

Defined in: [core/src/types/ast.ts:113](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L113)

Inheritance declaration (@inherit)

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### meta?

> `optional` **meta?**: [`MetaBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/MetaBlock/index.md)

Defined in: [core/src/types/ast.ts:111](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L111)

Metadata block (@meta)

***

### overrides?

> `optional` **overrides?**: [`OverrideBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/OverrideBlock/index.md)[]

Defined in: [core/src/types/ast.ts:121](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L121)

Explicit replacement blocks (@override)

***

### syntaxFeatures?

> `optional` **syntaxFeatures?**: [`SyntaxFeatureUsage`](https://getpromptscript.dev/api-reference/core/src/interfaces/SyntaxFeatureUsage/index.md)[]

Defined in: [core/src/types/ast.ts:125](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L125)

Versioned syntax features retained after destructive resolution passes

***

### type

> `readonly` **type**: `"Program"`

Defined in: [core/src/types/ast.ts:109](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L109)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)

***

### uses

> **uses**: [`UseDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/UseDeclaration/index.md)[]

Defined in: [core/src/types/ast.ts:115](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L115)

Import declarations (@use)