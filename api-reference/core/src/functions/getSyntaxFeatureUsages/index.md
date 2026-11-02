# getSyntaxFeatureUsages()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getSyntaxFeatureUsages()

> **getSyntaxFeatureUsages**(`ast`): [`SyntaxFeatureUsage`](https://getpromptscript.dev/api-reference/core/src/interfaces/SyntaxFeatureUsage/index.md)[]

Defined in: [core/src/syntax-versions.ts:300](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/syntax-versions.ts#L300)

Find all versioned non-block syntax features used by a parsed program.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

## Returns

[`SyntaxFeatureUsage`](https://getpromptscript.dev/api-reference/core/src/interfaces/SyntaxFeatureUsage/index.md)[]