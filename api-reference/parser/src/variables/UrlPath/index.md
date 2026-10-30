# UrlPath

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: UrlPath

> `const` **UrlPath**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:83](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/parser/src/lexer/tokens.ts#L83)

URL-style path for Go-style direct imports.
Matches: domain.tld/org/repo/path[@version]
Domain detection: first segment must contain a dot.