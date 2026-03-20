# Audyt dokumentacji

Data audytu: 2026-03-20

## Ocena zbiorcza: WARN

Dokumentacja centralna jest w wiekszosci zgodna z implementacja. Znaleziono kilka
istotnych rozbieznosci (brak dokumentacji komend CLI, nieaktualne nazwy plikow konfiguracyjnych),
ale zadnych krytycznych bledow uniemozliwiajacych uzytkownikowi prace z narzedziem.

---

## 1. Dokumentacja centralna (docs/)

### docs/index.md: PASS

Strona glowna poprawnie deklaruje 37 formatterow (zgodne z kodem -- policzono 37 rejestracji
w `packages/formatters/src/index.ts`). Ticker z nazwami agentow odpowiada zarejestrowanym
formatterom. Linki do getting-started, formatters, enterprise guide sa poprawne (sciezki
wzgledne do plikow istniejacych w repo).

### docs/getting-started.md: WARN

**Pozytywne:**

- Instrukcje `prs init`, `prs compile`, `prs validate` odpowiadaja implementacji CLI.
- Flaga `--migrate` istnieje w kodzie init.ts i jest poprawnie opisana.
- Opis `includePromptScriptSkill: false` jest zgodny z kodem compile.ts (linia 441).
- Tabela wersji (simple/multifile/full) jest zgodna z implementacja formatterow.
- Przyklady .prs sa skladniowo poprawne wzgledem gramatyki parsera.

**Problemy:**

- Sekcja "Configuration" uzywa formatu z zagniezdzonymi obiektami targets (`github: { enabled: true, output: ... }`),
  co jest poprawne, ale niektorzy uzytkownicy moga byc zdezorientowani, poniewaz `prs init` generuje format
  listowy (`- github`). Nie jest to blad, ale niespojnosc w prezentacji.

### docs/reference/language.md: PASS

**Pozytywne:**

- Wszystkie bloki opisane w docs (@meta, @identity, @context, @standards, @restrictions,
  @shortcuts, @params, @guards, @skills, @agents, @local, @knowledge) istnieja w parserze:
  - Parser obsluguje dowolne nazwy blokow przez regule `block` (linia 115 parser.ts):
    `@ Identifier { blockContent }` -- bloki nie sa hardkodowane w parserze, kazdy identyfikator
    jest akceptowany.
  - @meta, @inherit, @use, @extend sa dedykowanymi regulami parsera (potwierdzone).
- Typy wartosci (string, number, boolean, null, array, object, TextBlock, range, enum,
  template expressions) sa zgodne z tokenami w tokens.ts i regulami parsera.
- Sekcja "Reserved Words" poprawnie wymienia slowa kluczowe z tokens.ts.
- Opis zachowania @extend, @use, @inherit jest zgodny z implementacja resolvera.

### docs/reference/cli.md: WARN

**Pozytywne:**

- Komendy `init`, `compile`, `validate`, `diff`, `pull`, `check`, `update-check`, `serve`
  sa poprawnie udokumentowane i istnieja w kodzie CLI (cli.ts).
- Flagi dla kazdej komendy sa zgodne z implementacja.
- Tabela "Available Targets" wymienia 6 glownych targetow -- to jest podzbiór 37, ale jest
  poprawne jako "main targets" (pozostale 30+ sa automatycznie wykrywane z FormatterRegistry).

**Problemy:**

- **Brak dokumentacji `prs import`**: Komenda `import` jest zarejestrowana w cli.ts (linia 143)
  i zaimplementowana w commands/import.ts, ale nie ma wpisu w cli.md. Jest oddzielny guide
  w docs/guides/import.md, ale brak w referencji CLI.
- **Brak dokumentacji `prs registry`**: Podkomendy `registry init`, `registry publish`,
  `registry validate` sa zarejestrowane w cli.ts (linia 151) i zaimplementowane w
  commands/registry/, ale nie ma ich w cli.md.
- Tabela "Available Targets" (linia 176-184) nie wspomina o `factory` jako targetcie, mimo
  ze jest to jeden z "Original 7" formatterow. Tabela wymienia tylko 6 z 7.

### docs/reference/config.md: WARN

**Pozytywne:**

- Struktura konfiguracji (input, registry, targets, validation, watch, formatting, output,
  customConventions) jest zgodna z interfejsem `PromptScriptConfig` w
  `packages/core/src/types/config.ts`.
- Typy rejestrow (local, HTTP, git) sa poprawnie opisane.
- Formatowanie (prettier, proseWrap, tabWidth, printWidth) zgodne z `FormattingConfig`.

**Problemy:**

