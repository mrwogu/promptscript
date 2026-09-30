# KNOWN_TARGETS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: KNOWN\_TARGETS

> `const` **KNOWN\_TARGETS**: readonly \[`"github"`, `"claude"`, `"cursor"`, `"antigravity"`, `"factory"`, `"opencode"`, `"gemini"`, `"windsurf"`, `"cline"`, `"roo"`, `"codex"`, `"continue"`, `"augment"`, `"goose"`, `"kilo"`, `"amp"`, `"trae"`, `"junie"`, `"kiro"`, `"cortex"`, `"crush"`, `"command-code"`, `"kode"`, `"mcpjam"`, `"mistral-vibe"`, `"mux"`, `"openhands"`, `"pi"`, `"qoder"`, `"qwen-code"`, `"zencoder"`, `"neovate"`, `"pochi"`, `"adal"`, `"iflow"`, `"openclaw"`, `"codebuddy"`, `"aider"`, `"amazon-q"`, `"warp"`, `"zed"`, `"jules"`, `"devin"`, `"grok"`, `"kimi"`, `"mimo"`, `"deep-agents"`, `"forgecode"`, `"hermes"`, `"gitlab-duo"`\]

Defined in: [core/src/types/config.ts:615](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L615)

Runtime array of all known target names.
Useful for validation and iteration.

The `as const` keeps the literal element types so
`(typeof KNOWN_TARGETS)[number]` stays a literal union and
exhaustiveness checks against `KnownTarget` can catch omissions.