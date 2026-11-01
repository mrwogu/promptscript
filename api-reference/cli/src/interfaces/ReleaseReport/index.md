# ReleaseReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseReport

Defined in: [cli/src/utils/release-report.ts:193](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L193)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/release-report/v1.json"`

Defined in: [cli/src/utils/release-report.ts:194](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L194)

***

### base?

> `optional` **base?**: [`ReleaseBaseRef`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseBaseRef/index.md)

Defined in: [cli/src/utils/release-report.ts:203](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L203)

Present when status runs with --base

***

### changes

> **changes**: [`ReleaseChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseChange/index.md)[]

Defined in: [cli/src/utils/release-report.ts:199](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L199)

***

### command

> **command**: [`ReleaseCommandName`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseCommandName/index.md)

Defined in: [cli/src/utils/release-report.ts:196](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L196)

***

### dryRun

> **dryRun**: `boolean`

Defined in: [cli/src/utils/release-report.ts:198](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L198)

***

### environments

> **environments**: [`ReleaseEnvironmentStatus`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentStatus/index.md)[]

Defined in: [cli/src/utils/release-report.ts:200](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L200)

***

### errors

> **errors**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:209](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L209)

***

### gates?

> `optional` **gates?**: `ReleaseGateResult`[]

Defined in: [cli/src/utils/release-report.ts:205](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L205)

The gates of every prompt version a policy applies to; absent without prompt policies

***

### history?

> `optional` **history?**: [`ReleaseEnvironmentHistory`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentHistory/index.md)[]

Defined in: [cli/src/utils/release-report.ts:201](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L201)

***

### models?

> `optional` **models?**: `ReleaseModelStatus`[]

Defined in: [cli/src/utils/release-report.ts:207](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L207)

Present when status runs with --check-models

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/release-report.ts:197](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L197)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/release-report.ts:195](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L195)

***

### warnings

> **warnings**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:208](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/utils/release-report.ts#L208)