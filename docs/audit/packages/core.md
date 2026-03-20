# Audyt: @promptscript/core

Data: 2026-03-20
Glebokosc: SREDNIA (publiczne API z index.ts)

## Ocena zbiorcza: PASS

Pakiet core jest stabilny, dobrze przetestowany i szeroko uzywany przez caly monorepo. Brak FAILING testow, typecheck i lint przechodzace. Drobne uwagi dotycza dokumentacji README i kilku nieuzywanych eksportow.

---

## 1. Publiczne API - eksporty vs dokumentacja

Pakiet eksportuje 5 modulow via `export * from`:

| Modul            | Eksportowane symbole (publiczne)                                                                                                                                                                                                                                                                                                                                              | W README? | Uwagi                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| types/ast        | `BaseNode`, `ParamType`, `ParamDefinition`, `ParamArgument`, `TemplateExpression`, `Program`, `MetaBlock`, `InheritDeclaration`, `UseDeclaration`, `PathReference`, `BlockName`, `Block`, `ExtendBlock`, `BlockContent`, `TextContent`, `ObjectContent`, `ArrayContent`, `MixedContent`, `PrimitiveValue`, `Value`, `TypeExpression`, `SkillDefinition`, `SkillContractField` | WARN      | README wymienia `Program`, `Block`, `Value` jako przyklady importu, ale nie opisuje pelnego API |
| types/config     | `FormattingConfig`, `GithubVersion`, `ClaudeVersion`, `TargetConfig`, `TargetEntry`, `PromptScriptConfig`, `UserConfig`, `KnownTarget`, `CustomTarget`, `TargetName`, `KNOWN_TARGETS`, `isKnownTarget`, `customTarget`, `DEFAULT_OUTPUT_PATHS`                                                                                                                                | WARN      | Brak wzmianki w README                                                                          |
| types/constants  | `BLOCK_TYPES`, `BlockTypeName`, `RESERVED_WORDS`, `ReservedWord`, `isReservedWord`, `isBlockType`                                                                                                                                                                                                                                                                             | FAIL      | Brak w README                                                                                   |
| types/convention | `BuiltInConventionName`, `ConventionName`, `SectionRenderer`, `OutputConvention`, `XML_CONVENTION`, `MARKDOWN_CONVENTION`, `BUILT_IN_CONVENTIONS`, `getBuiltInConvention`, `isBuiltInConvention`                                                                                                                                                                              | FAIL      | Brak w README                                                                                   |
| types/manifest   | `ManifestTarget`, `NamespaceDefinition`, `DetectionHints`, `SourceAttribution`, `CatalogEntry`, `SuggestionCondition`, `SuggestionAction`, `SuggestionRule`, `RegistryMeta`, `RegistryManifest`, `SuggestionResult`, `SuggestionReasoning`, `ProjectContext`                                                                                                                  | FAIL      | Brak w README                                                                                   |
| types/prettier   | `PrettierMarkdownOptions`, `DEFAULT_PRETTIER_OPTIONS`                                                                                                                                                                                                                                                                                                                         | FAIL      | Brak w README                                                                                   |
| types/source     | `SourceLocation`, `SourceRange`                                                                                                                                                                                                                                                                                                                                               | FAIL      | Brak w README                                                                                   |
| errors/base      | `ErrorCode` (enum), `PSError` (class)                                                                                                                                                                                                                                                                                                                                         | WARN      | README wymienia `ParseError`, `ValidationError` ale nie `PSError`, `ErrorCode`                  |
| errors/parse     | `ParseError`, `UnexpectedTokenError`                                                                                                                                                                                                                                                                                                                                          | WARN      | `ParseError` wspomniana w README                                                                |
| errors/resolve   | `ResolveError`, `FileNotFoundError`, `CircularDependencyError`, `GitCloneError`, `GitAuthError`, `GitRefNotFoundError`                                                                                                                                                                                                                                                        | FAIL      | Brak w README                                                                                   |
| errors/validate  | `Severity` (type), `ValidationError`                                                                                                                                                                                                                                                                                                                                          | WARN      | `ValidationError` wspomniana w README                                                           |
| errors/template  | `MissingParamError`, `UnknownParamError`, `ParamTypeMismatchError`, `UndefinedVariableError`                                                                                                                                                                                                                                                                                  | FAIL      | Brak w README                                                                                   |
| utils/diagnostic | `DiagnosticSeverity`, `Diagnostic`, `FormatDiagnosticOptions`, `formatDiagnostic`, `formatDiagnostics`, `createLocation`                                                                                                                                                                                                                                                      | FAIL      | Brak w README                                                                                   |
| utils/merge      | `MergeOptions`, `DEFAULT_MERGE_OPTIONS`, `deepMerge`, `isTextContent`, `isPlainObject`, `deepClone`                                                                                                                                                                                                                                                                           | WARN      | `deepMerge` wspomniana w README                                                                 |
| utils/package    | `PackageInfo`, `getPackageInfo`, `getPackageVersion`                                                                                                                                                                                                                                                                                                                          | FAIL      | Brak w README                                                                                   |
| utils/path       | `ParsedPath`, `parsePath`, `isAbsolutePath`, `isRelativePath`, `resolvePath`, `createPathReference`, `getFileName`, `formatPath`                                                                                                                                                                                                                                              | WARN      | `parsePath` wspomniana w README                                                                 |
| utils/version    | `SemVer`, `CompareResult`, `parseVersion`, `compareVersions`, `isValidVersion`, `formatVersion`, `incrementVersion`                                                                                                                                                                                                                                                           | WARN      | `parseVersion` wspomniana w README                                                              |
| logger           | `Logger` (interface), `noopLogger`, `createLogger`                                                                                                                                                                                                                                                                                                                            | FAIL      | Brak w README                                                                                   |
| template         | `TemplateContext`, `isTemplateExpression`, `bindParams`, `interpolateText`, `interpolateContent`, `interpolateAST`                                                                                                                                                                                                                                                            | FAIL      | Brak w README                                                                                   |

