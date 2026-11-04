# PromptScriptParser

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: PromptScriptParser

Defined in: [parser/src/grammar/parser.ts:52](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/parser/src/grammar/parser.ts#L52)

PromptScript CST Parser.

Parses tokenized input into a Concrete Syntax Tree (CST).
Uses Chevrotain's CstParser with error recovery enabled.

## Extends

- `CstParser`

## Constructors

### Constructor

> **new PromptScriptParser**(): `PromptScriptParser`

Defined in: [parser/src/grammar/parser.ts:53](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/parser/src/grammar/parser.ts#L53)

#### Returns

`PromptScriptParser`

#### Overrides

`CstParser.constructor`

## Properties

### program

> **program**: `ParserMethod`\<\[\], `CstNode`\>

Defined in: [parser/src/grammar/parser.ts:66](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/parser/src/grammar/parser.ts#L66)

program
  : metaBlock? (inheritDecl | useDecl | extendBlock | overrideBlock | block)*