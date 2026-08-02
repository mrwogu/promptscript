# Issue #330 - unify block syntax

Issue: https://github.com/mrwogu/promptscript/issues/330

## Cel

Ujednolicić parser i AST bez wycinania obecnych form. Każdy block ma jeden model body, niezależnie od tego, czy zawiera tekst, mapę, listę, czy ich kombinację. Legacy syntax pozostaje parsowalny i jest normalizowany do canonical AST.

## Stan obecny

- `packages/parser/src/grammar/parser.ts:122` ma osobne `blockContent` i `extendBlockContent`.
- `packages/parser/src/grammar/visitor.ts:468` klasyfikuje body jako `TextContent`, `ObjectContent`, `ArrayContent` albo `MixedContent`.
- `packages/core/src/types/ast.ts:327` eksponuje union `BlockContent`.
- `packages/resolver/src/inheritance.ts` i `imports.ts` mają duplikowane reguły merge dla shape.
- `Program` przechowuje `blocks` i `extends` osobno, więc nie zachowuje kolejności wszystkich operacji.
- Trzy highlightery mają częściowo niezależne listy directive/block.

## Decyzja projektowa

Wprowadzić canonical `BlockBody`:

```ts
interface BlockBody {
  type: 'BlockBody';
  shape: 'text' | 'object' | 'array' | 'mixed';
  entries: BlockEntry[];
}

type BlockEntry = TextEntry | FieldEntry | ListEntry | InlineUseEntry;

type ProgramOperation =
  | InheritOperation
  | UseOperation
  | BlockOperation
  | ExtendOperation
  | OverrideOperation;
```

`FieldEntry` przechowuje nazwę i canonical `ValueNode`, `ListEntry` canonical element listy, `TextEntry` tekst, a `InlineUseEntry` pełną deklarację inline wraz z lokalizacją. Raw `Value` powstaje tylko w compatibility projection. Jeden `entries` array zachowuje kolejność `field -> @use -> text -> list`. `shape` jest wyliczany przez parser, nie podawany przez użytkownika.

Contextual `@header` presentation directives z #331 trafiają do `Block.presentation`, a nie do body properties. Zwykłe fields `header` i `headers` pozostają domain data.

`Block.body` i `Program.operations` są jedynym canonical source of truth. Cały canonical graph, w tym body, operations, presentation i nested `ValueNode`, jest `DeepReadonly` oraz runtime deep-frozen. `Program.operations` zachowuje kolejność `@inherit`, top-level `@use`, blocków, `@extend` i `@override`. Publiczne wejście pozostaje kompatybilne przez jawne typy `LegacyProgram`/`LegacyBlock` i union `ProgramInput`; istniejące object literals nie muszą od razu dodawać `body` ani `operations`. Parser zwraca `CanonicalProgram`, a compiler, resolver, browser compiler, validator i publiczne API normalizują legacy input dokładnie raz.

Obecne `Block.content`, `Program.inherit`, `Program.uses`, `Program.blocks` i `Program.extends` pozostają przez jedną wersję jako deep-readonly compatibility projections. `BlockContent` pozostaje tymczasowym compatibility representation. `toLegacyBlockContent(body)` tworzy deep-frozen snapshot, a `getBlockProperties`, `getBlockText`, `getBlockItems` i `getInlineUses` czytają wyłącznie canonical body. Mutacje legacy input są legalne przed normalizacją; canonical output zmienia się wyłącznie przez immutable update helpers, które regenerują wszystkie snapshots.

Source order i execution order to osobne kontrakty. AST zawsze zachowuje source order. Dla syntax do `1.5.x` bez `@override` resolver wykonuje kompatybilny phase policy: inheritance, top-level uses, blocks, inline composition, extends. Dzięki temu istniejący `@extend` zapisany przed deklaracją blocku nadal działa jak obecnie. Syntax `1.6.0` z #349 włącza sequential policy, w którym blocks, `@extend` i `@override` wykonują się w source order. Presence `@override` także wymusza sequential policy nawet przy niższej deklaracji, równolegle z PS018, ponieważ parsed feature musi mieć jedno deterministic behavior. Validator emituje migration diagnostic, gdy podniesienie wersji zmieni wynik, np. dla `@extend` przed target blockiem.

Shared merge engine przyjmuje jawny `MergePolicy`:

- inheritance: parent jako base, child wygrywa dla scalar i type mismatch;
- top-level oraz inline `@use`: zachować obecną source/import-wins precedence;
- `@extend`: zachować obecny additive merge oraz `field!`;
- `@override`: complete replacement z #349.

