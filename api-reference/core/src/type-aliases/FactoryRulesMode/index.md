# FactoryRulesMode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: FactoryRulesMode

> **FactoryRulesMode** = `"monolith"` \| `"split"`

Defined in: [core/src/types/config.ts:68](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L68)

Factory always-on rules output mode.
- `monolith`: Keep all rule content in AGENTS.md
- `split`: Emit rule content under .factory/rules