**Ocena sekcji: WARN** - README wymienia tylko 6 przykladowych importow (`Program`, `Block`, `Value`, `ParseError`, `ValidationError`, `parsePath`, `parseVersion`, `deepMerge`). Wiekszosc publicznego API nie jest udokumentowana.

---

## 2. Funkcje - poprawnosc vs kontrakt

| Funkcja                                                 | Implementacja vs deklaracja                                                              | Ocena |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| `parsePath`                                             | Poprawna - parsuje sciezki wzgledne i absolutne, rzuca Error dla nieprawidlowego formatu | PASS  |
| `isAbsolutePath` / `isRelativePath`                     | Proste predykaty, poprawne                                                               | PASS  |
| `resolvePath`                                           | Poprawna - rozwiazuje sciezki wzgledne i absolutne z `.prs` extension                    | PASS  |
| `createPathReference`                                   | Poprawna - tworzy AST node z parsowanej sciezki                                          | PASS  |
| `getFileName` / `formatPath`                            | Poprawne                                                                                 | PASS  |
| `parseVersion`                                          | Poprawna - regex-based semver parsing, rzuca Error                                       | PASS  |
| `compareVersions`                                       | Poprawna - porownuje major/minor/patch + prerelease                                      | PASS  |
| `isValidVersion` / `formatVersion` / `incrementVersion` | Poprawne                                                                                 | PASS  |
| `deepMerge`                                             | Poprawna - rekurencyjny merge z konfigurowalnymi strategiami                             | PASS  |
| `isTextContent` / `isPlainObject` / `deepClone`         | Poprawne type guardy i klonowanie                                                        | PASS  |
| `formatDiagnostic` / `formatDiagnostics`                | Poprawne - formatowanie z opcjonalnym kolorem                                            | PASS  |
| `createLocation`                                        | Prosta fabryka, poprawna                                                                 | PASS  |
| `getPackageInfo` / `getPackageVersion`                  | Poprawne - bezpieczne parsowanie package.json z fallback                                 | PASS  |
| `isKnownTarget` / `customTarget`                        | Poprawne type guardy                                                                     | PASS  |
| `isReservedWord` / `isBlockType`                        | Poprawne type guardy                                                                     | PASS  |
| `getBuiltInConvention` / `isBuiltInConvention`          | Poprawne                                                                                 | PASS  |
| `noopLogger` / `createLogger`                           | Poprawne - no-op i fabryka z opcjonalnymi callbackami                                    | PASS  |
| `isTemplateExpression`                                  | Poprawny type guard                                                                      | PASS  |
| `bindParams`                                            | Poprawna - walidacja typow, defaults, wymagane/opcjonalne                                | PASS  |
| `interpolateText`                                       | Poprawna - `{{variable}}` pattern matching z UndefinedVariableError                      | PASS  |
| `interpolateContent`                                    | Poprawna - obsluguje TextContent, ObjectContent, ArrayContent, MixedContent              | PASS  |
| `interpolateAST`                                        | Poprawna - interpoluje meta, blocks, extends; skip jesli brak params                     | PASS  |
| klasy bledow (PSError, ParseError, itd.)                | Poprawne - hierarchia dziedziczenia, kody bledow, lokalizacja                            | PASS  |

