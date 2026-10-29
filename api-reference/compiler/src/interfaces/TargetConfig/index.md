# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [compiler/src/types.ts:126](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L126)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [compiler/src/types.ts:132](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L132)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [compiler/src/types.ts:128](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L128)

Whether this target is enabled

***

### guardsAsSkills?

> `optional` **guardsAsSkills?**: `boolean`

Defined in: [compiler/src/types.ts:148](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L148)

Generate skills from

#### Guards

named entries (Factory).

#### Default

```ts
true
```

***

### guardsSkillsListing?

> `optional` **guardsSkillsListing?**: `boolean`

Defined in: [compiler/src/types.ts:151](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L151)

List generated guard skills in main output file (Factory).

#### Default

```ts
true
```

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [compiler/src/types.ts:157](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L157)

Controls which skills are emitted for this target.

***

### output?

> `optional` **output?**: `string`

Defined in: [compiler/src/types.ts:130](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L130)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [compiler/src/types.ts:145](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L145)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

#### Default

```ts
'monolith'
```

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [compiler/src/types.ts:154](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L154)

Custom base directory for generated skill files.

***

### version?

> `optional` **version?**: `string`

Defined in: [compiler/src/types.ts:138](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L138)

Target version or format variant.
Use 'legacy' for deprecated formats.

#### Example

```ts
'legacy' | '1.0' | '2.0'
```