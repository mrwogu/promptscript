# classifyOutputResource()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: classifyOutputResource()

> **classifyOutputResource**(`target`, `path`, `skillBaseDir?`): [`OutputResourceKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputResourceKind/index.md)

Defined in: [core/src/output-resources.ts:125](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/output-resources.ts#L125)

Classify a planned output path by the target's catalog resources.

Unknown owners and paths no resource covers classify as `main`, so a
resource-only run never keeps files the selection did not name. A
configured `skillBaseDir` relocates skill outputs off the catalog default
path, so it classifies unmatched paths under it as `skills`.

## Parameters

### target

`string`

### path

`string`

### skillBaseDir?

`string`

## Returns

[`OutputResourceKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputResourceKind/index.md)