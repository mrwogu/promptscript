# ReleasesConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleasesConfig

Defined in: [core/src/types/config.ts:292](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L292)

Release configuration (`releases` in promptscript.yaml).

## Properties

### environments

> **environments**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)[]

Defined in: [core/src/types/config.ts:301](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L301)

Environment names in promotion order, first to last.
Each name is lowercase letters, digits and hyphens, starting with a letter.

#### Example

```ts
['staging', 'prod']
```

#### Min Items

1

#### Max Items

16

#### Unique Items

true