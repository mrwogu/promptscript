# Issue #348 - canonical block shapes and diagnostics

Issue: https://github.com/mrwogu/promptscript/issues/348

## Cel

Stworzyć jedną, wyszukiwalną referencję shape blocków oraz walidację, która wyjaśnia oczekiwany model i wpływ na output. Nie robić pełnego redesignu grammar niezależnie od #330.

Issue nie wymaga redesignu #330 ani funkcji #331/#349. Reference, fixtures i validator rule mają działać na obecnym AST przez compatibility shape accessor. Jeśli #330 jest już wdrożone, ten sam accessor czyta canonical `BlockBody`. W tej serii #348 jest implementowane po #349 wyłącznie w celu ograniczenia churn w tych samych docs i fixtures, nie jako dependency kontraktu.

## Zakres shape

Canonical reference ma opisywać:

| Shape  | Canonical use                              | Merge                                            |
| ------ | ------------------------------------------ | ------------------------------------------------ |
| text   | identity, free-form context, prose         | text concat z deduplication                      |
| object | context metadata, shortcuts, hooks, skills | deep merge, block-specific rules                 |
| array  | list-like content; restrictions dash-list  | unique concat, legacy dash-list syntax preserved |
| mixed  | structured fields plus prose               | niezależny merge text i properties               |

Dla każdego built-in blocku opisać canonical shape, dozwolone legacy shapes, formatter behavior, merge behavior i pełny compile-ready przykład. Lista obejmuje co najmniej `identity`, `context`, `standards`, `restrictions`, `knowledge`, `shortcuts`, `commands`, `guards`, `params`, `skills`, `agents`, `local`, `workflows`, `prompts`, `examples`, `hooks`, `mcpServers` i `plugins`.

## Decyzje

- Canonical shape matrix opisuje closed union `text | object | array | mixed`; nie tworzy drugiego modelu tylko dla dokumentacji.
- Standalone implementacja przed #330 dodaje `getObservedBlockShape(block: Block)` nad obecnym `BlockContent`. Gdy #330 jest dostępne, zachowuje ten overload i dodaje `BlockInput`, czytając canonical `BlockBody` bez zmiany publicznego wyniku.
- Dash-list jest surface syntax normalizowanym do `array`, nie piątym shape.
- Custom blocks pozostają open-world; validator sprawdza syntax, nie narzuca schema.
- `@shortcuts` zachowuje scalar/multiline compatibility, ale canonical przykład używa explicit `content` dla commandu wieloliniowego:

  ```promptscript
  @shortcuts {
    "/test": {
      content: """
        Run the complete test suite.
      """
    }
  }
  ```

  Formatter może nadal przyjmować istniejący scalar i multiline scalar. `content` jest preferowany w nowych plikach, aby usunąć output ambiguity.

- Opcjonalne contextual `@header` entries z #331 są opisane poza domain properties. Zwykłe fields `header`/`headers` pozostają domain data.

## Stan obecny

- `packages/parser/src/grammar/visitor.ts:468` robi implicit classification.
- `packages/core/src/types/ast.ts:327` ma shape union bez canonical matrix.
- `packages/resolver/src/inheritance.ts:61` i `imports.ts:162` mają shape-dependent merge.
- `packages/validator/src/rules/index.ts` nie ma generic shape rule.
- `docs/reference/language.md` opisuje blocki w rozproszonych sekcjach.
- Shortcut serialization jest w `MarkdownInstructionFormatter` i testach comprehensive.

## Plan implementacji

1. **Reference contract**
   - Dodać `docs/reference/block-shapes.md` jako single searchable reference.
   - Dla każdego blocku opisać: cel, canonical body, supported legacy, invalid/ambiguous forms, output examples i merge.
   - Dodać link z `docs/reference/language.md`, guide formatterów i docs automation.
   - Wszystkie przykłady trzymać w fixture files lub compile smoke snippets, aby nie rozjechały się z parserem.
   - Generować lub sprawdzać snippets z tych samych fixtures. Nie utrzymywać ręcznie dwóch kopii przykładu.

