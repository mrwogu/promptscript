# HookScriptDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: HookScriptDefinition

Defined in: [formatters/src/hook-adapters.ts:76](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/hook-adapters.ts#L76)

## Properties

### args

> **args**: `string`[]

Defined in: [formatters/src/hook-adapters.ts:82](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/hook-adapters.ts#L82)

Additional script arguments.

***

### interpreter

> **interpreter**: `"python3"` \| `"python"` \| `"node"` \| `"deno"` \| `"bun"` \| `"ruby"` \| `"php"` \| `"perl"` \| `"bash"` \| `"sh"` \| `"zsh"` \| `"pwsh"` \| `"powershell"`

Defined in: [formatters/src/hook-adapters.ts:80](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/hook-adapters.ts#L80)

Portable interpreter name.

***

### path

> **path**: `string`

Defined in: [formatters/src/hook-adapters.ts:78](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/hook-adapters.ts#L78)

Script path under .promptscript/scripts/.