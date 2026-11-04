# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [compiler/src/types.ts:129](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L129)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [compiler/src/types.ts:135](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L135)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [compiler/src/types.ts:131](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L131)

Whether this target is enabled

***

### excludeAgents?

> `optional` **excludeAgents?**: `string`[]

Defined in: [compiler/src/types.ts:166](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L166)

Agent names never emitted for this target.

***

### guardsAsSkills?

> `optional` **guardsAsSkills?**: `boolean`

Defined in: [compiler/src/types.ts:151](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L151)

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

Defined in: [compiler/src/types.ts:154](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L154)

List generated guard skills in main output file (Factory).

#### Default

```ts
true
```

***

### includeAgents?

> `optional` **includeAgents?**: `boolean` \| `string`[]

Defined in: [compiler/src/types.ts:163](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L163)

Controls which agents are emitted for this target.

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [compiler/src/types.ts:160](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L160)

Controls which skills are emitted for this target.

***

### output?

> `optional` **output?**: `string`

Defined in: [compiler/src/types.ts:133](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L133)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [compiler/src/types.ts:148](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L148)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

#### Default

```ts
'monolith'
```

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [compiler/src/types.ts:157](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L157)

Custom base directory for generated skill files.

***

### version?

> `optional` **version?**: `string`

Defined in: [compiler/src/types.ts:141](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L141)

Target version or format variant.
Use 'legacy' for deprecated formats.

#### Example

```ts
'legacy' | '1.0' | '2.0'
```