2. **Canonical examples**
   - Dodać fixture dla każdego built-in blocku.
   - Oprócz podstawowej postaci pokryć nested object, arrays, multiline, mixed content i inheritance tam, gdzie mają znaczenie.
   - Dla shortcutów pokazać scalar legacy, multiline legacy oraz `content` canonical.
   - Dla `hooks` połączyć examples z capability docs, ale nie powielać pełnego hook contractu.

3. **Validator rule**
   - Dodać rule po istniejącym PS034-PS036, z nowym stabilnym ID wybranym po sprawdzeniu registry.
   - Diagnostics mają zawierać block, observed shape, expected shape, poprawny minimal example i migration hint.
   - Error tylko dla shape jawnie nieobsługiwanego lub zmieniającego znaczenie outputu; warning dla supported legacy i ambiguous form.
   - Nie zgłaszać błędu dla custom blocków bez predefined schema.
   - Walidować shortcut `content` i canonical shapes built-inów w jednym rule family.
   - Nie walidować presentation metadata w #348. #331 jest wyłącznym właścicielem `@header` diagnostics.
   - Rule nie zależy od `@override` ani presentation metadata. Integracje z #331/#349 są additive tests uruchamianymi tylko wtedy, gdy features istnieją w syntax registry.

4. **Resolver i formatter semantics**
   - Użyć shape accessor działającego dla legacy i canonical AST. Jeśli #330 jest wdrożone, nie utrzymywać drugiego merge modelu.
   - Ustalić block-specific exceptions w registry, nie w przypadkowych formatterach.
   - Testować `@inherit`, top-level i inline `@use`, aliases, `@extend` i mixed content z zachowaniem obecnej semantyki. `@override` dodaje osobny matrix row tylko gdy #349 jest dostępne.
   - Node i browser compiler używają tego samego shared merge/operation engine. Matrix nie dokumentuje osobnych semantyk dla browsera.
   - Shortcut serializers mają preferować `content`, a scalar/multiline legacy utrzymać byte-compatible tam, gdzie obecny output jest określony.

5. **Tooling alignment**
   - Dodać playground examples i linki do reference.
   - `header`, `headers` i shortcut `content` są zwykłymi identifier fields. Optional `@header` z #331 jest contextual directive i podlega jego trzy-highlighter sync.
   - Dla contextual directive `@override` z #349 synchronizować Pygments, TextMate i Monaco.
   - Obecny `grammar:check` sprawdza parser token coverage w TextMate oraz block directives w trzech highlighterach. Rozszerzyć go o contextual directive parity dla `@override` w Pygments i Monaco. Nie wymagać nieistniejącego parser tokenu ani dodawać redundantnego ogólnego "missing tokens" check.

## Testy i weryfikacja

- Compile każdy canonical example.
- Validator: canonical pass, legacy pass/warning, unsupported error, custom block pass.
- Validator scope: built-in/custom `header`/`headers` i nested MCP `headers` pass bez #348 presentation diagnostic.
- Resolver: merge matrix shape x operation (`inherit`, `use`, `extend`, `override`) z różnymi merge policies dla inheritance i import.
- Ordering: top-level declarations oraz inline `@use` nie są grupowane po typie.
- Browser: ten sam matrix przechodzi przez browser compiler.
- Formatter: shortcut scalar/multiline/content i wszystkie relevant targety.
- Docs CI: no stale examples, strict validation, grammar sync.

## Kryterium gotowości

- Jedna referencja opisuje wszystkie built-in blocks.
- Każdy przykład compile-uje się.
- Gdy #330, #331 lub #349 są dostępne, reference pobiera ich shapes/features z compatibility accessor i syntax registry zamiast utrzymywać ręczną alternatywną specyfikację.
- Reference jest zamykalne na obecnym AST i aktualizuje feature rows automatycznie z registry, więc nie jest blokowane przez #330, #331 ani #349.
- Diagnostics mówią, co jest nie tak i jak to naprawić.
- Legacy syntax nie znika bez migration note.
- Shape rules nie blokują custom blocks.
