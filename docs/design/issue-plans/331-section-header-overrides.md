# Issue #331 - override generated section headers

Issue: https://github.com/mrwogu/promptscript/issues/331

## Cel

Pozwolić zmienić tytuł sekcji generowanej przez formatter bez forka formattera. Domyślne nazwy i obecny output pozostają bez zmian.

## Stan obecny

- `packages/formatters/src/markdown-instruction-formatter.ts:95` ma `MarkdownFormatterConfig.sectionNames`, ale jest to konfiguracja formattera, nie źródło `.prs`.
- `getSectionName` jest używane przez część sekcji, lecz `Project`, `Tech Stack`, `Architecture`, `Context` i inne ścieżki mają tytuły inline.
- `addCommonSections` definiuje wspólną kolejność sekcji.
- Formatter-specific implementations mogą mieć własne nagłówki; trzeba objąć także targets spoza `MarkdownInstructionFormatter`.
- Obecny przykład z `## Coding Rules` w `@standards` jest free-form text i nie daje stabilnej semantyki dla wszystkich targetów.

## Decyzja składniowa

Canonical form:

```text
@standards {
  @header "Coding Rules"
  @header git-commits "Commit Rules"
  code: ["Use strict TypeScript"]
}
```

- `@header "..."` zastępuje primary section title dla danego built-in block.
- `@header <section-key> "..."` nazywa derived section, gdy block generuje więcej niż jedną sekcję.
- Canonical public section keys używają kebab-case IDs z `SECTION_REGISTRY`, np. `git-commits`. Existing formatter config keys, np. `gitCommits`, są compatibility aliases mapowanymi jawnie w tym samym registry.
- `@header` jest contextual presentation entry w ordered body, nie zwykłym property i nie globalnym lexer keywordem.
- Zwykłe fields `header` i `headers` pozostają domain data w każdym built-in i custom blocku. Nested fields, w tym `mcpServers.<name>.headers`, nigdy nie są presentation metadata.
- Dla text-only block pierwszy heading `## ...` na początku tekstu pozostaje legacy fallbackiem. Gdy występuje obok `@header`, wygrywa `@header`.
- Legacy fallback konsumuje dokładnie pierwszy heading line z body i emituje go raz jako resolved title. Pozostały text body zachowuje byte-equivalent content poza usuniętą linią headinga i jednym bezpośrednim newline. Heading poza początkiem body pozostaje zwykłą treścią.
- Priorytet: source override > formatter config `sectionNames` > built-in default.

## Plan implementacji

1. **AST i normalizacja**
   - Użyć `BlockPresentation` wprowadzonego w #330; #331 jest właścicielem semantyki i validation tego typu.
   - Dodać canonical `PresentationEntry` do ordered `BlockEntry`: explicit primary, explicit derived albo legacy heading entry, każdy z title i exact location.
   - `PresentationEntry` nie wpływa na `BlockBody.shape`; shape jest wyliczany tylko z text/field/list entries.
   - `PresentationEntry` w ordered body jest jedynym parsed source. `Block.presentation` i operation `presentationPatch` są mandatory derived, deep-readonly projections regenerowane przez AST factory po każdej transformacji. Konsumenci nie mogą mutować ani niezależnie serializować obu form.
   - Grammar rozpoznaje `@header` entry wewnątrz dowolnego block body przez contextual identifier gate. Nie dodawać globalnego `Header` tokenu; zwykłe `header`/`headers` fields i custom names pozostają legalne.
   - Przenieść `SectionContract` i `SECTION_REGISTRY` do browser-safe core, ponieważ validator i formatters muszą czytać ten sam owner/key contract. `packages/formatters/src/section-registry.ts` re-exportuje core registry i compatibility helpers.
   - Visitor zachowuje entry, a validator importuje core `SECTION_REGISTRY` i pozwala presentation semantics tylko dla owner blocków. Custom block z `@header` dostaje unknown contextual directive diagnostic.
   - Zachować location dla directive, section key, title i legacy headinga. Diagnostics nie mogą wskazywać całego blocku.
   - Walidować: title musi być niepustym stringiem; optional key musi istnieć w `SECTION_REGISTRY` i należeć do owner blocku.
   - Nie interpretować dowolnych `##` wewnątrz tekstu jako override, aby nie niszczyć treści dokumentu.
   - Normalizer zastępuje consumed heading line canonical `LegacyPresentationEntry` w tej samej pozycji, a pozostały text zapisuje jako sąsiedni `TextEntry`. Dzięki temu body nie renderuje headinga drugi raz, ale factory nadal może regenerować `Block.presentation.legacyHeader` wyłącznie z canonical entries.

