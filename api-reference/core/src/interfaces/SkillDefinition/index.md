# SkillDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillDefinition

Defined in: [core/src/types/ast.ts:764](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L764)

Typed representation of a skill in the

## Skills

block.

Currently skills are stored as Record<string, Value> in ObjectContent.
This interface provides typed access for skill-specific properties.

## Properties

### agent?

> `optional` **agent?**: `string`

Defined in: [core/src/types/ast.ts:782](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L782)

Agent to use

***

### allowedTools?

> `optional` **allowedTools?**: `string`[]

Defined in: [core/src/types/ast.ts:776](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L776)

Allowed tools

***

### composedFrom?

> `optional` **composedFrom?**: [`ComposedPhase`](https://getpromptscript.dev/api-reference/core/src/interfaces/ComposedPhase/index.md)[]

Defined in: [core/src/types/ast.ts:794](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L794)

Metadata about composed phases (set by resolver, not by user)

***

### content?

> `optional` **content?**: `string` \| [`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)

Defined in: [core/src/types/ast.ts:768](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L768)

Skill content/instructions

***

### context?

> `optional` **context?**: `string`

Defined in: [core/src/types/ast.ts:780](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L780)

Context mode

***

### description

> **description**: `string`

Defined in: [core/src/types/ast.ts:766](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L766)

Skill description (required)

***

### disableModelInvocation?

> `optional` **disableModelInvocation?**: `boolean`

Defined in: [core/src/types/ast.ts:778](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L778)

Disable model invocation

***

### examples?

> `optional` **examples?**: `Record`\<`string`, [`ExampleDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/ExampleDefinition/index.md)\>

Defined in: [core/src/types/ast.ts:790](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L790)

Structured examples for few-shot prompting

***

### inputs?

> `optional` **inputs?**: `Record`\<`string`, [`SkillContractField`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillContractField/index.md)\>

Defined in: [core/src/types/ast.ts:786](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L786)

Runtime inputs the skill expects

***

### outputs?

> `optional` **outputs?**: `Record`\<`string`, [`SkillContractField`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillContractField/index.md)\>

Defined in: [core/src/types/ast.ts:788](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L788)

Outputs the skill produces

***

### params?

> `optional` **params?**: [`ParamDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamDefinition/index.md)[]

Defined in: [core/src/types/ast.ts:770](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L770)

Template parameters for parameterization

***

### references?

> `optional` **references?**: `string`[]

Defined in: [core/src/types/ast.ts:792](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L792)

Reference files attached to skill context (paths resolved by resolver)

***

### requires?

> `optional` **requires?**: `string`[]

Defined in: [core/src/types/ast.ts:784](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L784)

Skills that must exist for this skill to work

***

### trigger?

> `optional` **trigger?**: `string`

Defined in: [core/src/types/ast.ts:772](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L772)

Trigger phrases

***

### userInvocable?

> `optional` **userInvocable?**: `boolean`

Defined in: [core/src/types/ast.ts:774](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L774)

Whether user can invoke directly