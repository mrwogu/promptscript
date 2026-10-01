# createCompositeRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createCompositeRegistry()

> **createCompositeRegistry**(`registries`): [`CompositeRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/CompositeRegistry/index.md)

Defined in: [resolver/src/registry.ts:453](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L453)

Create a composite registry from multiple sources.

## Parameters

### registries

[`Registry`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)[]

Registries to combine

## Returns

[`CompositeRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/CompositeRegistry/index.md)

CompositeRegistry instance

## Example

```typescript
const registry = createCompositeRegistry([
  createFileSystemRegistry('/local/registry'),
  createHttpRegistry({ baseUrl: 'https://registry.example.com' }),
]);
```