2. **Syntax versioning**
   - Dodać `SYNTAX_FEATURES.SECTION_HEADER_OVERRIDE` i syntax `1.5.0`.
   - Parser zapisuje feature usage na exact location contextual `@header`. Legacy początkowy `## Heading` nie wymaga nowej wersji.
   - Wydzielić browser-safe `collectSyntaxCompatibilityIssues(ast)` w core. Node i browser resolver uruchamiają collector dla każdego root, inherited, imported i inline-composed AST bezpośrednio po parse i propagują issues w `ResolvedAST`, także gdy późniejsza resolution failuje.
   - PS018 pozostaje jedynym właścicielem message, configured severity/off policy i fix suggestion. Parser nadaje usage stabilne ID. Compiler deduplikuje collected oraz direct-validator issue przez `usage.id`, z compatibility fallback `file + (offset ?? line:column) + feature`.
   - Plik z `@header` i syntax niższym niż `1.5.0` dostaje PS018 na directive location. Warning policy nie zmienia semantics; issue nie może zostać utracone przez późniejszy resolver error.
   - `prs validate --fix` używa collected usage nawet po resolver error i podnosi deklarację do minimum `1.5.0`.
   - Dodać monotonic registry test i zachować usage record przez destructive resolver passes.

3. **Centralny resolver tytułów**
   - Rozszerzyć istniejący contract do jednego core `SECTION_REGISTRY`, używanego przez validator, section parity i title resolution.
   - Zachować formatter `KNOWN_SECTIONS` jako deprecated, generated compatibility projection `SECTION_REGISTRY.map(...)`. Nie utrzymywać drugiej ręcznej listy.
   - Dodać `SectionTitleResolver` w `packages/formatters/src`, przyjmujący AST, section key, formatter config i entry z `SECTION_REGISTRY`.
   - Registry przechowuje default title, primary owner block, ordered fallback owner blocks, source blocks oraz informację, czy key jest primary czy derived dla danego ownera.
   - Każdy entry ma canonical kebab-case `id` i optional legacy formatter config aliases. Resolver normalizuje aliases do ID przed owner lookup.
   - Ustalić source precedence dla sekcji złożonych:
     - `Project`: `identity`, potem `context`;
     - `Tech Stack`: `context`, potem `standards`;
     - `Commands`: `shortcuts`, potem derived `knowledge.commands`;
     - `Architecture` i `Context`: `context`;
     - standards subsections: odpowiedni `@header <section-key>` z `standards`.
   - Dla każdego section key pierwszy owner posiadający explicit source override wygrywa. Brak override we wszystkich ownerach przechodzi do formatter config, potem default.
   - Przenieść wszystkie human-readable titles do `SectionNameKey`, w tym inline `Project`, `Tech Stack`, `Architecture`, `Context`, `Commands`, `Documentation`, `Diagrams`, `Knowledge`, `Examples`, `Required Context`, `Restrictions` i tytuły subsection generowane przez formatter-specific paths.
   - Zastąpić inline literals w `addCommonSections` i metodach derived sections resolverem.
   - Dodać adapter API dla formatterów, które nie dziedziczą po `MarkdownInstructionFormatter`.
   - Dodać inventory test, który sprawdza wszystkie formatter paths emitujące human-readable heading. Nowy hardcoded heading wymaga entry w registry albo jawnego komentarza, że jest user content.

4. **Semantyka bloków**
   - Zdefiniować primary section, derived keys i owner precedence dla każdego built-in block.
   - `@header "..."` działa wyłącznie dla primary section danego blocku. `@header <section-key> "..."` działa wyłącznie dla key zarejestrowanego dla tego blocku.
   - Gdy block generuje kilka sekcji, derived entries działają niezależnie; brak wpisu używa default.
   - Duplicate primary albo ten sam derived key w jednym body jest validation error. Kolejne explicit patches z inheritance/use/extend rozstrzyga merge policy.
   - Inheritance: parent presentation jest base, child explicit `@header` wygrywa per section key.
   - Top-level i inline `@use`: zachować source/import-wins policy z #330 per section key.
   - `BlockOperation` i `ExtendOperation` przechowują `presentationPatch` obok body. `@extend` używa last-explicit-wins per section key, bez konkatenacji.
   - Explicit `@header` ma wyższy rank niż legacy heading niezależnie od operation layer. Dwa explicit candidates rozstrzyga operation policy powyżej; dwa legacy candidates również. Incoming legacy heading nie nadpisuje istniejącego explicit `@header`.
   - #349 używa `BlockReplacement { body, presentation }`. Root `@override` zastępuje oba atomowo; brak metadata usuwa wcześniejsze metadata.
   - Root `@override` resetuje poprzedni rank wraz z całym presentation state, więc replacement legacy heading jest skuteczny, jeśli replacement nie zawiera explicit `@header`.
   - Nested `@override` nie adresuje presentation metadata. Pełne presentation replacement jest dostępne przez root block replacement; scoped title update używa `@extend` z `@header`.
   - Empty/whitespace header jest błędem, nie fallbackiem.

