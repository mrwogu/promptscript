# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [browser-compiler/src/compiler.ts:39](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L39)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [browser-compiler/src/compiler.ts:45](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L45)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [browser-compiler/src/compiler.ts:41](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L41)

Whether this target is enabled

***

### excludeAgents?

> `optional` **excludeAgents?**: `string`[]

Defined in: [browser-compiler/src/compiler.ts:60](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L60)

Agent names never emitted for this target

***

### includeAgents?

> `optional` **includeAgents?**: `boolean` \| `string`[]

Defined in: [browser-compiler/src/compiler.ts:58](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L58)

Controls which agents are emitted for this target

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [browser-compiler/src/compiler.ts:56](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L56)

Controls which skills are emitted for this target

***

### output?

> `optional` **output?**: `string`

Defined in: [browser-compiler/src/compiler.ts:43](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L43)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [browser-compiler/src/compiler.ts:52](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L52)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [browser-compiler/src/compiler.ts:54](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L54)

Custom base directory for generated skill files

***

### version?

> `optional` **version?**: `string`

Defined in: [browser-compiler/src/compiler.ts:47](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/browser-compiler/src/compiler.ts#L47)

Target version or format variant