**Ocena sekcji: PASS**

---

## 3. Typy - kompletnosc i spojnosc

| Kategoria                     | Ocena | Uwagi                                                                            |
| ----------------------------- | ----- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| AST types                     | PASS  | Pelna hierarchia z `BaseNode`, discriminated unions, `readonly type`             |
| Config types                  | PASS  | Szczegolowe interfejsy z opcjonalnymi polami i wartosciami domyslnymi            |
| Manifest types                | PASS  | Kompletne typy dla rejestru                                                      |
| Convention types              | PASS  | Dobrze zdefiniowane z wbudowanymi instancjami                                    |
| Source types                  | PASS  | Proste, poprawne                                                                 |
| Prettier types                | PASS  | Z `DEFAULT_PRETTIER_OPTIONS` jako `Required<>`                                   |
| Error hierarchy               | PASS  | Poprawna hierarchia PSError > ParseError/ResolveError/ValidationError > podklasy |
| `KnownTarget` vs `TargetName` | PASS  | Dobrze zaprojektowane z branded type dla CustomTarget                            |
| `BlockName` type alias        | WARN  | Zdefiniowany jako union z `                                                      | string`co oslabienia type safety;`BlockTypeName` z constants.ts jest scislejszy |

**Ocena sekcji: PASS**

---

## 4. Testy - coverage i edge cases

Pliki testowe (15 plikow spec):

| Plik testowy                                   | Testuje                                                                                                                                                                                    | Happy path? | Ocena |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----- |
| `path.spec.ts` + `path-coverage.spec.ts`       | `parsePath`, `isAbsolutePath`, `isRelativePath`, `resolvePath`, `createPathReference`, `getFileName`, `formatPath`                                                                         | TAK         | PASS  |
| `version.spec.ts` + `version-coverage.spec.ts` | `parseVersion`, `compareVersions`, `isValidVersion`, `formatVersion`, `incrementVersion`                                                                                                   | TAK         | PASS  |
| `merge.spec.ts` + `merge-coverage.spec.ts`     | `deepMerge`, `isTextContent`, `isPlainObject`, `deepClone`                                                                                                                                 | TAK         | PASS  |
| `diagnostic.spec.ts`                           | `formatDiagnostic`, `formatDiagnostics`, `createLocation`                                                                                                                                  | TAK         | PASS  |
| `package.spec.ts`                              | `getPackageInfo`, `getPackageVersion`                                                                                                                                                      | TAK         | PASS  |
| `errors.spec.ts`                               | `PSError`, `ParseError`, `UnexpectedTokenError`, `ResolveError`, `FileNotFoundError`, `CircularDependencyError`, `ValidationError`, `GitCloneError`, `GitAuthError`, `GitRefNotFoundError` | TAK         | PASS  |
| `template.spec.ts`                             | `bindParams`, `interpolateText`, `interpolateContent`, `interpolateAST`, `isTemplateExpression`                                                                                            | TAK         | PASS  |
| `constants.spec.ts`                            | `BLOCK_TYPES`, `RESERVED_WORDS`, `isReservedWord`, `isBlockType`                                                                                                                           | TAK         | PASS  |
| `convention.spec.ts`                           | `XML_CONVENTION`, `MARKDOWN_CONVENTION`, `getBuiltInConvention`, `isBuiltInConvention`                                                                                                     | TAK         | PASS  |
| `config.spec.ts`                               | Typy konfiguracyjne (type-level tests)                                                                                                                                                     | TAK         | PASS  |
| `target-name.spec.ts`                          | `isKnownTarget`, `customTarget`, `KNOWN_TARGETS`                                                                                                                                           | TAK         | PASS  |
| `skill-definition.spec.ts`                     | `SkillDefinition` type checks                                                                                                                                                              | TAK         | PASS  |

