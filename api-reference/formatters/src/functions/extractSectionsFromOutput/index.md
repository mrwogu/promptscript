# extractSectionsFromOutput()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractSectionsFromOutput()

> **extractSectionsFromOutput**(`content`): `string`[]

Defined in: [formatters/src/section-registry.ts:50](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/section-registry.ts#L50)

Extract section headers from formatted output.
Works with both markdown (## section) and XML (<section>) formats.

## Parameters

### content

`string`

## Returns

`string`[]