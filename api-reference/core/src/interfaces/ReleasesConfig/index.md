# ReleasesConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleasesConfig

Defined in: [core/src/types/config.ts:213](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/config.ts#L213)

Release configuration (`releases` in promptscript.yaml).

## Properties

### environments

> **environments**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)[]

Defined in: [core/src/types/config.ts:222](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/config.ts#L222)

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