Z automated-results.md:

- 586/586 testow PASS, 0 FAILING
- Brak plikow core z fn% < 80%

**Logger** (`noopLogger`, `createLogger`): brak dedykowanego pliku testowego, ale sa to trywialne implementacje (2-3 linie). WARN.

**Ocena sekcji: PASS** (z drobnym WARN dla logger)

---

## 5. Dead code - nieuzywane eksporty/funkcje

### Eksporty uzywane przez inne pakiety w monorepo:

| Eksport                                                                                                                      | Uzywany przez                                                            | Status |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| AST types (Program, Block, Value, itd.)                                                                                      | parser, resolver, validator, formatters, compiler, cli, browser-compiler | PASS   |
| Error classes (PSError, ParseError, ResolveError, ValidationError, itd.)                                                     | parser, resolver, validator, compiler, cli, browser-compiler             | PASS   |
| `deepMerge`, `isTextContent`, `isPlainObject`, `deepClone`                                                                   | resolver, cli, browser-compiler                                          | PASS   |
| `parsePath`, `resolvePath`, `createPathReference`, `formatPath`                                                              | parser, resolver, cli                                                    | PASS   |
| `parseVersion`, `compareVersions`, `isValidVersion`                                                                          | resolver                                                                 | PASS   |
| `formatDiagnostic`, `createLocation`                                                                                         | validator                                                                | PASS   |
| `getPackageInfo`, `getPackageVersion`                                                                                        | cli                                                                      | PASS   |
| `noopLogger`, `createLogger`, `Logger`                                                                                       | compiler, validator, resolver, browser-compiler                          | PASS   |
| `bindParams`, `interpolateText`, `interpolateContent`, `interpolateAST`                                                      | resolver, browser-compiler                                               | PASS   |
| `PromptScriptConfig`, `UserConfig`, `TargetName`, `KnownTarget`, `KNOWN_TARGETS`, `isKnownTarget`, `DEFAULT_OUTPUT_PATHS`    | compiler, cli, formatters, browser-compiler                              | PASS   |
| `OutputConvention`, `ConventionName`, `XML_CONVENTION`, `MARKDOWN_CONVENTION`, `getBuiltInConvention`, `isBuiltInConvention` | formatters, compiler, browser-compiler                                   | PASS   |
| `PrettierMarkdownOptions`, `DEFAULT_PRETTIER_OPTIONS`, `FormattingConfig`                                                    | formatters, cli, compiler, browser-compiler                              | PASS   |
| `RegistryManifest`, `CatalogEntry`, `SuggestionRule`, `ProjectContext`                                                       | cli                                                                      | PASS   |
| `SkillDefinition`, `SkillContractField`                                                                                      | resolver                                                                 | PASS   |
| `GithubVersion`, `ClaudeVersion`                                                                                             | formatters                                                               | PASS   |

### Eksporty potencjalnie nieuzywane poza core:

| Eksport                                                                                           | Status | Uwagi                                                                              |
| ------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `BLOCK_TYPES`, `RESERVED_WORDS`, `isReservedWord`, `isBlockType`, `BlockTypeName`, `ReservedWord` | WARN   | Uzywane tylko w testach core; moga byc uzywane przez zewnetrznych konsumentow      |
| `ErrorCode` (enum)                                                                                | WARN   | Uzywane tylko wewnetrznie w klasach bledow; inne pakiety importuja klasy, nie kody |
| `MergeOptions`, `DEFAULT_MERGE_OPTIONS`                                                           | WARN   | Uzywane tylko wewnetrznie w `deepMerge`                                            |
| `SemVer`, `CompareResult`, `formatVersion`, `incrementVersion`                                    | WARN   | Uzywane tylko w testach core                                                       |
| `ParsedPath`, `PackageInfo`                                                                       | WARN   | Uzywane tylko wewnetrznie                                                          |
| `isTemplateExpression`                                                                            | WARN   | Uzywane tylko w template.ts wewnetrznie                                            |
| `customTarget`                                                                                    | WARN   | Eksportowane dla zewnetrznych konsumentow, nie uzywane w monorepo                  |

**Ocena sekcji: WARN** - Kilka eksportow jest uzywanych tylko wewnetrznie lub w testach. Jako pakiet publicznego API core, jest to akceptowalne - te eksporty stanowia czesc public contract.

---

## 6. Dokumentacja - README vs rzeczywistosc

