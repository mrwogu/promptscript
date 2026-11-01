# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [compiler/src/types.ts:128](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L128)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [compiler/src/types.ts:134](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L134)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [compiler/src/types.ts:130](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L130)

Whether this target is enabled

***

### guardsAsSkills?

> `optional` **guardsAsSkills?**: `boolean`

Defined in: [compiler/src/types.ts:150](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L150)

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

Defined in: [compiler/src/types.ts:153](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L153)

List generated guard skills in main output file (Factory).

#### Default

```ts
true
```

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [compiler/src/types.ts:159](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L159)

Controls which skills are emitted for this target.

***

### output?

> `optional` **output?**: `string`

Defined in: [compiler/src/types.ts:132](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L132)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [compiler/src/types.ts:147](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L147)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

#### Default

```ts
'monolith'
```

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [compiler/src/types.ts:156](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L156)

Custom base directory for generated skill files.

***

### version?

> `optional` **version?**: `string`

Defined in: [compiler/src/types.ts:140](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L140)

Target version or format variant.
Use 'legacy' for deprecated formats.

#### Example

```ts
'legacy' | '1.0' | '2.0'
```