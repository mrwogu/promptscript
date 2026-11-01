# getTargetSkillPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getTargetSkillPath()

> **getTargetSkillPath**(`name`): [`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

Defined in: [core/src/target-catalog.ts:940](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/target-catalog.ts#L940)

Get the skill path configuration for a known target.

## Parameters

### name

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

The target name

## Returns

[`SkillPathConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/SkillPathConfig/index.md)

The skill path configuration (basePath and fileName are null if unsupported)