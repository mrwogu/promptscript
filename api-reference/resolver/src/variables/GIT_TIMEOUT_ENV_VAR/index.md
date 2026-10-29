# GIT_TIMEOUT_ENV_VAR

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: GIT\_TIMEOUT\_ENV\_VAR

> `const` **GIT\_TIMEOUT\_ENV\_VAR**: `"PROMPTSCRIPT_GIT_TIMEOUT"` = `'PROMPTSCRIPT_GIT_TIMEOUT'`

Defined in: [resolver/src/git-registry.ts:36](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/git-registry.ts#L36)

Environment variable that overrides the default Git operation timeout.
Useful when a registry clone needs more than the default 60 seconds
(e.g. large monorepo registries). See issue #455.