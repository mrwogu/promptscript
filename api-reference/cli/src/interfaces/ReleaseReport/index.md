# ReleaseReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseReport

Defined in: [cli/src/utils/release-report.ts:168](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L168)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/release-report/v1.json"`

Defined in: [cli/src/utils/release-report.ts:169](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L169)

***

### base?

> `optional` **base?**: [`ReleaseBaseRef`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseBaseRef/index.md)

Defined in: [cli/src/utils/release-report.ts:178](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L178)

Present when status runs with --base

***

### changes

> **changes**: [`ReleaseChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseChange/index.md)[]

Defined in: [cli/src/utils/release-report.ts:174](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L174)

***

### command

> **command**: [`ReleaseCommandName`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseCommandName/index.md)

Defined in: [cli/src/utils/release-report.ts:171](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L171)

***

### dryRun

> **dryRun**: `boolean`

Defined in: [cli/src/utils/release-report.ts:173](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L173)

***

### environments

> **environments**: [`ReleaseEnvironmentStatus`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentStatus/index.md)[]

Defined in: [cli/src/utils/release-report.ts:175](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L175)

***

### errors

> **errors**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:182](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L182)

***

### gates?

> `optional` **gates?**: `ReleaseGateResult`[]

Defined in: [cli/src/utils/release-report.ts:180](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L180)

The gates of every prompt version a policy applies to; absent without prompt policies

***

### history?

> `optional` **history?**: [`ReleaseEnvironmentHistory`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentHistory/index.md)[]

Defined in: [cli/src/utils/release-report.ts:176](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L176)

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/release-report.ts:172](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L172)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/release-report.ts:170](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L170)

***

### warnings

> **warnings**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:181](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L181)