Powtórne zwykłe block declarations zachowują obecną semantykę: każdy `BlockOperation` dopisuje osobny block, compatibility `blocks` zachowuje duplicates i source order, a path lookup oraz formatter `findBlock` wybiera pierwszy matching block. Resolver nie łączy duplicates ukrycie. Validator może raportować istniejący ambiguity warning, ale nie zmienia wyniku. Ta reguła obowiązuje w `legacyPhased` i `sequential`.

## Plan implementacji

1. **Core AST**
   - Dodać `BlockBody`, ordered entry types, `BlockPresentation`, `ProgramOperation` i discriminated operation kinds.
   - Wprowadzić `LegacyProgram`, `LegacyBlock`, `CanonicalProgram`, `CanonicalBlock`, `ProgramInput` i `BlockInput`. Nie dodawać wymaganych canonical fields bezpośrednio do legacy public shape.
   - Dodać canonical `Block.body`, `Program.operations` oraz helpery `getBlockProperties`, `getBlockText`, `getBlockItems` i `getInlineUses`.
   - Oznaczyć compatibility arrays, nested values i content jako `DeepReadonly`, nie tylko płytkie `readonly`.
   - Dodać AST factories `createBlock`, `createProgram`, `normalizeProgram` oraz immutable update helpers, które zawsze regenerują compatibility projections.
   - Dodać canonical `ValueNode`/`ObjectFieldNode`/`ArrayElementNode` z location na każdym nested field, scalar i elemencie. `FieldEntry.value` i `ListEntry.value` używają `ValueNode`; `Value` pozostaje compatibility value projection dla istniejących API.
   - Deep-freeze całe canonical nodes i compatibility snapshots w factory. Żaden publiczny canonical output nie udostępnia mutable nested arrays/maps.
   - Zachować named exports i location na każdym nowym node.
   - Oznaczyć `BlockContent` jako deprecated compatibility representation, bez usuwania go w pierwszym release.

2. **Grammar i visitor**
   - Zastąpić rozdzielne reguły `blockContent` i `extendBlockContent` jedną regułą ordered entries.
   - Ujednolicić top-level visitor tak, aby wpisywał `@inherit`, `@use`, block i `@extend` do jednego `Program.operations` bez grupowania po typie. #349 dodaje do tego samego streamu `@override`.
   - Zachować triple-quoted text, `field: value`, nested objects/arrays, dash-list i inline `@use`.
   - Emitować inline `@use` jako `InlineUseEntry` w jego dokładnej pozycji, nie w bocznym array.
   - Normalizować dash-list do `ListEntry`, zamiast specjalnego `@restrictions` parser branch.
   - Emitować canonical `BlockBody`; compatibility view tworzyć wyłącznie przez AST factory.
   - Zachować `field!` jako modifier w operation metadata.
   - Zachować location nested object fields, array elements i standalone values podczas budowania `ValueNode`.
   - Dodać test parse order dla top-level declarations oraz `field -> inline use -> text -> list`, mixed content, empty body, nested values i legacy syntax.

3. **Resolver**
   - Przenieść shape merge do jednego modułu używanego przez Node i browser resolver dla inheritance, `@use`, `@extend` i później `@override`.
   - Merge ma działać na canonical entries z wymaganym `MergePolicy`, zachowując text concat, unique arrays i deep object merge.
   - Zachować child-wins dla inheritance oraz obecną source/import-wins precedence dla `@use`, także dla scalar, `TextContent` i type mismatch.
   - Zachować source order declarations podczas `@inherit`, top-level `@use`, aliasowanych `@use`, blocków i extensions. Grammar może nadal ograniczać legalne pozycje, ale visitor nie grupuje poprawnych deklaracji po typie.
   - Dodać jawne `legacyPhased` i `sequential` execution policies. `legacyPhased` pozostaje defaultem do syntax `1.5.x` bez explicit override usage; `sequential` wybiera syntax `1.6.0` albo presence `@override`.
   - Inline `@use` nadal używa dedicated skill composition semantics. Pozycja entry wyznacza fazę i ownership względem sąsiednich entries, ale nie zamienia inline use w generic body merge.
   - Zachować duplicate `BlockOperation`s bez implicit merge. Path operations wybierają pierwszy matching block zgodnie z obecnym `findIndex`/`findBlock`.
   - Usunąć duplikację `mergeBlockContent` z `inheritance.ts` i `imports.ts` po migracji callerów.
   - Wydzielić browser-safe shared module bez Node filesystem APIs. `packages/browser-compiler/src/resolver.ts` nie utrzymuje drugiej implementacji merge/operation engine.

