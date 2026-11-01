# canonicalizeJson()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: canonicalizeJson()

> **canonicalizeJson**(`value`): `string`

Defined in: [core/src/utils/canonical-json.ts:89](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/utils/canonical-json.ts#L89)

Serialize a JSON value as RFC 8785 canonical JSON.

No whitespace, object keys sorted by UTF-16 code units, strings and numbers in
ECMAScript form. Properties set to `undefined` are skipped. A lone surrogate in a
string or key is an error, as RFC 8785 requires.

## Parameters

### value

`unknown`

A JSON value

## Returns

`string`

The canonical JSON text

## Throws

PSError for a non-finite number, a bigint, a function, a symbol, an
  `undefined` outside an object property, an array hole, a circular reference or
  a lone surrogate or an object that is not a plain object (a Date, a Map, a class instance). The message names the path, such as `model.params.temperature`.

## Example

```ts
canonicalizeJson({ b: 1, a: [true, null] }); // '{"a":[true,null],"b":1}'
```