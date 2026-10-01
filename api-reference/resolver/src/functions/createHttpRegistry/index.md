# createHttpRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createHttpRegistry()

> **createHttpRegistry**(`options`): [`HttpRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/HttpRegistry/index.md)

Defined in: [resolver/src/registry.ts:435](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L435)

Create an HTTP-based registry.

## Parameters

### options

[`HttpRegistryOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/HttpRegistryOptions/index.md)

HTTP registry options

## Returns

[`HttpRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/HttpRegistry/index.md)

HttpRegistry instance

## Example

```typescript
const registry = createHttpRegistry({
  baseUrl: 'https://registry.example.com',
  auth: { type: 'bearer', token: 'your-token' },
  cache: { enabled: true, ttl: 300000 },
  retry: { maxRetries: 3, initialDelay: 1000 },
});
```