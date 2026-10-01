# Validator

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: Validator

Defined in: [validator/src/validator.ts:42](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L42)

AST validator for PromptScript files.

Validates resolved AST for semantic correctness and compliance.

## Example

```typescript
import { Validator } from '@promptscript/validator';

const validator = new Validator({
  requiredGuards: ['@core/guards/compliance'],
  rules: { 'empty-block': 'warning' },
});

const result = validator.validate(ast);
if (!result.valid) {
  for (const err of result.errors) {
    console.error(`${err.ruleId}: ${err.message}`);
  }
}
```

## Constructors

### Constructor

> **new Validator**(`config?`): `Validator`

Defined in: [validator/src/validator.ts:53](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L53)

Create a new validator instance.

#### Parameters

##### config?

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md) = `{}`

Validator configuration

#### Returns

`Validator`

## Methods

### addRule()

> **addRule**(`rule`): `void`

Defined in: [validator/src/validator.ts:161](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L161)

Add a custom validation rule.

#### Parameters

##### rule

[`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

The rule to add

#### Returns

`void`

***

### getConfig()

> **getConfig**(): [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/validator.ts:183](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L183)

Get the current configuration.

#### Returns

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

***

### getRules()

> **getRules**(): [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)[]

Defined in: [validator/src/validator.ts:190](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L190)

Get all registered rules.

#### Returns

[`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)[]

***

### removeRule()

> **removeRule**(`ruleNameOrId`): `boolean`

Defined in: [validator/src/validator.ts:171](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L171)

Remove a validation rule by name or id.

#### Parameters

##### ruleNameOrId

`string`

The rule name or id to remove

#### Returns

`boolean`

True if the rule was found and removed

***

### updateConfig()

> **updateConfig**(`partial`): `void`

Defined in: [validator/src/validator.ts:74](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L74)

Update validator configuration after construction.
Allows the compiler to inject runtime data (registry references, lockfile, etc.)
that becomes available only after resolution.

#### Parameters

##### partial

`Partial`\<[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)\>

#### Returns

`void`

***

### validate()

> **validate**(`input`): [`ValidationResult`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationResult/index.md)

Defined in: [validator/src/validator.ts:88](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/validator.ts#L88)

Validate an AST.

#### Parameters

##### input

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

#### Returns

[`ValidationResult`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationResult/index.md)

Validation result with all messages