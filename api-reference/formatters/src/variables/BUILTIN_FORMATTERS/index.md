# BUILTIN_FORMATTERS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: BUILTIN\_FORMATTERS

> `const` **BUILTIN\_FORMATTERS**: `object`

Defined in: [formatters/src/builtin-formatters.ts:80](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/builtin-formatters.ts#L80)

Exhaustive map of built-in target names to their formatter classes.
`satisfies Record<KnownTarget, FormatterClass>` ensures every known
target has a formatter.

## Type Declaration

### adal

> `readonly` **adal**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `AdalFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### adal.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### aider

> `readonly` **aider**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `AiderFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### aider.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### amazon-q

> `readonly` **amazon-q**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `AmazonQFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### amazon-q.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### amp

> `readonly` **amp**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `AmpFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### amp.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### antigravity

> `readonly` **antigravity**: *typeof* [`AntigravityFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/AntigravityFormatter/index.md) = `AntigravityFormatter`

### augment

> `readonly` **augment**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `AugmentFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### augment.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### claude

> `readonly` **claude**: *typeof* [`ClaudeFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/ClaudeFormatter/index.md) = `ClaudeFormatter`

### cline

> `readonly` **cline**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `ClineFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### cline.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### codebuddy

> `readonly` **codebuddy**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `CodeBuddyFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### codebuddy.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### codex

> `readonly` **codex**: *typeof* [`CodexFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/CodexFormatter/index.md) = `CodexFormatter`

### command-code

> `readonly` **command-code**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `CommandCodeFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### command-code.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### continue

> `readonly` **continue**: *typeof* [`ContinueFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/ContinueFormatter/index.md) = `ContinueFormatter`

### cortex

> `readonly` **cortex**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `CortexFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### cortex.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### crush

> `readonly` **crush**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `CrushFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### crush.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### cursor

> `readonly` **cursor**: *typeof* [`CursorFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/CursorFormatter/index.md) = `CursorFormatter`

### deep-agents

> `readonly` **deep-agents**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `DeepAgentsFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### deep-agents.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### devin

> `readonly` **devin**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `DevinFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### devin.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### factory

> `readonly` **factory**: *typeof* [`FactoryFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/FactoryFormatter/index.md) = `FactoryFormatter`

### forgecode

> `readonly` **forgecode**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `ForgecodeFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### forgecode.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### gemini

> `readonly` **gemini**: *typeof* [`GeminiFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/GeminiFormatter/index.md) = `GeminiFormatter`

### github

> `readonly` **github**: *typeof* [`GitHubFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/GitHubFormatter/index.md) = `GitHubFormatter`

### gitlab-duo

> `readonly` **gitlab-duo**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `GitlabDuoFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### gitlab-duo.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### goose

> `readonly` **goose**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `GooseFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### goose.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### grok

> `readonly` **grok**: *typeof* [`GrokFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/GrokFormatter/index.md) = `GrokFormatter`

### hermes

> `readonly` **hermes**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `HermesFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### hermes.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### iflow

> `readonly` **iflow**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `IflowFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### iflow.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### jules

> `readonly` **jules**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `JulesFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### jules.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### junie

> `readonly` **junie**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `JunieFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### junie.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### kilo

> `readonly` **kilo**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `KiloFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### kilo.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### kimi

> `readonly` **kimi**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `KimiFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### kimi.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### kiro

> `readonly` **kiro**: *typeof* [`KiroFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/KiroFormatter/index.md) = `KiroFormatter`

### kode

> `readonly` **kode**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `KodeFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### kode.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### mcpjam

> `readonly` **mcpjam**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `McpjamFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### mcpjam.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### mimo

> `readonly` **mimo**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `MimoFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### mimo.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### mistral-vibe

> `readonly` **mistral-vibe**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `MistralVibeFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### mistral-vibe.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### mux

> `readonly` **mux**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `MuxFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### mux.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### neovate

> `readonly` **neovate**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `NeovateFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### neovate.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### openclaw

> `readonly` **openclaw**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `OpenClawFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### openclaw.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### opencode

> `readonly` **opencode**: *typeof* [`OpenCodeFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/OpenCodeFormatter/index.md) = `OpenCodeFormatter`

### openhands

> `readonly` **openhands**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `OpenHandsFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### openhands.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### pi

> `readonly` **pi**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `PiFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### pi.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### pochi

> `readonly` **pochi**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `PochiFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### pochi.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### qoder

> `readonly` **qoder**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `QoderFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### qoder.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### qwen-code

> `readonly` **qwen-code**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `QwenCodeFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### qwen-code.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### roo

> `readonly` **roo**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `RooFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### roo.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### trae

> `readonly` **trae**: *typeof* [`TraeFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/TraeFormatter/index.md) = `TraeFormatter`

### warp

> `readonly` **warp**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `WarpFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### warp.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### windsurf

> `readonly` **windsurf**: *typeof* [`WindsurfFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/WindsurfFormatter/index.md) = `WindsurfFormatter`

### zed

> `readonly` **zed**: \{(): [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md); `getSupportedVersions`: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md); \} = `ZedFormatter`

#### Returns

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

#### zed.getSupportedVersions()

> **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

##### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

### zencoder

> `readonly` **zencoder**: *typeof* [`ZencoderFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/ZencoderFormatter/index.md) = `ZencoderFormatter`