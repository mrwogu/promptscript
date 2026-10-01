# isRuleExcludedForLocation()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isRuleExcludedForLocation()

> **isRuleExcludedForLocation**(`rule`, `loc`, `config`): `boolean`

Defined in: [validator/src/import-exclusions.ts:154](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/import-exclusions.ts#L154)

Check whether a rule is excluded for the given source location.

Exclusion is consumer-declared (promptscript.yaml `validation.excludes`)
and only ever applies to imported content, never to local project files.

Every covering exclude entry is evaluated, so overlapping or repeated
entries union their rules. An entry only suppresses findings while its
recorded commit matches the commit the lockfile pins for the import;
with a missing or stale commit the findings reappear (PS040 reports the
mismatch separately). `--ignore-hashes` skips the binding check.

## Parameters

### rule

#### id

`string`

#### name

`string`

### loc

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md) \| `undefined`

### config

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

## Returns

`boolean`