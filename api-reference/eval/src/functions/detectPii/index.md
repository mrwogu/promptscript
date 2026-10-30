# detectPii()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: detectPii()

> **detectPii**(`text`): [`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)[]

Defined in: [eval/src/dataset/pii.ts:203](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/dataset/pii.ts#L203)

Find personal data in one dataset value: an email address, a payment card
number of 13 to 19 digits that passes the Luhn check, or an IBAN of one of
30 European countries that passes the mod-97 check. Spaces and dashes
inside numbers are ignored.

## Parameters

### text

`string`

One string value of a row

## Returns

[`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)[]

The PII codes that fired, in email, card, IBAN order