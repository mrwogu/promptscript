# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [browser-compiler/src/compiler.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L35)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [browser-compiler/src/compiler.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L41)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [browser-compiler/src/compiler.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L37)

Whether this target is enabled

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [browser-compiler/src/compiler.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L52)

Controls which skills are emitted for this target

***

### output?

> `optional` **output?**: `string`

Defined in: [browser-compiler/src/compiler.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L39)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [browser-compiler/src/compiler.ts:48](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L48)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [browser-compiler/src/compiler.ts:50](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L50)

Custom base directory for generated skill files

***

### version?

> `optional` **version?**: `string`

Defined in: [browser-compiler/src/compiler.ts:43](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/compiler.ts#L43)

Target version or format variant