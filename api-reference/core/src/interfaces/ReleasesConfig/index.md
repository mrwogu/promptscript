# ReleasesConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleasesConfig

Defined in: [core/src/types/config.ts:286](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L286)

Release configuration (`releases` in promptscript.yaml).

## Properties

### environments

> **environments**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)[]

Defined in: [core/src/types/config.ts:295](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L295)

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