# CompositionOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompositionOptions

Defined in: [resolver/src/skill-composition.ts:44](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L44)

Options for skill composition resolution.

## Properties

### currentFile

> **currentFile**: `string`

Defined in: [resolver/src/skill-composition.ts:53](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L53)

Absolute path of the file being resolved (for cycle detection).

***

### depth?

> `optional` **depth?**: `number`

Defined in: [resolver/src/skill-composition.ts:59](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L59)

Current nesting depth (0-based).

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/skill-composition.ts:55](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L55)

Project root used to build portable `composed-from` markers.

***

### resolutionStack?

> `optional` **resolutionStack?**: `Set`\<`string`\>

Defined in: [resolver/src/skill-composition.ts:57](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L57)

Accumulated resolution stack for cycle detection.

***

### resolveFile

> **resolveFile**: (`absPath`, `context?`) => `Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `ResolvedCompositionFile`\>

Defined in: [resolver/src/skill-composition.ts:46](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L46)

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

Defined in: [resolver/src/skill-composition.ts:51](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-composition.ts#L51)

Resolve a path reference string to an absolute path.

#### Parameters

##### ref

`string`

##### fromFile

`string`

#### Returns

`string`