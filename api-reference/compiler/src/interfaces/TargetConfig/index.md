# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [compiler/src/types.ts:116](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L116)

Configuration for a single target.

## Properties

### convention?

> `optional` **convention?**: `string`

Defined in: [compiler/src/types.ts:122](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L122)

Output convention ('xml', 'markdown', or custom name)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [compiler/src/types.ts:118](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L118)

Whether this target is enabled

***

### guardsAsSkills?

> `optional` **guardsAsSkills?**: `boolean`

Defined in: [compiler/src/types.ts:138](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L138)

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

Defined in: [compiler/src/types.ts:141](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L141)

List generated guard skills in main output file (Factory).

#### Default

```ts
true
```

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [compiler/src/types.ts:147](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L147)

Controls which skills are emitted for this target.

***

### output?

> `optional` **output?**: `string`

Defined in: [compiler/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L120)

Custom output path

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [compiler/src/types.ts:135](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L135)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

#### Default

```ts
'monolith'
```

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [compiler/src/types.ts:144](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L144)

Custom base directory for generated skill files.

***

### version?

> `optional` **version?**: `string`

Defined in: [compiler/src/types.ts:128](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L128)

Target version or format variant.
Use 'legacy' for deprecated formats.

#### Example

```ts
'legacy' | '1.0' | '2.0'
```