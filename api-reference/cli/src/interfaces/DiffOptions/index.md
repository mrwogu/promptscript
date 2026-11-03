# DiffOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DiffOptions

Defined in: [cli/src/types.ts:151](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L151)

Options for the diff command.

## Properties

### all?

> `optional` **all?**: `boolean`

Defined in: [cli/src/types.ts:159](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L159)

Show diff for all targets at once

***

### build?

> `optional` **build?**: `string`

Defined in: [cli/src/types.ts:153](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L153)

Named build profile from config.builds

***

### color?

> `optional` **color?**: `boolean`

Defined in: [cli/src/types.ts:167](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L167)

Force colored output

***

### format?

> `optional` **format?**: `"text"` \| `"json"`

Defined in: [cli/src/types.ts:157](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L157)

Output format

***

### full?

> `optional` **full?**: `boolean`

Defined in: [cli/src/types.ts:161](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L161)

Show full diff without truncation

***

### includeContent?

> `optional` **includeContent?**: `boolean`

Defined in: [cli/src/types.ts:163](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L163)

Include canonical output content in JSON reports

***

### noPager?

> `optional` **noPager?**: `boolean`

Defined in: [cli/src/types.ts:165](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L165)

Disable pager (like git --no-pager)

***

### target?

> `optional` **target?**: `string`

Defined in: [cli/src/types.ts:155](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/types.ts#L155)

Specific target to diff