# Importer API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# importer/src

Import existing AI instruction files to PromptScript format.

Supports CLAUDE.md, copilot-instructions.md, .cursorrules, AGENTS.md,
and generic markdown files with heuristic section classification.

## Enumerations

- [ConfidenceLevel](https://getpromptscript.dev/api-reference/importer/src/enumerations/ConfidenceLevel/index.md)

## Interfaces

- [EmitOptions](https://getpromptscript.dev/api-reference/importer/src/interfaces/EmitOptions/index.md)
- [FileReport](https://getpromptscript.dev/api-reference/importer/src/interfaces/FileReport/index.md)
- [FormatParser](https://getpromptscript.dev/api-reference/importer/src/interfaces/FormatParser/index.md)
- [ImportOptions](https://getpromptscript.dev/api-reference/importer/src/interfaces/ImportOptions/index.md)
- [ImportResult](https://getpromptscript.dev/api-reference/importer/src/interfaces/ImportResult/index.md)
- [MarkdownSection](https://getpromptscript.dev/api-reference/importer/src/interfaces/MarkdownSection/index.md)
- [MergedBlock](https://getpromptscript.dev/api-reference/importer/src/interfaces/MergedBlock/index.md)
- [MergeResult](https://getpromptscript.dev/api-reference/importer/src/interfaces/MergeResult/index.md)
- [ModularEmitOptions](https://getpromptscript.dev/api-reference/importer/src/interfaces/ModularEmitOptions/index.md)
- [MultiImportResult](https://getpromptscript.dev/api-reference/importer/src/interfaces/MultiImportResult/index.md)
- [RoundtripResult](https://getpromptscript.dev/api-reference/importer/src/interfaces/RoundtripResult/index.md)
- [ScoredSection](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md)
- [SourcedSection](https://getpromptscript.dev/api-reference/importer/src/interfaces/SourcedSection/index.md)

## Type Aliases

- [DetectedFormat](https://getpromptscript.dev/api-reference/importer/src/type-aliases/DetectedFormat/index.md)
- [MultiImportOptions](https://getpromptscript.dev/api-reference/importer/src/type-aliases/MultiImportOptions/index.md)

## Functions

- [classifyConfidence](https://getpromptscript.dev/api-reference/importer/src/functions/classifyConfidence/index.md)
- [detectFormat](https://getpromptscript.dev/api-reference/importer/src/functions/detectFormat/index.md)
- [emitModularFiles](https://getpromptscript.dev/api-reference/importer/src/functions/emitModularFiles/index.md)
- [emitPrs](https://getpromptscript.dev/api-reference/importer/src/functions/emitPrs/index.md)
- [getParser](https://getpromptscript.dev/api-reference/importer/src/functions/getParser/index.md)
- [importFile](https://getpromptscript.dev/api-reference/importer/src/functions/importFile/index.md)
- [importMultipleFiles](https://getpromptscript.dev/api-reference/importer/src/functions/importMultipleFiles/index.md)
- [mapSections](https://getpromptscript.dev/api-reference/importer/src/functions/mapSections/index.md)
- [mergeSections](https://getpromptscript.dev/api-reference/importer/src/functions/mergeSections/index.md)
- [validateRoundtrip](https://getpromptscript.dev/api-reference/importer/src/functions/validateRoundtrip/index.md)