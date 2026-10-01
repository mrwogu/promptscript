# PathReference

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PathReference

Defined in: [core/src/types/ast.ts:256](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L256)

Reference to another PromptScript file.

Formats:
- Absolute: `@namespace/path/to/file`
- Versioned: `@namespace/path@1.0.0`
- Relative: `./local/file`

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### isRelative

> **isRelative**: `boolean`

Defined in: [core/src/types/ast.ts:267](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L267)

Whether this is a relative path

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### namespace?

> `optional` **namespace?**: `string`

Defined in: [core/src/types/ast.ts:261](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L261)

Namespace (e.g., "core" from "@core/...")

***

### raw

> **raw**: `string`

Defined in: [core/src/types/ast.ts:259](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L259)

Original string representation

***

### segments

> **segments**: `string`[]

Defined in: [core/src/types/ast.ts:263](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L263)

Path segments

***

### type

> `readonly` **type**: `"PathReference"`

Defined in: [core/src/types/ast.ts:257](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L257)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)

***

### version?

> `optional` **version?**: `string`

Defined in: [core/src/types/ast.ts:265](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L265)

Version constraint