# buildSkillPhaseSection()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildSkillPhaseSection()

> **buildSkillPhaseSection**(`phase`, `sourceLabel`): `string`

Defined in: [core/src/skill-phase.ts:64](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/skill-phase.ts#L64)

Render a composed skill phase with a portable source marker.
Callers build the label with `getSkillPhaseSourceLabel`, so the marker never
holds an absolute path. Full source paths remain in the resolver's
provenance metadata.

## Parameters

### phase

[`SkillPhaseContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPhaseContent/index.md)

### sourceLabel

`string`

## Returns

`string`