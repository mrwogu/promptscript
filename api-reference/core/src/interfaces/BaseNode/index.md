# BaseNode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BaseNode

Defined in: [core/src/types/ast.ts:12](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L12)

Base interface for all AST nodes.

## Extended by

- [`ParamDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamDefinition/index.md)
- [`ParamArgument`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamArgument/index.md)
- [`TemplateExpression`](https://getpromptscript.dev/api-reference/core/src/interfaces/TemplateExpression/index.md)
- [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)
- [`MetaBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/MetaBlock/index.md)
- [`InheritDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/InheritDeclaration/index.md)
- [`UseDeclaration`](https://getpromptscript.dev/api-reference/core/src/interfaces/UseDeclaration/index.md)
- [`PathReference`](https://getpromptscript.dev/api-reference/core/src/interfaces/PathReference/index.md)
- [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)
- [`ExtendBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/ExtendBlock/index.md)
- [`BlockReplacement`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockReplacement/index.md)
- [`ValueReplacement`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValueReplacement/index.md)
- [`OverrideBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/OverrideBlock/index.md)
- [`ReplaceModifier`](https://getpromptscript.dev/api-reference/core/src/interfaces/ReplaceModifier/index.md)
- [`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)
- [`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md)
- [`ArrayContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ArrayContent/index.md)
- [`MixedContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/MixedContent/index.md)
- [`TypeExpression`](https://getpromptscript.dev/api-reference/core/src/interfaces/TypeExpression/index.md)

## Properties

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L16)

Source location

***

### type

> `readonly` **type**: `string`

Defined in: [core/src/types/ast.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L14)

Node type discriminator