5. **Formattery**
   - Zaktualizować wszystkie formattery i common renderer.
   - Sprawdzić osobne implementations w Claude, GitHub, Factory i pozostałych targetach, które kopiują `project`, `architecture`, `context`, `commands`, `postWork` albo knowledge extraction zamiast dziedziczyć common path.
   - Override zmienia tylko human-readable title. Nie zmienia JSON/TOML/YAML keys, filenames, frontmatter property names ani native protocol fields.
   - Dla targetów wieloplikowych registry wskazuje, które nagłówki w plikach dodatkowych są user-visible sections. Nazwa pliku nie wynika z override.
   - Zachować target-specific heading syntax; override jest tylko tekstem tytułu, nie surowym Markdown.

6. **Docs i tooling**
   - Dodać jedną sekcję reference z canonical syntax i mapą section keys.
   - Udokumentować owner i fallback owner każdego section key, zwłaszcza `Project`, `Tech Stack` i `Commands`.
   - Pokazać przykład językowy, angielski i title z Unicode.
   - `header` i `headers` pozostają zwykłymi identifier fields. `@header` jest contextual directive bez osobnego parser tokenu.
   - Zaktualizować Pygments, VS Code TextMate i Playground Monaco dla `@header`; rozszerzyć `grammar:check` o contextual directive parity.
   - Opisać legacy `##` fallback i ograniczenie do headinga początkowego.

## Testy i weryfikacja

- AST: extraction contextual `@header`, loc, inheritance i `@use`.
- Syntax: `1.5.0` accepts `@header`; lower version reports exact directive even when later resolution fails; legacy heading remains available.
- Transitive syntax: lower-version parent, import i inline skill z `@header` raportują własny source location przed composition.
- Syntax diagnostics: PS018 pojawia się raz, zachowuje configured severity/off policy i pozostaje fixable po resolver error.
- Legacy heading: consumed raz, brak duplicated heading, remainder body bez utraty treści.
- Scope regression: built-in/custom `header`/`headers` fields i nested `mcpServers.*.headers` pozostają domain data.
- Validator: unknown/unowned key, empty/non-string title i duplicate key.
- Formatter: override i default dla każdego common section key.
- Composite sections: owner precedence dla `Project`, `Tech Stack` i `Commands`, także gdy oba source blocks istnieją.
- Merge precedence: inheritance child-wins, use source/import-wins, extend last-explicit-wins, root override complete replacement.
- Presentation rank: explicit zawsze wygrywa z legacy w inheritance/use/extend; same-rank conflicts używają operation policy; root override resetuje rank.
- Key compatibility: canonical `git-commits` i legacy formatter config alias `gitCommits` rozwiązują ten sam registry entry.
- Cross-formatter: Claude, Factory, Copilot, Cursor i formatter bez Markdown base.
- Structured outputs: JSON/TOML/YAML keys, filenames i protocol fields pozostają identyczne.
- Regression: cała treść blocku nadal występuje, nie tylko zmieniony header.
- Inventory: brak hardcoded human-readable title omijającego registry.
- Registry compatibility: `KNOWN_SECTIONS` jest generowane z `SECTION_REGISTRY`, a section parity i title defaults nie mogą się rozjechać.
- Golden diff: zaakceptować tylko intentional title changes.

## Kryterium gotowości

- Jeden source-level contract działa dla wszystkich formatterów.
- Contextual metadata nie przechwytuje built-in, custom ani nested domain fields.
- Każda sekcja złożona ma deterministycznego ownera i fallback precedence.
- Brak hardcoded title path omijających resolver.
- Stary `.prs` bez metadata generuje identyczne nagłówki.
- `@header` nie zanieczyszcza danych domenowych blocku; zwykłe `header`/`headers` pozostają nietknięte.
