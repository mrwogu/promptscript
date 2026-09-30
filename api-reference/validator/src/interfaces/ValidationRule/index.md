# ValidationRule

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationRule

Defined in: [validator/src/types.ts:75](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L75)

A validation rule definition.

## Properties

### defaultSeverity

> **defaultSeverity**: [`Severity`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)

Defined in: [validator/src/types.ts:83](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L83)

Default severity level

***

### description

> **description**: `string`

Defined in: [validator/src/types.ts:81](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L81)

Rule description

***

### id

> **id**: `string`

Defined in: [validator/src/types.ts:77](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L77)

Unique rule identifier (e.g., "PS001")

***

### name

> **name**: `string`

Defined in: [validator/src/types.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L79)

Rule name (e.g., "required-meta-id")

***

### validate

> **validate**: (`ctx`) => `void`

Defined in: [validator/src/types.ts:85](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L85)

Validation function

#### Parameters

##### ctx

[`RuleContext`](https://getpromptscript.dev/api-reference/validator/src/interfaces/RuleContext/index.md)

#### Returns

`void`