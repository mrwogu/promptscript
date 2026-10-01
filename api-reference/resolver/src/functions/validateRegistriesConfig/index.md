# validateRegistriesConfig()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateRegistriesConfig()

> **validateRegistriesConfig**(`registries`): [`RegistriesValidationResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RegistriesValidationResult/index.md)

Defined in: [resolver/src/alias-resolver.ts:89](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/alias-resolver.ts#L89)

Validate all alias entries in a registries configuration.

Checks that:
- The config is non-empty
- All alias names conform to the valid format (`@[a-z0-9][a-z0-9-]*`)
- All entries have a non-empty `url` field

## Parameters

### registries

[`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Registry alias configuration to validate

## Returns

[`RegistriesValidationResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RegistriesValidationResult/index.md)

Validation result with errors list

## Example

```typescript
validateRegistriesConfig({
  '@acme': 'https://github.com/acme/prs-standards.git',
  '@internal': { url: 'git@gitlab.internal.com:company/monorepo', root: 'packages/prs' },
});
// { valid: true, errors: [] }
```