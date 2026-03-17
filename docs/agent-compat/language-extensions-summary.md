# Language Extension Summary

All 37 plan files in `docs/agent-compat/*-plan.md` were read and their
"Language Extension Requirements" sections extracted and analysed.

## Approved Extensions (2+ platforms)

| Block / Option                                        | Platforms      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `model` property on `@agents` block                   | mux, opencode  | Both plans request `model` as a shared AST/infrastructure field on agent definitions. Mux explicitly labels it a "language change"; OpenCode frames it as cross-cutting `MarkdownAgentConfig` infrastructure that benefits all formatters sharing `generateAgentFile`.                                                                                                                                                                                 |
| `frontmatter` / `frontmatterFields` option on factory | kiro, zencoder | Both plans propose adding a `frontmatterFields` (or equivalent `frontmatter`) option to `createSimpleMarkdownFormatter` / `MarkdownFormatterConfig` so that main output files receive a YAML frontmatter block without requiring a full subclass override. Kiro needs `inclusion: always`; Zencoder needs `alwaysApply: true`. (Windsurf, Trae, and Continue need frontmatter too but chose subclass overrides rather than a factory-level extension.) |

## Rejected Extensions (1 platform only)

| Block / Option                                 | Platform  | Reason                                                                                                                                              | Alternative                                                                                                                                                                |
| ---------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@references` sub-block within `@shortcuts`    | github    | Only GitHub Copilot needs `[label](path)` / `#file:path` context references in `.prompt.md` files                                                   | Handle in `GithubFormatter.generatePromptFile()` using raw string content                                                                                                  |
| `argumentHint` property on shortcuts           | gemini    | Only Gemini CLI uses `{{args}}` in TOML command prompts                                                                                             | Handle in `GeminiFormatter.generateCommandFile()` override when the property is added                                                                                      |
| `@import` / `@include` construct               | gemini    | Only Gemini CLI benefits from `@file.md` references in `GEMINI.md`                                                                                  | Deferred; handle in formatter if/when a general import construct is added                                                                                                  |
| `namespace` property on shortcuts              | gemini    | Only Gemini CLI uses subdirectory command namespacing in `.gemini/commands/`                                                                        | Handle in `GeminiFormatter.generateCommandFile()` path logic                                                                                                               |
| `inclusion` mode property on guards/rules      | kiro      | Only Kiro uses `inclusion: fileMatch / auto / manual` frontmatter in steering files                                                                 | Kiro Tier C deferred item; handle in a future `KiroFormatter` subclass                                                                                                     |
| `fileMatchPattern` property                    | kiro      | Only Kiro uses glob patterns via `fileMatchPattern` in steering file frontmatter                                                                    | Same as above — Kiro Tier C deferred                                                                                                                                       |
| `description` property for `auto` mode         | kiro      | Only Kiro's `inclusion: auto` mode uses `description` to drive model-based loading                                                                  | Same as above — Kiro Tier C deferred                                                                                                                                       |
| `base` property on `@agents` block             | mux       | Only Mux uses a `base` (inheritance) field in agent frontmatter (`exec`, `plan`, or agent ID)                                                       | Handle in `MuxFormatter.generateAgentFile()` override reading `obj['base']`                                                                                                |
| `triggers` array on `@skills` block            | openhands | Only OpenHands documents a `triggers` field in SKILL.md frontmatter; other platforms ignore it                                                      | Handle in a `MarkdownSkillConfig` extension scoped to OpenHands if/when parser support is added                                                                            |
| `disableModelInvocation` property on `@skills` | claude    | Only Claude Code uses `disable-model-invocation` in SKILL.md frontmatter                                                                            | Handle in `ClaudeFormatter.generateSkillFile()` — already planned as formatter-level addition                                                                              |
| `argumentHint` property on `@skills`           | claude    | Only Claude Code uses `argument-hint` in SKILL.md frontmatter                                                                                       | Handle in `ClaudeFormatter.generateSkillFile()` override                                                                                                                   |
| `mode` property on `@agents` block             | opencode  | Only OpenCode's plan explicitly requests `mode` as a PRS language extension (Mux wants it as a formatter-level field; Claude handles it internally) | Handle in `MarkdownInstructionFormatter.generateAgentFile()` as a shared config field — no PRS parser change required if sourced from existing `@agents` object properties |

## Notes on Borderline Cases

**`model` on agents (APPROVED):** Mux explicitly classifies this as a "language change"
requiring parser and resolver involvement. OpenCode independently requests the same field
as shared `MarkdownAgentConfig` infrastructure. Two distinct platforms requiring the same
AST property satisfies the 2+ threshold.

**`frontmatterFields` factory option (APPROVED):** Kiro's plan proposes adding
`frontmatter?: Record<string, string>` to `SimpleFormatterOptions` (Task A2). Zencoder's
plan proposes adding `frontmatterFields?: Record<string, string | boolean | number>` to
the same factory (Change 1). These are independently motivated, structurally identical
proposals from two separate platforms, satisfying the 2+ threshold. Note that Windsurf,
Trae, and Continue also need main-file frontmatter but their plans chose subclass overrides
instead of a shared factory extension — if those platforms migrate to the factory extension
in the future, the approved extension would cover them automatically.

**`mode` on agents (REJECTED as language extension, handle at formatter level):** While
OpenCode's plan calls for a language extension, closer inspection reveals that `mode` can
be sourced from the existing `@agents` block object properties without any parser or AST
changes — `obj['mode']` is already accessible in `extractAgents`. The formatter-level
fix in `MarkdownAgentConfig` and `generateAgentFile` is sufficient. No new PRS block type
or parser grammar rule is required.

## Summary Counts

- Total plan files reviewed: 37
- Plans with no language extension requirements: 28
- Plans proposing extensions (any scope): 9
- Extensions APPROVED (2+ platforms): 2
- Extensions REJECTED (1 platform only): 12
