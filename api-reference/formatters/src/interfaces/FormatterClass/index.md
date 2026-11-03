# FormatterClass

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterClass

Defined in: [formatters/src/types.ts:220](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L220)

Static interface for formatter classes.

Enforces that every formatter class provides a static `getSupportedVersions()`
method returning its version configuration. TypeScript cannot enforce static
methods via `implements`, so this type is used at registration time to
provide compile-time safety.

## Example

```ts
// This will type-check:
FormatterRegistry.register('claude', ClaudeFormatter);

// This will fail at compile time if MissingFormatter lacks getSupportedVersions():
FormatterRegistry.register('missing', MissingFormatter);
```

## Constructors

### Constructor

> **new FormatterClass**(): [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

Defined in: [formatters/src/types.ts:222](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L222)

Create a new formatter instance

#### Returns

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

## Methods

### getSupportedVersions()

> **getSupportedVersions**(): [`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)

Defined in: [formatters/src/types.ts:224](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L224)

Return version configuration for this formatter

#### Returns

[`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)