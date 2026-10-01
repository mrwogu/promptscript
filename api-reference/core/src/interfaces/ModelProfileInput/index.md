# ModelProfileInput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelProfileInput

Defined in: [core/src/types/models.ts:28](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L28)

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

Defined in: [core/src/types/models.ts:43](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L43)

Additional names that resolve to this profile

***

### apiId?

> `optional` **apiId?**: `string`

Defined in: [core/src/types/models.ts:41](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L41)

Provider API model identifier

***

### displayName?

> `optional` **displayName?**: `string`

Defined in: [core/src/types/models.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L39)

Human-readable name (e.g. 'Claude Opus 4.5')

***

### family?

> `optional` **family?**: `string`

Defined in: [core/src/types/models.ts:35](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L35)

Family grouping the versions of one model line (e.g. 'claude-opus').
The newest non-retired release of a family backs its floating alias.

***

### provider?

> `optional` **provider?**: `string`

Defined in: [core/src/types/models.ts:30](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L30)

Model provider (e.g. 'anthropic', 'openai', 'google', 'xai')

***

### releaseDate?

> `optional` **releaseDate?**: `string`

Defined in: [core/src/types/models.ts:49](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L49)

Release date in YYYY-MM-DD format

***

### retirementDate?

> `optional` **retirementDate?**: `string`

Defined in: [core/src/types/models.ts:51](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L51)

Date the provider stops (or stopped) serving the model, in YYYY-MM-DD format

***

### status?

> `optional` **status?**: [`ModelStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelStatus/index.md)

Defined in: [core/src/types/models.ts:45](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L45)

Lifecycle status

***

### successor?

> `optional` **successor?**: `string`

Defined in: [core/src/types/models.ts:47](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L47)

Profile id of the recommended replacement

***

### targets?

> `optional` **targets?**: `Record`\<`string`, `string`\>

Defined in: [core/src/types/models.ts:61](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L61)

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

Defined in: [core/src/types/models.ts:37](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L37)

Version inside the family (e.g. '4.5')