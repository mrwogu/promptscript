# FactoryRulesMode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: FactoryRulesMode

> **FactoryRulesMode** = `"monolith"` \| `"split"`

Defined in: [core/src/types/config.ts:77](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L77)

Factory always-on rules output mode.
- `monolith`: Keep all rule content in AGENTS.md
- `split`: Emit rule content under .factory/rules