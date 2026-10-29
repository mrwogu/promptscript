# UrlPath

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: UrlPath

> `const` **UrlPath**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:83](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/lexer/tokens.ts#L83)

URL-style path for Go-style direct imports.
Matches: domain.tld/org/repo/path[@version]
Domain detection: first segment must contain a dot.