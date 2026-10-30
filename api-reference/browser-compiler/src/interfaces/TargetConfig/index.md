# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [browser-compiler/src/compiler.ts:39](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L39)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [browser-compiler/src/compiler.ts:45](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L45)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [browser-compiler/src/compiler.ts:41](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L41)

Whether this target is enabled

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [browser-compiler/src/compiler.ts:56](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L56)

Controls which skills are emitted for this target

***

### output?

> `optional` **output?**: `string`

Defined in: [browser-compiler/src/compiler.ts:43](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L43)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [browser-compiler/src/compiler.ts:52](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L52)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [browser-compiler/src/compiler.ts:54](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L54)

Custom base directory for generated skill files

***

### version?

> `optional` **version?**: `string`

Defined in: [browser-compiler/src/compiler.ts:47](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/browser-compiler/src/compiler.ts#L47)

Target version or format variant