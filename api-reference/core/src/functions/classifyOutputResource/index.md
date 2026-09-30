# classifyOutputResource()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: classifyOutputResource()

> **classifyOutputResource**(`target`, `path`, `skillBaseDir?`): [`OutputResourceKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputResourceKind/index.md)

Defined in: [core/src/output-resources.ts:125](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-resources.ts#L125)

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