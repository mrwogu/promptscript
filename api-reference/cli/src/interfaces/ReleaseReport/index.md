# ReleaseReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseReport

Defined in: [cli/src/utils/release-report.ts:134](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L134)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/release-report/v1.json"`

Defined in: [cli/src/utils/release-report.ts:135](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L135)

***

### base?

> `optional` **base?**: [`ReleaseBaseRef`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseBaseRef/index.md)

Defined in: [cli/src/utils/release-report.ts:144](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L144)

Present when status runs with --base

***

### changes

> **changes**: [`ReleaseChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseChange/index.md)[]

Defined in: [cli/src/utils/release-report.ts:140](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L140)

***

### command

> **command**: [`ReleaseCommandName`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseCommandName/index.md)

Defined in: [cli/src/utils/release-report.ts:137](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L137)

***

### dryRun

> **dryRun**: `boolean`

Defined in: [cli/src/utils/release-report.ts:139](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L139)

***

### environments

> **environments**: [`ReleaseEnvironmentStatus`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentStatus/index.md)[]

Defined in: [cli/src/utils/release-report.ts:141](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L141)

***

### errors

> **errors**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:148](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L148)

***

### gates?

> `optional` **gates?**: `ReleaseGateResult`[]

Defined in: [cli/src/utils/release-report.ts:146](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L146)

The gates of every prompt version a policy applies to; absent without prompt policies

***

### history?

> `optional` **history?**: [`ReleaseEnvironmentHistory`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseEnvironmentHistory/index.md)[]

Defined in: [cli/src/utils/release-report.ts:142](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L142)

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/release-report.ts:138](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L138)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/release-report.ts:136](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L136)

***

### warnings

> **warnings**: [`ReleaseDiagnostic`](https://getpromptscript.dev/api-reference/cli/src/interfaces/ReleaseDiagnostic/index.md)[]

Defined in: [cli/src/utils/release-report.ts:147](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/release-report.ts#L147)