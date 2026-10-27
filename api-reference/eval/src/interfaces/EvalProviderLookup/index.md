# EvalProviderLookup()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderLookup()

Defined in: [eval/src/provider.ts:50](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L50)

Provider lookup of a run, by provider name.

> **EvalProviderLookup**(`name`): [`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

Defined in: [eval/src/provider.ts:51](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L51)

Provider lookup of a run, by provider name.

## Parameters

### name

`string`

## Returns

[`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

## Properties

### secretIn?

> `optional` **secretIn?**: (`text`) => `string` \| `undefined`

Defined in: [eval/src/provider.ts:56](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L56)

Name of the secret variable whose value appears in `text`, if any. The run
checks every model of a suite with it, so a `${VAR}` in a profile stops it.

#### Parameters

##### text

`string`

#### Returns

`string` \| `undefined`