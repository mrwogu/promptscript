# SkillValidationSeverity

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: SkillValidationSeverity

> **SkillValidationSeverity** = `"error"` \| `"warning"`

Defined in: [resolver/src/skill-validation.ts:12](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/resolver/src/skill-validation.ts#L12)

Severity of a skill validation issue.
- `error`: violates the Agent Skills specification — must be fixed
- `warning`: legal per spec, but breaks quality/security/reproducibility recommendations