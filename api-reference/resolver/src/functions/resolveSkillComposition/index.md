# resolveSkillComposition()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveSkillComposition()

> **resolveSkillComposition**(`ast`, `options`): `Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)\>

Defined in: [resolver/src/skill-composition.ts:96](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/skill-composition.ts#L96)

Resolve inline `@use` declarations inside `@skills` blocks.

For each inline `@use`, the referenced sub-skill is loaded through the
full resolver pipeline, its skill definition and context blocks are
extracted, and the result is flattened into the parent skill as a
numbered phase section.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Program AST that may contain

### options

[`CompositionOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CompositionOptions/index.md)

Composition resolution options

## Returns

`Promise`\<[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)\>

Updated AST with inline uses resolved and consumed

## Skills

blocks with inlineUses