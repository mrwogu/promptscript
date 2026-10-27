# EnvVar

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: EnvVar

> `const` **EnvVar**: `TokenType`

Defined in: [parser/src/lexer/tokens.ts:283](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/lexer/tokens.ts#L283)

Environment variable reference used where a value is expected:
`${NAME}` or `${NAME:-fallback}`.