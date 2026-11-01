# PromptReleaseVariantArm

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseVariantArm

Defined in: [core/src/types/prompt-bundle.ts:234](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L234)

A non-control arm of an experiment. A weight of 0 keeps the arm listed without traffic.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:244](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L244)

Content hash of the bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### variant

> **variant**: `string`

Defined in: [core/src/types/prompt-bundle.ts:239](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L239)

Arm name, unique within the experiment and never `control`.

#### Pattern

^(?!control$)[a-z][a-z0-9-]{0,31}$

***

### weight

> **weight**: `number`

Defined in: [core/src/types/prompt-bundle.ts:251](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L251)

Share of the assigned traffic in basis points.

#### As Type

integer

#### Minimum

0

#### Maximum

10000