# ModelProfileInput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelProfileInput

Defined in: [core/src/types/models.ts:50](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L50)

Model profile declared in promptscript.yaml.

A key of `models.profiles` that matches a built-in profile id overrides only
the fields it sets. Any other key adds a new profile, so a team can use a
model before PromptScript ships it in the built-in catalog.

## Example

```ts
models:
  profiles:
    claude-opus-9:
      provider: anthropic
      family: claude-opus
      version: '9'
      displayName: Claude Opus 9
      apiId: claude-opus-9
      releaseDate: '2027-01-15'
```

## Properties

### aliases?

> `optional` **aliases?**: `string`[]

Defined in: [core/src/types/models.ts:65](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L65)

Additional names that resolve to this profile

***

### apiId?

> `optional` **apiId?**: `string`

Defined in: [core/src/types/models.ts:63](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L63)

Provider API model identifier

***

### displayName?

> `optional` **displayName?**: `string`

Defined in: [core/src/types/models.ts:61](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L61)

Human-readable name (e.g. 'Claude Opus 4.5')

***

### family?

> `optional` **family?**: `string`

Defined in: [core/src/types/models.ts:57](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L57)

Family grouping the versions of one model line (e.g. 'claude-opus').
The newest non-retired release of a family backs its floating alias.

***

### pricing?

> `optional` **pricing?**: [`ModelPricing`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelPricing/index.md)

Defined in: [core/src/types/models.ts:85](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L85)

List price per million tokens, for cost estimates

***

### provider?

> `optional` **provider?**: `string`

Defined in: [core/src/types/models.ts:52](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L52)

Model provider (e.g. 'anthropic', 'openai', 'google', 'xai')

***

### releaseDate?

> `optional` **releaseDate?**: `string`

Defined in: [core/src/types/models.ts:71](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L71)

Release date in YYYY-MM-DD format

***

### retirementDate?

> `optional` **retirementDate?**: `string`

Defined in: [core/src/types/models.ts:73](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L73)

Date the provider stops (or stopped) serving the model, in YYYY-MM-DD format

***

### status?

> `optional` **status?**: [`ModelStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelStatus/index.md)

Defined in: [core/src/types/models.ts:67](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L67)

Lifecycle status

***

### successor?

> `optional` **successor?**: `string`

Defined in: [core/src/types/models.ts:69](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L69)

Profile id of the recommended replacement

***

### targets?

> `optional` **targets?**: `Record`\<`string`, `string`\>

Defined in: [core/src/types/models.ts:83](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L83)

Native model names per target. A target listed here always receives this
name, even when its naming scheme or provider list would not map the model.
Keys are target names, matched case-insensitively. Only targets that write
a native model field use them; validation reports other keys.

#### Example

```ts
targets:
  github: Claude Opus 9 (Preview)
```

***

### version?

> `optional` **version?**: `string`

Defined in: [core/src/types/models.ts:59](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L59)

Version inside the family (e.g. '4.5')