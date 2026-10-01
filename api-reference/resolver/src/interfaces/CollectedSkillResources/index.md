# CollectedSkillResources

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CollectedSkillResources

Defined in: [resolver/src/skill-resources.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-resources.ts#L18)

Resource files that belong to a SKILL.md, plus any problems found while
loading the explicitly declared ones.

## Properties

### errors

> **errors**: [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]

Defined in: [resolver/src/skill-resources.ts:22](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-resources.ts#L22)

Errors raised by `references:` / `scripts:` frontmatter entries

***

### resources

> **resources**: `SkillResource`[]

Defined in: [resolver/src/skill-resources.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-resources.ts#L20)

Files to ship alongside the skill, deduplicated by relative path