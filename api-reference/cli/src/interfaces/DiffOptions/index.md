# DiffOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DiffOptions

Defined in: [cli/src/types.ts:146](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L146)

Options for the diff command.

## Properties

### all?

> `optional` **all?**: `boolean`

Defined in: [cli/src/types.ts:154](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L154)

Show diff for all targets at once

***

### build?

> `optional` **build?**: `string`

Defined in: [cli/src/types.ts:148](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L148)

Named build profile from config.builds

***

### color?

> `optional` **color?**: `boolean`

Defined in: [cli/src/types.ts:162](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L162)

Force colored output

***

### format?

> `optional` **format?**: `"text"` \| `"json"`

Defined in: [cli/src/types.ts:152](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L152)

Output format

***

### full?

> `optional` **full?**: `boolean`

Defined in: [cli/src/types.ts:156](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L156)

Show full diff without truncation

***

### includeContent?

> `optional` **includeContent?**: `boolean`

Defined in: [cli/src/types.ts:158](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L158)

Include canonical output content in JSON reports

***

### noPager?

> `optional` **noPager?**: `boolean`

Defined in: [cli/src/types.ts:160](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L160)

Disable pager (like git --no-pager)

***

### target?

> `optional` **target?**: `string`

Defined in: [cli/src/types.ts:150](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/types.ts#L150)

Specific target to diff