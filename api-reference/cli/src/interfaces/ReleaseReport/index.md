# ReleaseReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseReport

Defined in: [cli/src/utils/release-report.ts:216](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L216)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/release-report/v1.json"`

Defined in: [cli/src/utils/release-report.ts:217](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L217)

***

### base?

> `optional` **base?**: [`ReleaseBaseRef`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseBaseRef/index.md)

Defined in: [cli/src/utils/release-report.ts:226](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L226)

Present when status runs with --base

***

### changes

> **changes**: [`ReleaseChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseChange/index.md)[]

Defined in: [cli/src/utils/release-report.ts:222](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L222)

***

### command

> **command**: [`ReleaseCommandName`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseCommandName/index.md)

Defined in: [cli/src/utils/release-report.ts:219](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L219)

***

### dryRun

> **dryRun**: `boolean`

Defined in: [cli/src/utils/release-report.ts:221](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L221)

***

### environments

> **environments**: [`ReleaseEnvironmentStatus`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentStatus/index.md)[]

Defined in: [cli/src/utils/release-report.ts:223](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L223)

***

### errors

> **errors**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:232](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L232)

***

### gates?

> `optional` **gates?**: `ReleaseGateResult`[]

Defined in: [cli/src/utils/release-report.ts:228](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L228)

The gates of every prompt version a policy applies to; absent without prompt policies

***

### history?

> `optional` **history?**: [`ReleaseEnvironmentHistory`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentHistory/index.md)[]

Defined in: [cli/src/utils/release-report.ts:224](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L224)

***

### models?

> `optional` **models?**: `ReleaseModelStatus`[]

Defined in: [cli/src/utils/release-report.ts:230](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L230)

Present when status runs with --check-models

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/release-report.ts:220](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L220)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/release-report.ts:218](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L218)

***

### warnings

> **warnings**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:231](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/release-report.ts#L231)