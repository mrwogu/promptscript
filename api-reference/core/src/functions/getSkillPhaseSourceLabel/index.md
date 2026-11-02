# getSkillPhaseSourceLabel()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getSkillPhaseSourceLabel()

> **getSkillPhaseSourceLabel**(`source`, `projectRoot?`): `string`

Defined in: [core/src/skill-phase.ts:26](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/skill-phase.ts#L26)

Build the portable label used in a `composed-from` marker.

The label is the source path relative to the project root, with `/`
separators. When the source is outside the root, or no root is given,
only the file name is returned. An empty root means the virtual root,
where Windows drive paths also fall back to the file name.
Absolute paths and `..` segments are never returned.

## Parameters

### source

`string`

### projectRoot?

`string`

## Returns

`string`