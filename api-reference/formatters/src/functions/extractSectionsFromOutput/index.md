# extractSectionsFromOutput()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractSectionsFromOutput()

> **extractSectionsFromOutput**(`content`): `string`[]

Defined in: [formatters/src/section-registry.ts:50](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/section-registry.ts#L50)

Extract section headers from formatted output.
Works with both markdown (## section) and XML (<section>) formats.

## Parameters

### content

`string`

## Returns

`string`[]