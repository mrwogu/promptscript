# REGISTRY_MARKER_PREFIX

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: REGISTRY\_MARKER\_PREFIX

> `const` **REGISTRY\_MARKER\_PREFIX**: `"__registry__:"` = `'__registry__:'`

Defined in: [resolver/src/loader.ts:15](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/resolver/src/loader.ts#L15)

Prefix used for registry marker paths returned by resolveRef.
Format: `__registry__:<base64(JSON({repoUrl, path, version}))>`

These markers are intercepted by the Resolver to perform async
Git-based import resolution while keeping FileLoader synchronous.