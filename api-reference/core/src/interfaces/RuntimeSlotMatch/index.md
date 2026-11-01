# RuntimeSlotMatch

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RuntimeSlotMatch

Defined in: [core/src/utils/runtime-slots.ts:5](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/utils/runtime-slots.ts#L5)

One `{{` occurrence found in prompt text.

## Properties

### kind

> **kind**: `"slot"` \| `"escaped"` \| `"invalid"`

Defined in: [core/src/utils/runtime-slots.ts:11](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/utils/runtime-slots.ts#L11)

- `slot`: a valid `{{input.<name>}}`
- `escaped`: `\{{`, rendered as `{{`
- `invalid`: any other unescaped `{{`

***

### length

> **length**: `number`

Defined in: [core/src/utils/runtime-slots.ts:17](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/utils/runtime-slots.ts#L17)

UTF-16 length of the match

***

### name

> **name**: `string` \| `null`

Defined in: [core/src/utils/runtime-slots.ts:13](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/utils/runtime-slots.ts#L13)

Input name for a slot, `null` otherwise

***

### offset

> **offset**: `number`

Defined in: [core/src/utils/runtime-slots.ts:15](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/utils/runtime-slots.ts#L15)

UTF-16 offset of the match in the text