# UrlPath

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: UrlPath

> `const` **UrlPath**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/lexer/tokens.ts#L79)

URL-style path for Go-style direct imports.
Matches: domain.tld/org/repo/path[@version]
Domain detection: first segment must contain a dot.