# SourceLocation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SourceLocation

Defined in: [core/src/types/source.ts:4](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/source.ts#L4)

Represents a location in source code.

## Properties

### column

> **column**: `number`

Defined in: [core/src/types/source.ts:10](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/source.ts#L10)

Column number (1-indexed)

***

### file

> **file**: `string`

Defined in: [core/src/types/source.ts:6](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/source.ts#L6)

File path

***

### line

> **line**: `number`

Defined in: [core/src/types/source.ts:8](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/source.ts#L8)

Line number (1-indexed)

***

### offset?

> `optional` **offset?**: `number`

Defined in: [core/src/types/source.ts:12](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/source.ts#L12)

Byte offset from start of file