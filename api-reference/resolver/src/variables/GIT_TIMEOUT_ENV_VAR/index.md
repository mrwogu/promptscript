# GIT_TIMEOUT_ENV_VAR

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: GIT\_TIMEOUT\_ENV\_VAR

> `const` **GIT\_TIMEOUT\_ENV\_VAR**: `"PROMPTSCRIPT_GIT_TIMEOUT"` = `'PROMPTSCRIPT_GIT_TIMEOUT'`

Defined in: [resolver/src/git-registry.ts:36](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L36)

Environment variable that overrides the default Git operation timeout.
Useful when a registry clone needs more than the default 60 seconds
(e.g. large monorepo registries). See issue #455.