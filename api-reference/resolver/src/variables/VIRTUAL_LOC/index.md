# VIRTUAL_LOC

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: VIRTUAL\_LOC

> `const` **VIRTUAL\_LOC**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [resolver/src/ast-factory.ts:11](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/ast-factory.ts#L11)

Virtual source location used in synthesized AST nodes.

Points to a synthetic file name, indicating the node was created
programmatically rather than parsed from real source. Prefer passing a
real file to the factory functions so findings on synthesized nodes stay
traceable; fall back to this only when no source file exists.