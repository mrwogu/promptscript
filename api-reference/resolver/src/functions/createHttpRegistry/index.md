# createHttpRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createHttpRegistry()

> **createHttpRegistry**(`options`): [`HttpRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/HttpRegistry/index.md)

Defined in: [resolver/src/registry.ts:435](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/registry.ts#L435)

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