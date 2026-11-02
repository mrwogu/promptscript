# FactoryRulesMode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: FactoryRulesMode

> **FactoryRulesMode** = `"monolith"` \| `"split"`

Defined in: [core/src/types/config.ts:68](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/config.ts#L68)

Factory always-on rules output mode.
- `monolith`: Keep all rule content in AGENTS.md
- `split`: Emit rule content under .factory/rules