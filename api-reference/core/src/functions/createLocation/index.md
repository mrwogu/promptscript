# createLocation()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createLocation()

> **createLocation**(`file`, `line`, `column`, `offset?`): [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/utils/diagnostic.ts:166](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L166)

Create a SourceLocation object.

## Parameters

### file

`string`

File path

### line

`number`

Line number (1-indexed)

### column

`number`

Column number (1-indexed)

### offset?

`number`

Optional byte offset

## Returns

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

SourceLocation object

## Example

```typescript
createLocation('project.prs', 10, 5)
// { file: 'project.prs', line: 10, column: 5 }

createLocation('project.prs', 10, 5, 150)
// { file: 'project.prs', line: 10, column: 5, offset: 150 }
```