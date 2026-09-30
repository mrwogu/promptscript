# REGISTRY_MARKER_PREFIX

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: REGISTRY\_MARKER\_PREFIX

> `const` **REGISTRY\_MARKER\_PREFIX**: `"__registry__:"` = `'__registry__:'`

Defined in: [resolver/src/loader.ts:15](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/loader.ts#L15)

Prefix used for registry marker paths returned by resolveRef.
Format: `__registry__:<base64(JSON({repoUrl, path, version}))>`

These markers are intercepted by the Resolver to perform async
Git-based import resolution while keeping FileLoader synchronous.