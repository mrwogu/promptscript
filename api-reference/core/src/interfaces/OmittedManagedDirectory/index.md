# OmittedManagedDirectory

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OmittedManagedDirectory

Defined in: [core/src/output-plan.ts:94](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/output-plan.ts#L94)

A managed directory of an output that a formatter omitted.

## Properties

### directory

> **directory**: `string`

Defined in: [core/src/output-plan.ts:98](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/output-plan.ts#L98)

Managed directory, project-relative

***

### owner

> **owner**: `string`

Defined in: [core/src/output-plan.ts:96](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/output-plan.ts#L96)

Target that owns the directory

***

### primaryFile

> **primaryFile**: `string`

Defined in: [core/src/output-plan.ts:100](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/output-plan.ts#L100)

File name of the omitted output, for example `index.json`