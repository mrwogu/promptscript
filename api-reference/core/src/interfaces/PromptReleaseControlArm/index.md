# PromptReleaseControlArm

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseControlArm

Defined in: [core/src/types/prompt-bundle.ts:216](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L216)

The first arm of an experiment: the entry hash, with at least 1 basis point of traffic.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:223](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L223)

Content hash of the bundle, equal to the entry hash.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### variant

> **variant**: `"control"`

Defined in: [core/src/types/prompt-bundle.ts:218](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L218)

Arm name, always `control` for the first arm.

***

### weight

> **weight**: `number`

Defined in: [core/src/types/prompt-bundle.ts:230](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L230)

Share of the assigned traffic in basis points.

#### As Type

integer

#### Minimum

1

#### Maximum

10000