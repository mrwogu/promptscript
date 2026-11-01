# createParser()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createParser()

> **createParser**(): [`PromptScriptParser`](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)

Defined in: [parser/src/grammar/parser.ts:566](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/parser/src/grammar/parser.ts#L566)

Create an isolated parser instance for one parse request.

Chevrotain stores input and diagnostics on the parser instance, so callers
must not share an instance across parse requests.

## Returns

[`PromptScriptParser`](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)