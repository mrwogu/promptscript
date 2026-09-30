# DiffOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DiffOptions

Defined in: [cli/src/types.ts:136](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L136)

Options for the diff command.

## Properties

### all?

> `optional` **all?**: `boolean`

Defined in: [cli/src/types.ts:144](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L144)

Show diff for all targets at once

***

### build?

> `optional` **build?**: `string`

Defined in: [cli/src/types.ts:138](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L138)

Named build profile from config.builds

***

### color?

> `optional` **color?**: `boolean`

Defined in: [cli/src/types.ts:152](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L152)

Force colored output

***

### format?

> `optional` **format?**: `"text"` \| `"json"`

Defined in: [cli/src/types.ts:142](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L142)

Output format

***

### full?

> `optional` **full?**: `boolean`

Defined in: [cli/src/types.ts:146](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L146)

Show full diff without truncation

***

### includeContent?

> `optional` **includeContent?**: `boolean`

Defined in: [cli/src/types.ts:148](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L148)

Include canonical output content in JSON reports

***

### noPager?

> `optional` **noPager?**: `boolean`

Defined in: [cli/src/types.ts:150](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L150)

Disable pager (like git --no-pager)

***

### target?

> `optional` **target?**: `string`

Defined in: [cli/src/types.ts:140](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/types.ts#L140)

Specific target to diff