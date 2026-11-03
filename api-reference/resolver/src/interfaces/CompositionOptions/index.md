# CompositionOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompositionOptions

Defined in: [resolver/src/skill-composition.ts:42](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L42)

Options for skill composition resolution.

## Properties

### currentFile

> **currentFile**: `string`

Defined in: [resolver/src/skill-composition.ts:51](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L51)

Absolute path of the file being resolved (for cycle detection).

***

### depth?

> `optional` **depth?**: `number`

Defined in: [resolver/src/skill-composition.ts:57](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L57)

Current nesting depth (0-based).

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/skill-composition.ts:53](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L53)

Project root used to build portable `composed-from` markers.

***

### resolutionStack?

> `optional` **resolutionStack?**: `Set`\<`string`\>

Defined in: [resolver/src/skill-composition.ts:55](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L55)

Accumulated resolution stack for cycle detection.

***

### resolveFile

> **resolveFile**: (`absPath`, `context?`) => `Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `ResolvedCompositionFile`\>

Defined in: [resolver/src/skill-composition.ts:44](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L44)

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

Defined in: [resolver/src/skill-composition.ts:49](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-composition.ts#L49)

Resolve a path reference string to an absolute path.

#### Parameters

##### ref

`string`

##### fromFile

`string`

#### Returns

`string`