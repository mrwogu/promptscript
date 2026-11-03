# getTargetSkillPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getTargetSkillPath()

> **getTargetSkillPath**(`name`): [`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

Defined in: [core/src/target-catalog.ts:944](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/target-catalog.ts#L944)

Get the skill path configuration for a known target.

## Parameters

### name

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

The target name

## Returns

[`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

The skill path configuration (basePath and fileName are null if unsupported)