# SkillValidationSeverity

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: SkillValidationSeverity

> **SkillValidationSeverity** = `"error"` \| `"warning"`

Defined in: [resolver/src/skill-validation.ts:12](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/skill-validation.ts#L12)

Severity of a skill validation issue.
- `error`: violates the Agent Skills specification — must be fixed
- `warning`: legal per spec, but breaks quality/security/reproducibility recommendations