# EnvVar

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: EnvVar

> `const` **EnvVar**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:283](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/lexer/tokens.ts#L283)

Environment variable reference used where a value is expected:
`${NAME}` or `${NAME:-fallback}`.