- **Niepoprawna lista plikow konfiguracyjnych**: Docs mowia o kolejnosci wyszukiwania:
  `promptscript.yaml`, `promptscript.config.yml`, `.promptscriptrc.yaml`.
  Kod (loader.ts linia 12-17) szuka: `promptscript.yaml`, `promptscript.yml`,
  `.promptscriptrc.yaml`, `.promptscriptrc.yml`.
  `promptscript.config.yml` NIE istnieje w kodzie; `promptscript.yml` i `.promptscriptrc.yml`
  nie sa wymienione w docs.
- **Pole `version: '1'` moze wprowadzac w blad**: config.md dokumentuje `version: '1'` jako
  wymagane pole root-level. Jednak `PromptScriptConfig` nie ma takiego pola. Pole `version: '1'`
  jest czescia `UserConfig` (~/.promptscript/config.yaml), nie projektu. Komenda `prs init`
  generuje plik z `id:` i `syntax:` bez `version:`. Docs moga konfundowac uzytkownikow.
- **Konfiguracja targetow w formacie mapowym**: config.md pokazuje targets w formacie
  obiektowym (`targets: { github: { enabled: true } }`), ale `PromptScriptConfig.targets`
  jest tablicą (`TargetEntry[]`), a `prs init` generuje format listowy (`- github`).
  Oba formaty dzialaja, ale docs nie sa spojne z generowanym kodem.
- **Brak dokumentacji `universalDir`**: Pole `universalDir` w `PromptScriptConfig`
  nie jest opisane w config.md.
- **Brak dokumentacji `includePromptScriptSkill`**: Pole nie jest opisane w config.md
  (jest wspomniane w getting-started.md, ale nie w referencji konfiguracji).

### docs/tutorial.md: PASS

Przyklady .prs sa skladniowo poprawne. Flow (organization -> team -> project) jest
zgodny z architektura resolvera. Instrukcje CLI sa poprawne.

---

## 2. Przyklady (docs/examples/)

### docs/examples/minimal.md: PASS

Przyklad .prs jest skladniowo poprawny. Konfiguracja YAML jest poprawna.
Opis generowanego outputu jest ogolnie poprawny (sekcje Identity, Context, Standards, Shortcuts).

### docs/examples/enterprise.md: PASS

Przyklady .prs sa skladniowo poprawne. Flow enterprise (org -> team -> project)
jest zgodny z implementacja. CI/CD konfiguracja jest praktyczna.

### docs/examples/team-setup.md: PASS

Przyklady sa poprawne. Multi-project setup z shared registry jest zgodny z implementacja.

### docs/examples/agents.md: PASS

Przyklad @agents jest zgodny z gramatyka parsera (blok z zagniezdzonymi obiektami).
Opis wlasciwosci agentow (description, content, tools, model, disallowedTools,
permissionMode, skills) jest zgodny z implementacja formatterow Claude i GitHub.

### docs/examples/git-registry.md: PASS

Konfiguracja git registry jest zgodna z `PromptScriptConfig.registry.git`.

---

## 3. Przewodniki (docs/guides/)

### docs/guides/inheritance.md: PASS

Opis single inheritance, registry structure, merge behavior jest zgodny z resolverem.

### docs/guides/migration.md: PASS

Flow migracji (gather files -> classify -> generate .prs) jest poprawny.
Wspomina o `prs init --migrate` ktore istnieje w implementacji.

### docs/guides/multi-file.md: PASS

Opis organizacji plikow z @use jest zgodny z implementacja parsera/resolvera.

### docs/guides/import.md: PASS

Dokumentuje `prs import` -- jedyne miejsce gdzie ta komenda jest opisana
(brakuje w cli.md - patrz wyzej).

### Pozostale guides: PASS (przeglad ogolem)

Guides ci.md, user-config.md, enterprise.md, formatter-architecture.md, vs-manual.md,
ai-migration-best-practices.md, security.md, building-skills.md, skill-contracts.md,
shared-resources.md, local-skills.md, npx-skills.md, faq.md, docker.md nie opisuja
nieistniejacych funkcji. Nie znaleziono ROADMAP items opisanych jako gotowe.

---

## 4. Root docs

### README.md: PASS

- "37 AI agents" -- **POPRAWNE**. Policzono 37 rejestracji `FormatterRegistry.register()`
  w `packages/formatters/src/index.ts`.
- Lista formatterow (GitHub, Claude, Cursor, Antigravity, Factory AI, OpenCode, Gemini
  - 30 more) jest zgodna z kodem.
- Quick start (`prs init`, `prs compile`) jest poprawny.
- Przyklad .prs jest skladniowo poprawny.
- Docker command jest poprawny (`ghcr.io/mrwogu/promptscript:latest`).

### CONTRIBUTING.md: PASS

- Prerequisites (Node.js 20+, pnpm 8+) sa aktualne.
- Procedura setup (`pnpm install`, `nx run-many -t test`) jest poprawna.
- Conventional commits sa zgodne z praktykami projektu.
- Release process (release-please) jest poprawny.
- Project structure (7 pakietow + docs + examples) jest poprawna --
  nie wspomina o nowszych pakietach (importer, browser-compiler, playground, server),
  ale to drobny brak.

