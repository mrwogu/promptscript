# Wyniki automatyczne

Data: 2026-03-20

## 1. Testy

- Laczna liczba testow: 586
- Passing: 586 / Failing: 0 / Skipped: 0
- Test files: 34 passed (34 total)
- Duration: 15.14s

Coverage per pakiet: dane z Vitest cache (coverage-final.json dostepny w coverage/packages/)

## 2. Typecheck

- Liczba bledow: 0
- Wszystkie 11 pakietow przeszly typecheck (strict mode)
- Uwaga: browser-compiler pomija typecheck (browser-only package)
- Uwaga: playground typecheck wylaczony (noEmit: true w tsconfig)

## 3. Lint

- Liczba warnings: 0 / errors: 0
- Wszystkie 10 pakietow przeszly lint (server nie ma targetu lint)

## 4. Walidacja .prs

- Status: PASS
- Validation successful, no issues found

## 5. Schema check

- Status: PASS
- Schema is up-to-date

## 6. Formatter docs check

- Status: PASS
- Found 37 formatters from source files
- All generated sections up to date

## 6b. Skill check

- Status: PASS
- All SKILL.md copies in sync

## 7. Eksporty per pakiet

| Pakiet           | Typ eksportow                                       | Uwagi                                                                                                                                                   |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| core             | 5 re-eksportow (export \* from)                     | Eksportuje typy, errory, utils, logger, template                                                                                                        |
| parser           | 6 named exports + 2 type exports + 1 re-eksport     | parse, parseOrThrow, parseFile, parseFileOrThrow, PSLexer, tokenize, PromptScriptParser, parser, visitor                                                |
| resolver         | ~15 named exports + typy + 1 function + 1 interface | Resolver, createResolver, FileLoader, resolveInheritance, normalizeBlockAliases, applyExtends, resolve                                                  |
| validator        | ~6 named exports + 1 function                       | Validator, createValidator, validate                                                                                                                    |
| compiler         | 3 named exports + typy                              | Compiler, createCompiler, compile                                                                                                                       |
| formatters       | ~15 named exports + typy + 1 re-eksport             | BaseFormatter, MarkdownInstructionFormatter, FormatterRegistry, createSimpleMarkdownFormatter                                                           |
| cli              | ~13 named exports + typy                            | run, initCommand, compileCommand, validateCommand, pullCommand, diffCommand, checkCommand, updateCheckCommand, loadConfig, findConfigFile, CONFIG_FILES |
| importer         | ~7 named exports + typy                             | importFile, detectFormat, getParser, classifyConfidence, ConfidenceLevel, mapSections, emitPrs                                                          |
| browser-compiler | Nie sprawdzony (lekki audyt)                        | -                                                                                                                                                       |
| playground       | Nie sprawdzony (lekki audyt)                        | -                                                                                                                                                       |
| server           | Nie sprawdzony (lekki audyt)                        | -                                                                                                                                                       |

## 8. Dead exports

Eksporty z index.ts ktore nie sa importowane przez zaden inny pakiet w monorepo:

### core

Brak dead exports (wszystkie re-eksporty - wymagaja manualnej weryfikacji)

### parser

- UNUSED: parseOrThrow
- UNUSED: parseFile
- UNUSED: parseFileOrThrow
- UNUSED: PSLexer
- UNUSED: tokenize
- UNUSED: PromptScriptParser
- UNUSED: parser
- UNUSED: visitor

### resolver

- UNUSED: createResolver
- UNUSED: FileLoader
- UNUSED: resolveInheritance
- UNUSED: normalizeBlockAliases
- UNUSED: applyExtends

### validator

Brak named dead exports (typy wymagaja manualnej weryfikacji)

### compiler

- UNUSED: createCompiler

### formatters

- UNUSED: MarkdownInstructionFormatter
- UNUSED: createSimpleMarkdownFormatter

### cli

- UNUSED: run
- UNUSED: initCommand, compileCommand, validateCommand, pullCommand, diffCommand, checkCommand, updateCheckCommand
- UNUSED: loadConfig, findConfigFile, CONFIG_FILES

Uwaga: CLI jest pakietem koncowym (entry point), wiec "unused" eksporty sa oczekiwane - sa uzywane przez CLI binary, nie przez inne pakiety.

### importer

- UNUSED: detectFormat, getParser, classifyConfidence, ConfidenceLevel, mapSections, emitPrs

Uwaga: importer jest importowany przez CLI, ale wiele eksportow to public API dla zewnetrznych konsumentow.

## 9. Broken doc links

- Laczna liczba zraportowanych: 957
- Prawie wszystkie to false positives z linkow ../ (relative paths do API reference docs)
- Wymagaja manualnego filtrowania przez Agent L w Fazie 3

Przykladowe potwierdzone wzorce false positives:

- `../../../core/src/interfaces/*.md` - linki do generowanego API reference
- `../../../formatters/src/classes/*.md` - linki do generowanego API reference
- `../../README.md` - relative links do root README

## 10. Coverage gaps per function

| Pakiet   | Plik                            | stmt% | fn% | Nieprzykryte funkcje |
| -------- | ------------------------------- | ----- | --- | -------------------- |
| resolver | packages/resolver/src/skills.ts | 93%   | 95% | 1                    |

Tylko 1 plik z coverage gap - ogolnie bardzo wysoki poziom pokrycia testami.