### Kompletnosc README

README zawiera:

- Opis pakietu (poprawny)
- Diagram architektury (poprawny, pokazuje pozycje core w monorepo)
- Przyklad importu z 3 liniami (poprawny, ale niekompletny)
- Status "internal package" (poprawny)

README **nie** zawiera:

- Opisu modulu Logger (`Logger`, `noopLogger`, `createLogger`)
- Opisu modulu Template (`bindParams`, `interpolateText`, itd.)
- Opisu typow konfiguracyjnych (`PromptScriptConfig`, `TargetName`, itd.)
- Opisu typow konwencji (`OutputConvention`, itd.)
- Opisu typow manifestu (`RegistryManifest`, itd.)
- Opisu stalych (`BLOCK_TYPES`, `RESERVED_WORDS`, `KNOWN_TARGETS`, itd.)
- Opisu diagnostyki (`formatDiagnostic`, `Diagnostic`, itd.)
- Opisu hierarchii bledow
- Opisu narzedzi wersjonowania (`parseVersion`, `compareVersions`, itd.)
- Opisu narzedzi pakietowych (`getPackageInfo`)

### Poprawnosc przykladow

```typescript
import type { Program, Block, Value } from '@promptscript/core';
import { ParseError, ValidationError } from '@promptscript/core';
import { parsePath, parseVersion, deepMerge } from '@promptscript/core';
```

Wszystkie 3 przyklady sa poprawne - te symbole istnieja i sa eksportowane.

**Ocena sekcji: WARN** - README jest minimalistyczne. Dla pakietu wewnetrznego ("internal package") to akceptowalne, ale brakuje opisu ~80% publicznego API. Przyklady importu sa poprawne.

---

## 7. Findings (lista problemow z priorytetem P0-P3)

| #   | Priorytet | Kategoria           | Opis                                                                                                                                                                                                                                                    |
| --- | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | P3        | Dokumentacja        | README opisuje ~20% publicznego API. Brak opisu modulow: logger, template, config types, convention, manifest, constants, diagnostic, package utils. Jako pakiet oznaczony "internal" jest to akceptowalne, ale utrudnia onboarding nowych developerow. |
| 2   | P3        | Dead code           | `ErrorCode` enum jest eksportowany ale uzywany tylko wewnetrznie przez klasy bledow. Inne pakiety nie importuja kodow bezposrednio. Nie jest to problem, ale moze byc kandydatem do zawezenia eksportu.                                                 |
| 3   | P3        | Dead code           | `MergeOptions`, `DEFAULT_MERGE_OPTIONS`, `SemVer`, `CompareResult`, `ParsedPath`, `PackageInfo` - typy pomocnicze eksportowane publicznie ale uzywane tylko wewnetrznie.                                                                                |
| 4   | P3        | Testy               | Brak dedykowanego pliku testowego dla `logger.ts` (`noopLogger`, `createLogger`). Implementacja jest trywialna (2-3 linie), wiec ryzyko jest minimalne.                                                                                                 |
| 5   | P3        | Typy                | `BlockName` w ast.ts jest zdefiniowany jako union z `                                                                                                                                                                                                   | string`co umozliwia dowolny string. Istnieje scislejszy`BlockTypeName` z constants.ts. Te dwa typy moga powodowac zamieszanie. |
| 6   | P3        | Spojna dokumentacja | README wspomina 3 kategorie eksportow (Types, Errors, Utilities) ale pomija 2 dodatkowe moduly (Logger, Template) ktore sa re-eksportowane z index.ts.                                                                                                  |

---

## Podsumowanie

| Aspekt                    | Ocena                               |
| ------------------------- | ----------------------------------- |
| Publiczne API             | PASS                                |
| Implementacja vs kontrakt | PASS                                |
| Typy                      | PASS                                |
| Testy                     | PASS                                |
| Dead code                 | WARN (drobne, akceptowalne)         |
| Dokumentacja              | WARN (minimalistyczna ale poprawna) |
| **ZBIORCZA**              | **PASS**                            |

Core jest dobrze zaprojektowanym pakietem fundamentowym. Wszystkie testy przechodzace (586/586), brak bledow typecheck, pelne pokrycie testami kluczowych funkcji. Glowne uwagi dotycza niekompletnej dokumentacji README, co jest typowe dla pakietow wewnetrznych monorepo.
