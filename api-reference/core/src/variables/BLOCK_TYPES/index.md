# BLOCK_TYPES

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: BLOCK\_TYPES

> `const` **BLOCK\_TYPES**: readonly \[`"identity"`, `"context"`, `"standards"`, `"restrictions"`, `"knowledge"`, `"shortcuts"`, `"commands"`, `"guards"`, `"params"`, `"skills"`, `"local"`, `"agents"`, `"workflows"`, `"hooks"`, `"mcpServers"`, `"plugins"`, `"prompts"`, `"examples"`\]

Defined in: [core/src/types/constants.ts:11](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/constants.ts#L11)

All known block type names in PromptScript.

## Example

```typescript
if (BLOCK_TYPES.includes(blockName)) {
  // Known block type
}
```