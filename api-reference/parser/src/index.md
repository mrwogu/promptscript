# Parser API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# parser/src

Chevrotain-based parser for the PromptScript language.

Handles the lexical analysis and parsing of `.prs` files into the Abstract Syntax Tree (AST).

## Classes

- [PromptScriptParser](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)

## Interfaces

- [CanonicalParseResult](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)
- [ParseOptions](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md)
- [ParseResult](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)
- [VisitorDiagnostic](https://getpromptscript.dev/api-reference/parser/src/interfaces/VisitorDiagnostic/index.md)

## Type Aliases

- [EnvProvider](https://getpromptscript.dev/api-reference/parser/src/type-aliases/EnvProvider/index.md)

## Variables

- [allTokens](https://getpromptscript.dev/api-reference/parser/src/variables/allTokens/index.md)
- [As](https://getpromptscript.dev/api-reference/parser/src/variables/As/index.md)
- [At](https://getpromptscript.dev/api-reference/parser/src/variables/At/index.md)
- [Bang](https://getpromptscript.dev/api-reference/parser/src/variables/Bang/index.md)
- [BooleanType](https://getpromptscript.dev/api-reference/parser/src/variables/BooleanType/index.md)
- [Colon](https://getpromptscript.dev/api-reference/parser/src/variables/Colon/index.md)
- [Comma](https://getpromptscript.dev/api-reference/parser/src/variables/Comma/index.md)
- [Dash](https://getpromptscript.dev/api-reference/parser/src/variables/Dash/index.md)
- [Dot](https://getpromptscript.dev/api-reference/parser/src/variables/Dot/index.md)
- [DotDot](https://getpromptscript.dev/api-reference/parser/src/variables/DotDot/index.md)
- [Enum](https://getpromptscript.dev/api-reference/parser/src/variables/Enum/index.md)
- [EnvVar](https://getpromptscript.dev/api-reference/parser/src/variables/EnvVar/index.md)
- [Equals](https://getpromptscript.dev/api-reference/parser/src/variables/Equals/index.md)
- [Extend](https://getpromptscript.dev/api-reference/parser/src/variables/Extend/index.md)
- [False](https://getpromptscript.dev/api-reference/parser/src/variables/False/index.md)
- [Identifier](https://getpromptscript.dev/api-reference/parser/src/variables/Identifier/index.md)
- [Inherit](https://getpromptscript.dev/api-reference/parser/src/variables/Inherit/index.md)
- [Into](https://getpromptscript.dev/api-reference/parser/src/variables/Into/index.md)
- [LBrace](https://getpromptscript.dev/api-reference/parser/src/variables/LBrace/index.md)
- [LBracket](https://getpromptscript.dev/api-reference/parser/src/variables/LBracket/index.md)
- [LineComment](https://getpromptscript.dev/api-reference/parser/src/variables/LineComment/index.md)
- [LParen](https://getpromptscript.dev/api-reference/parser/src/variables/LParen/index.md)
- [Meta](https://getpromptscript.dev/api-reference/parser/src/variables/Meta/index.md)
- [Null](https://getpromptscript.dev/api-reference/parser/src/variables/Null/index.md)
- [NumberLiteral](https://getpromptscript.dev/api-reference/parser/src/variables/NumberLiteral/index.md)
- [NumberType](https://getpromptscript.dev/api-reference/parser/src/variables/NumberType/index.md)
- [~~parser~~](https://getpromptscript.dev/api-reference/parser/src/variables/parser/index.md)
- [PathReference](https://getpromptscript.dev/api-reference/parser/src/variables/PathReference/index.md)
- [PSLexer](https://getpromptscript.dev/api-reference/parser/src/variables/PSLexer/index.md)
- [Question](https://getpromptscript.dev/api-reference/parser/src/variables/Question/index.md)
- [Range](https://getpromptscript.dev/api-reference/parser/src/variables/Range/index.md)
- [RBrace](https://getpromptscript.dev/api-reference/parser/src/variables/RBrace/index.md)
- [RBracket](https://getpromptscript.dev/api-reference/parser/src/variables/RBracket/index.md)
- [RelativePath](https://getpromptscript.dev/api-reference/parser/src/variables/RelativePath/index.md)
- [RParen](https://getpromptscript.dev/api-reference/parser/src/variables/RParen/index.md)
- [SshPath](https://getpromptscript.dev/api-reference/parser/src/variables/SshPath/index.md)
- [StringLiteral](https://getpromptscript.dev/api-reference/parser/src/variables/StringLiteral/index.md)
- [StringType](https://getpromptscript.dev/api-reference/parser/src/variables/StringType/index.md)
- [TemplateClose](https://getpromptscript.dev/api-reference/parser/src/variables/TemplateClose/index.md)
- [TemplateOpen](https://getpromptscript.dev/api-reference/parser/src/variables/TemplateOpen/index.md)
- [TextBlock](https://getpromptscript.dev/api-reference/parser/src/variables/TextBlock/index.md)
- [True](https://getpromptscript.dev/api-reference/parser/src/variables/True/index.md)
- [UrlPath](https://getpromptscript.dev/api-reference/parser/src/variables/UrlPath/index.md)
- [Use](https://getpromptscript.dev/api-reference/parser/src/variables/Use/index.md)
- [~~visitor~~](https://getpromptscript.dev/api-reference/parser/src/variables/visitor/index.md)
- [WhiteSpace](https://getpromptscript.dev/api-reference/parser/src/variables/WhiteSpace/index.md)

## Functions

- [createParser](https://getpromptscript.dev/api-reference/parser/src/functions/createParser/index.md)
- [createVisitor](https://getpromptscript.dev/api-reference/parser/src/functions/createVisitor/index.md)
- [parse](https://getpromptscript.dev/api-reference/parser/src/functions/parse/index.md)
- [parseCanonical](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonical/index.md)
- [parseCanonicalFile](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonicalFile/index.md)
- [parseCanonicalFileOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonicalFileOrThrow/index.md)
- [parseCanonicalOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonicalOrThrow/index.md)
- [parseFile](https://getpromptscript.dev/api-reference/parser/src/functions/parseFile/index.md)
- [parseFileCanonical](https://getpromptscript.dev/api-reference/parser/src/functions/parseFileCanonical/index.md)
- [parseFileCanonicalOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseFileCanonicalOrThrow/index.md)
- [parseFileOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseFileOrThrow/index.md)
- [parseOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseOrThrow/index.md)
- [tokenize](https://getpromptscript.dev/api-reference/parser/src/functions/tokenize/index.md)