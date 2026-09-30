# parser (deprecated)

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# ~~Variable: parser~~

> `const` **parser**: [`PromptScriptParser`](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)

Defined in: [parser/src/grammar/parser.ts:579](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/grammar/parser.ts#L579)

Legacy parser instance kept for direct consumers of the parser API.

Parse helpers use pooled instances so request state never leaks between calls.

## Deprecated

Shared instance: Chevrotain stores input, errors, and rule stacks
on the parser, so concurrent or reentrant use cross-contaminates results. Call
[createParser](https://getpromptscript.dev/api-reference/parser/src/functions/createParser/index.md) to obtain an instance scoped to one parse request.