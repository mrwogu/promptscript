# qualifyAgentProperties()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: qualifyAgentProperties()

> **qualifyAgentProperties**(`content`, `namespace`, `source`, `importPath`, `importLocation`): `object`

Defined in: [core/src/agent-names.ts:199](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/agent-names.ts#L199)

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