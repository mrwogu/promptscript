# getSyntaxFeatureUsages()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getSyntaxFeatureUsages()

> **getSyntaxFeatureUsages**(`ast`): [`SyntaxFeatureUsage`](https://getpromptscript.dev/api-reference/core/src/interfaces/SyntaxFeatureUsage/index.md)[]

Defined in: [core/src/syntax-versions.ts:298](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/syntax-versions.ts#L298)

Find all versioned non-block syntax features used by a parsed program.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

## Returns

[`SyntaxFeatureUsage`](https://getpromptscript.dev/api-reference/core/src/interfaces/SyntaxFeatureUsage/index.md)[]