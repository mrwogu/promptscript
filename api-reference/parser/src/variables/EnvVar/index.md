# EnvVar

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: EnvVar

> `const` **EnvVar**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:283](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/parser/src/lexer/tokens.ts#L283)

Environment variable reference used where a value is expected:
`${NAME}` or `${NAME:-fallback}`.