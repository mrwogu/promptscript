# qualifyAgentProperties()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: qualifyAgentProperties()

> **qualifyAgentProperties**(`content`, `namespace`, `source`, `importPath`, `importLocation`): `object`

Defined in: [core/src/agent-names.ts:199](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/agent-names.ts#L199)

Replace agent property names with an import-qualified namespace.

## Parameters

### content

[`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md) \| [`MixedContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/MixedContent/index.md)

### namespace

`string`

### source

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### importPath

`string`

### importLocation

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

## Returns

`object`

### content

> **content**: [`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md) \| [`MixedContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/MixedContent/index.md)

### provenance

> **provenance**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]