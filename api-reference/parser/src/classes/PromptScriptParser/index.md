# PromptScriptParser

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: PromptScriptParser

Defined in: [parser/src/grammar/parser.ts:52](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/parser/src/grammar/parser.ts#L52)

PromptScript CST Parser.

Parses tokenized input into a Concrete Syntax Tree (CST).
Uses Chevrotain's CstParser with error recovery enabled.

## Extends

- `CstParser`

## Constructors

### Constructor

> **new PromptScriptParser**(): `PromptScriptParser`

Defined in: [parser/src/grammar/parser.ts:53](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/parser/src/grammar/parser.ts#L53)

#### Returns

`PromptScriptParser`

#### Overrides

`CstParser.constructor`

## Properties

### program

> **program**: `ParserMethod`\<\[\], `CstNode`\>

Defined in: [parser/src/grammar/parser.ts:66](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/parser/src/grammar/parser.ts#L66)

program
  : metaBlock? (inheritDecl | useDecl | extendBlock | overrideBlock | block)*