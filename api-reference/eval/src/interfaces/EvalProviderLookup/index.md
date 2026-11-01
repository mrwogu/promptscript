# EvalProviderLookup()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderLookup()

Defined in: [eval/src/provider.ts:52](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/provider.ts#L52)

Provider lookup of a run, by provider name.

> **EvalProviderLookup**(`name`): [`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

Defined in: [eval/src/provider.ts:53](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/provider.ts#L53)

Provider lookup of a run, by provider name.

## Parameters

### name

`string`

## Returns

[`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

## Properties

### secretIn?

> `optional` **secretIn?**: (`text`) => `string` \| `undefined`

Defined in: [eval/src/provider.ts:58](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/provider.ts#L58)

Name of the secret variable whose value appears in `text`, if any. The run
checks every model of a suite with it, so a `${VAR}` in a profile stops it.

#### Parameters

##### text

`string`

#### Returns

`string` \| `undefined`