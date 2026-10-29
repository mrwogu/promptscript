# EnvVar

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: EnvVar

> `const` **EnvVar**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:283](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/lexer/tokens.ts#L283)

Environment variable reference used where a value is expected:
`${NAME}` or `${NAME:-fallback}`.