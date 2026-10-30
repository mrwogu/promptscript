# REGISTRY_MARKER_PREFIX

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: REGISTRY\_MARKER\_PREFIX

> `const` **REGISTRY\_MARKER\_PREFIX**: `"__registry__:"` = `'__registry__:'`

Defined in: [resolver/src/loader.ts:15](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/loader.ts#L15)

Prefix used for registry marker paths returned by resolveRef.
Format: `__registry__:<base64(JSON({repoUrl, path, version}))>`

These markers are intercepted by the Resolver to perform async
Git-based import resolution while keeping FileLoader synchronous.