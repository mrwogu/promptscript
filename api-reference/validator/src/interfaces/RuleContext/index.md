# RuleContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RuleContext

Defined in: [validator/src/types.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L54)

Context provided to validation rules.

## Properties

### ast

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [validator/src/types.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L56)

The AST being validated

***

### canonicalAst?

> `optional` **canonicalAst?**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

Defined in: [validator/src/types.ts:63](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L63)

Immutable canonical AST for rules that need ordered entries or provenance.

The legacy `ast` field remains during the compatibility window so existing
custom rules can migrate independently.

***

### config

> **config**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [validator/src/types.ts:65](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L65)

Validator configuration

***

### report

> **report**: (`msg`) => `void`

Defined in: [validator/src/types.ts:67](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L67)

Report a validation issue

#### Parameters

##### msg

`Omit`\<[`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md), `"ruleName"` \| `"ruleId"` \| `"severity"`\> & `object`

#### Returns

`void`