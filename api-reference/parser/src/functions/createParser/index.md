# createParser()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createParser()

> **createParser**(): [`PromptScriptParser`](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)

Defined in: [parser/src/grammar/parser.ts:566](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/parser/src/grammar/parser.ts#L566)

Create an isolated parser instance for one parse request.

Chevrotain stores input and diagnostics on the parser instance, so callers
must not share an instance across parse requests.

## Returns

[`PromptScriptParser`](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)