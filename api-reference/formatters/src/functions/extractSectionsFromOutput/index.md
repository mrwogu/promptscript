# extractSectionsFromOutput()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractSectionsFromOutput()

> **extractSectionsFromOutput**(`content`): `string`[]

Defined in: [formatters/src/section-registry.ts:50](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/formatters/src/section-registry.ts#L50)

Extract section headers from formatted output.
Works with both markdown (## section) and XML (<section>) formats.

## Parameters

### content

`string`

## Returns

`string`[]