### CHANGELOG.md: PASS

- Najnowszy wpis v1.4.6 (2026-03-20) odpowiada ostatnim commitom na main:
  - `a5341c0` -- fix(formatters): add knowledgeContent to GitHub -- ZGODNE
  - `654094f` -- fix(formatters): add missing knowledgeContent -- ZGODNE
  - `ac53ff1` -- fix(formatters): render @knowledge content -- ZGODNE
- Sekcja [Unreleased] wspomina o `prs import` co jest poprawne (bylo dodane w 1.4.0
  ale Unreleased sekcja nie zostala wyczyszczona -- drobna niespojnosc).
- Format zgodny z Keep a Changelog.

### SECURITY.md: PASS

Polityka bezpieczenstwa jest kompletna i aktualna.

---

## 5. Broken links

### Zrodlo: automated-results.md sekcja 9

Raportowano 957 broken linkow.

### Potwierdzone broken: BRAK

Po manualnej weryfikacji nie znaleziono prawdziwych broken linkow w dokumentacji
centralnej (docs/, root docs). Wszystkie linki wewnetrzne prowadza do istniejacych plikow.

### False positives odfiltrowane:

| Wzorzec                                 | Przyczyna false positive                                                                                                                          | Liczba (szac.) |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `../../../core/src/interfaces/*.md`     | Linki w generowanym API reference (docs/api-reference/) do innych plikow API reference. Pliki istnieja, ale skrypt uzywal blednej sciezki bazowej | ~400           |
| `../../../formatters/src/classes/*.md`  | j.w.                                                                                                                                              | ~200           |
| `../../README.md`                       | Relative links z gleboko zagniezdzonego API reference do root README -- pliki istnieja, sciezki poprawne dla MkDocs                               | ~100           |
| `../../../compiler/src/interfaces/*.md` | j.w. co core/formatters                                                                                                                           | ~150           |
| `../../../resolver/src/*.md`            | j.w.                                                                                                                                              | ~50            |
| `../../src/README.md`                   | Linki miedzy pakietami API reference                                                                                                              | ~57            |

**Wniosek:** Wszystkie 957 zraportowanych broken linkow to false positives z automatycznego
skanowania linkow `../` w docs/api-reference/. Te linki sa poprawne w kontekscie MkDocs
(ktory buduje strone z tych plikow) ale wyglacaly jak broken dla skryptu operujacego
na surowych sciezkach plikow.

---

## 6. Findings

| #   | Priorytet | Plik                       | Problem                                                                                                                                                                                                |
| --- | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | **P1**    | `docs/reference/cli.md`    | Brak dokumentacji komendy `prs import <file>`. Komenda istnieje w CLI (cli.ts:143), jest zaimplementowana (commands/import.ts), ma guide (docs/guides/import.md), ale nie ma wpisu w CLI reference.    |
| F2  | **P1**    | `docs/reference/cli.md`    | Brak dokumentacji podkomend `prs registry` (init, publish, validate). Zarejestrowane w cli.ts:151, zaimplementowane w commands/registry/.                                                              |
| F3  | **P2**    | `docs/reference/config.md` | Niepoprawna lista plikow konfiguracyjnych. Docs mowia `promptscript.config.yml` -- taki plik nie istnieje w kodzie. Brakuje `promptscript.yml` i `.promptscriptrc.yml` ktore sa obslugiwane.           |
| F4  | **P2**    | `docs/reference/config.md` | Pole `version: '1'` dokumentowane jako wymagane na root-level, ale `PromptScriptConfig` nie ma takiego pola. Jest to pole `UserConfig`, nie konfiguracji projektu. `prs init` nie generuje `version:`. |
| F5  | **P2**    | `docs/reference/config.md` | Brak dokumentacji pol `universalDir` i `includePromptScriptSkill` w referencji konfiguracji.                                                                                                           |
| F6  | **P2**    | `docs/reference/cli.md`    | Tabela "Available Targets" (6 pozycji) pomija `factory` ktory jest jednym z "Original 7" formatterow.                                                                                                  |
| F7  | **P3**    | `docs/reference/config.md` | Format targets w przykladach (obiektowy `targets: { github: ... }`) jest niespojny z formatem generowanym przez `prs init` (listowy `targets: [- github]`). Oba dzialaja, ale moze dezorientowac.      |
| F8  | **P3**    | `CONTRIBUTING.md`          | Project structure nie wspomina o pakietach importer, browser-compiler, playground, server.                                                                                                             |
| F9  | **P3**    | `CHANGELOG.md`             | Sekcja [Unreleased] zawiera wpisy o `prs import` ktore juz zostaly wydane w v1.4.0. Powinna byc wyczyszczona.                                                                                          |
