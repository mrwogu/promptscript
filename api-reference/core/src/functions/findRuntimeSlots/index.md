# findRuntimeSlots()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findRuntimeSlots()

> **findRuntimeSlots**(`text`): [`RuntimeSlotMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/RuntimeSlotMatch/index.md)[]

Defined in: [core/src/utils/runtime-slots.ts:40](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/utils/runtime-slots.ts#L40)

Find the runtime slots, escapes and malformed `{{` in prompt text.

A slot is exactly `{{input.<name>}}` with `<name>` matching `[A-Za-z_][A-Za-z0-9_]*`.
`\{{` is an escape that covers the backslash and both braces. Any other `{{` is
invalid and covers everything up to and including the next `}}`, or only the
braces when nothing closes it. Text inside a match is never scanned again.

## Parameters

### text

`string`

Prompt message text

## Returns

[`RuntimeSlotMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/RuntimeSlotMatch/index.md)[]

Matches in text order

## Example

```ts
findRuntimeSlots('Hi {{input.name}}');
// [{ kind: 'slot', name: 'name', offset: 3, length: 14 }]
```