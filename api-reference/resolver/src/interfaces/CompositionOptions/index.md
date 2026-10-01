# CompositionOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompositionOptions

Defined in: [resolver/src/skill-composition.ts:40](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-composition.ts#L40)

Options for skill composition resolution.

## Properties

### currentFile

> **currentFile**: `string`

Defined in: [resolver/src/skill-composition.ts:49](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-composition.ts#L49)

Absolute path of the file being resolved (for cycle detection).

***

### depth?

> `optional` **depth?**: `number`

Defined in: [resolver/src/skill-composition.ts:53](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-composition.ts#L53)

Current nesting depth (0-based).

***

### resolutionStack?

> `optional` **resolutionStack?**: `Set`\<`string`\>

Defined in: [resolver/src/skill-composition.ts:51](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-composition.ts#L51)

Accumulated resolution stack for cycle detection.

***

### resolveFile

> **resolveFile**: (`absPath`, `context?`) => `Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `ResolvedCompositionFile`\>

Defined in: [resolver/src/skill-composition.ts:42](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-composition.ts#L42)

Resolve a sub-skill file through the full resolver pipeline.

#### Parameters

##### absPath

`string`

##### context?

`CompositionResolutionContext`

#### Returns

`Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `ResolvedCompositionFile`\>

***

### resolvePath

> **resolvePath**: (`ref`, `fromFile`) => `string`

Defined in: [resolver/src/skill-composition.ts:47](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-composition.ts#L47)

Resolve a path reference string to an absolute path.

#### Parameters

##### ref

`string`

##### fromFile

`string`

#### Returns

`string`