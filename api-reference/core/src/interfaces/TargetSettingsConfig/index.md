# TargetSettingsConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetSettingsConfig

Defined in: [core/src/types/config.ts:229](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L229)

Settings keys PromptScript writes to the target project settings file.

## Properties

### enabledPlugins?

> `optional` **enabledPlugins?**: `Record`\<`string`, `boolean`\>

Defined in: [core/src/types/config.ts:240](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L240)

Enabled plugins as `plugin@marketplace` to `true` or `false` (Claude, Factory).

#### Example

```ts
{ 'code-standards@acme-plugins': true }
```

***

### env?

> `optional` **env?**: `Record`\<`string`, `string`\>

Defined in: [core/src/types/config.ts:235](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L235)

Environment variables for every session (Claude only).

***

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/config.ts:231](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L231)

Default model ID (Claude, Factory).

***

### permissions?

> `optional` **permissions?**: [`TargetSettingsPermissions`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetSettingsPermissions/index.md)

Defined in: [core/src/types/config.ts:233](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L233)

Permission rules (Claude only).