4. **Migracja downstream**
   - Zmigrować `packages/core/src/template.ts`, resolver skills/guards/composition, compiler, browser compiler, validator walker/policy/rules, CLI inspect/lock scanner oraz formatter extractors.
   - Każdy direct `content.type`, `ast.blocks`, `ast.uses` i `ast.extends` ma używać canonical accessora albo jawnego compatibility boundary.
   - Publiczne serialization i inspection APIs dokumentują, czy zwracają canonical AST, compatibility view, czy oba.
   - Dodać temporary lint/search assertion blokujące nowe direct casts do `BlockContent` poza compatibility module.
   - Utrzymać overloady przyjmujące `ProgramInput` dla publicznych validator/formatter/compiler entry points. Wewnętrzne funkcje po normalization przyjmują wyłącznie `CanonicalProgram`.
   - Udokumentować, że mutacja legacy input przed wywołaniem API pozostaje wspierana, a canonical output jest immutable.

5. **Validator**
   - Dodać shape accessors i validation hooks, aby built-in rules nie castowały bezpośrednio `Record<string, Value>`.
   - Custom blocks pozostają bez predefined schema.
   - Legacy forms generują migration hint tylko wtedy, gdy shape jest niejednoznaczny.
   - Dodać diagnostic dla syntax upgrade, jeśli legacy phase order i sequential order dają inny wynik.

6. **Formatters**
   - Migrować extractors na accessors zamiast bezpośredniej inspekcji `content.type`.
   - Sprawdzić, że żadna treść nie znika przy przejściu Text/Object/Mixed.
   - Nie zmieniać outputu dla obecnych canonical i legacy fixtures.

7. **Highlightery i docs**
   - #330 nie dodaje tokenu ani directive. Uruchomić istniejący sync check bez sztucznych reguł dla zwykłych fields.
   - Przy późniejszym dodaniu `Override` przez #349 utrzymać zgodność `docs_extensions/promptscript_lexer.py`, `apps/vscode/syntaxes/promptscript.tmLanguage.json` i `packages/playground/src/utils/prs-language.ts`.
   - Przepisać reference language na jeden model body, z sekcją legacy compatibility.
   - Dodać canonical examples do docs, pełna macierz shape jest w #348.

8. **Compatibility rollout**
   - Wprowadzić feature flag/version gate dopiero dla syntax additions, nie dla istniejących form.
   - Przez jedną wersję eksportować oba widoki AST.
   - Udokumentować canonical source of truth oraz deprecated projections w public API.
   - Usunąć compatibility view dopiero po aktualizacji public API, direct consumers, browser compiler i fixtures downstream.
   - Nie wymagać `body`/`operations` od istniejących zewnętrznych object literals w pierwszym release.

## Testy i weryfikacja

- Core: legacy object literals nadal typecheckują; normalization generuje canonical AST; factory regeneruje deep-readonly compatibility views po każdej immutable transformacji.
- Core: próba mutacji nested compatibility snapshot nie zmienia canonical body i jest blokowana typem oraz runtime deep freeze.
- Core: próba mutacji canonical body, operations, presentation lub nested value jest blokowana typem i runtime deep freeze.
- Parser: wszystkie kombinacje entry order i shape, w tym inline `@use` pomiędzy dwoma fields.
- Parser: nested object/array/scalar locations są dokładne.
- Resolver: inheritance, top-level i inline `@use`, aliases, nested paths, duplicate arrays, text deduplication oraz osobna scalar precedence dla inheritance i import.
- Resolver: `@extend` przed target blockiem zachowuje obecny wynik do `1.5.x`; ten sam plik po upgrade do `1.6.0` dostaje migration diagnostic i deterministic sequential result.
- Resolver/formatter: duplicate blocks pozostają osobnymi entries, path mutation i rendering zachowują first-match behavior.
- Formatter: golden fixtures dla każdego built-in block i każdego targetu bazowego.
- Downstream regression: template interpolation, validator walker, skills/guards, CLI inspect i lock scanner używają canonical accessors.
- Browser compiler: ten sam shared merge/operation engine oraz parity tests dla canonical i legacy input.
- Highlighter: `pnpm grammar:check`.
- Docs examples: `pnpm prs validate --strict` oraz compile smoke.

## Kryterium gotowości

- Jeden canonical AST body dla built-in i custom blocks.
- Jeden ordered program stream obejmuje wszystkie semantic declarations, a jeden ordered body stream obejmuje inline `@use`.
- Compatibility fields są read-only projections i nie mogą rozjechać się z canonical AST.
- Publiczne legacy AST object literals pozostają akceptowane przez jedną wersję przejściową.
- Wszystkie obecne poprawne pliki nadal kompilują się bez ręcznej migracji.
- Inheritance i `@use` zachowują swoją obecną, różną scalar precedence.
- Ordered operations gotowe dla #349.
- Brak shape-specific merge duplication w resolverze.
- Node i browser resolver używają wspólnego operation engine.
- Trzy highlightery i reference docs opisują ten sam model.
