# MaxExperimentWeightPolicy

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MaxExperimentWeightPolicy

Defined in: [core/src/types/policy.ts:207](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L207)

Max-experiment-weight policy: caps the traffic share of a non-control arm of a label
experiment. Arms above `maxWeight` need `approvals`, and nothing passes above `ceiling`.

## Extends

- [`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md)

## Properties

### approvals?

> `optional` **approvals?**: [`RequiredApproval`](https://getpromptscript.dev/api-reference/core/src/interfaces/RequiredApproval/index.md)[]

Defined in: [core/src/types/policy.ts:226](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L226)

Approvals per role an arm above `maxWeight` needs. Absent means the cap is hard.

#### Min Items

1

***

### ceiling?

> `optional` **ceiling?**: `number`

Defined in: [core/src/types/policy.ts:233](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L233)

Percent above which no arm passes, at most two decimals and at least `maxWeight`.
Only with `approvals`.

#### Minimum

0

#### Maximum

100

***

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/policy.ts:32](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L32)

Human-readable description

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`description`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#description)

***

### environments?

> `optional` **environments?**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)[]

Defined in: [core/src/types/policy.ts:215](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L215)

Environments from `releases.environments` the policy applies to. Absent means all.

#### Min Items

1

***

### kind

> **kind**: `"max-experiment-weight"`

Defined in: [core/src/types/policy.ts:208](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L208)

Policy kind discriminator

#### Overrides

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`kind`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#kind)

***

### match?

> `optional` **match?**: [`PromptPolicyMatch`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptPolicyMatch/index.md)

Defined in: [core/src/types/policy.ts:210](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L210)

Prompts the policy applies to

***

### maxWeight

> **maxWeight**: `number`

Defined in: [core/src/types/policy.ts:221](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L221)

Percent of traffic an arm may get without extra approvals, at most two decimals

#### Minimum

0

#### Maximum

100

***

### name

> **name**: `string`

Defined in: [core/src/types/policy.ts:30](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L30)

Unique policy name within the config

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`name`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#name)

***

### severity

> **severity**: [`PolicySeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicySeverity/index.md)

Defined in: [core/src/types/policy.ts:36](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L36)

Violation severity

#### Inherited from

[`BasePolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md).[`severity`](https://getpromptscript.dev/api-reference/core/src/interfaces/BasePolicyDefinition/index.md#severity)