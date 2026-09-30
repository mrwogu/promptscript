# validateRegistriesConfig()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateRegistriesConfig()

> **validateRegistriesConfig**(`registries`): [`RegistriesValidationResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RegistriesValidationResult/index.md)

Defined in: [resolver/src/alias-resolver.ts:89](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L89)

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