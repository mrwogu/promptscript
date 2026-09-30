# validateAlias()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateAlias()

> **validateAlias**(`alias`): `boolean`

Defined in: [resolver/src/alias-resolver.ts:65](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/alias-resolver.ts#L65)

Validate that an alias name conforms to the required format.

Valid aliases match `@[a-z0-9][a-z0-9-]*` (e.g., `@acme`, `@my-org`).
Uppercase letters, spaces, underscores, and other special characters are rejected.

## Parameters

### alias

`string`

The alias name to validate (e.g., `@acme`)

## Returns

`boolean`

True if the alias is valid

## Example

```typescript
validateAlias('@acme');     // true
validateAlias('@my-org');   // true
validateAlias('@Acme');     // false — uppercase not allowed
validateAlias('acme');      // false — missing '@'
validateAlias('@');         // false — no name after '@'
```