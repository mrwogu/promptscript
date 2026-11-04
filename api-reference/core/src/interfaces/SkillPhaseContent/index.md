# SkillPhaseContent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillPhaseContent

Defined in: [core/src/skill-phase.ts:2](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/skill-phase.ts#L2)

The resolved content needed to render one composed skill phase.

## Properties

### contextBlocks

> **contextBlocks**: `object`[]

Defined in: [core/src/skill-phase.ts:8](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/skill-phase.ts#L8)

Context blocks in their resolved display order.

#### blockType

> **blockType**: `string`

#### text

> **text**: `string`

***

### name

> **name**: `string`

Defined in: [core/src/skill-phase.ts:6](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/skill-phase.ts#L6)

Phase display name, including any authored alias.

***

### phaseNumber

> **phaseNumber**: `number`

Defined in: [core/src/skill-phase.ts:4](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/skill-phase.ts#L4)

One-based phase position in the composed skill.

***

### skillContent?

> `optional` **skillContent?**: `string`

Defined in: [core/src/skill-phase.ts:10](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/skill-phase.ts#L10)

Instructions appended after the context blocks, when present.