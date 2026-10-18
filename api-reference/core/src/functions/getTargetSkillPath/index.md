# getTargetSkillPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getTargetSkillPath()

> **getTargetSkillPath**(`name`): [`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

Defined in: [core/src/target-catalog.ts:888](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/target-catalog.ts#L888)

Get the skill path configuration for a known target.

## Parameters

### name

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

The target name

## Returns

[`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

The skill path configuration (basePath and fileName are null if unsupported)