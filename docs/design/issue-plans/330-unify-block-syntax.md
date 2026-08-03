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

Contextual `@header` presentation directives z #331 trafiają do `CanonicalBlock.presentation`, a nie do body properties. Zwykłe fields `header` i `headers` pozostają domain data.

`CanonicalBlock.body` i `CanonicalProgram.operations` są jedynym canonical source of truth. Cały canonical graph, w tym body, operations, presentation i nested `ValueNode`, jest `DeepReadonly` oraz runtime deep-frozen. `CanonicalProgram.operations` zachowuje kolejność `@inherit`, top-level `@use`, blocków, `@extend` i `@override`. Existing exported names `Program` i `Block` pozostają niezmienionymi mutable legacy shapes. Separate `CanonicalProgram` i `CanonicalBlock` nie rozszerzają mutable interfaces, więc mogą mieć prawdziwie deep-readonly arrays bez naruszenia TypeScript assignability.

`ProgramInput = Program | CanonicalProgram` i `BlockInput = Block | CanonicalBlock` zachowują publiczne wejścia. Existing parser entry point nadal zwraca detached mutable `Program` projection; nowy `parseCanonical` oraz compiler/resolver internals zwracają `CanonicalProgram`. `CanonicalBlock.content`, `CanonicalProgram.inherit`, `CanonicalProgram.uses`, `CanonicalProgram.blocks` i `CanonicalProgram.extends` są deep-readonly projections, ale legacy projection jest osobnym clone, nie subtype relation. `BlockContent` pozostaje tymczasowym compatibility representation. `toLegacyProgram`/`toLegacyBlockContent` tworzą detached mutable legacy snapshots, a `getBlockProperties`, `getBlockText`, `getBlockItems` i `getInlineUses` czytają wyłącznie canonical body. Mutacje legacy input/output nie zmieniają canonical graph; canonical output zmienia się wyłącznie przez immutable update helpers.

Source order i execution order to osobne kontrakty. AST zawsze zachowuje source order. Dla syntax do `1.5.x` bez `@override` resolver wykonuje kompatybilny phase policy: inheritance, top-level uses, blocks, inline composition, extends. Dzięki temu istniejący `@extend` zapisany przed deklaracją blocku nadal działa jak obecnie. Syntax `1.6.0` z #349 włącza sequential policy, w którym blocks, `@extend` i `@override` wykonują się w source order. Presence `@override` także wymusza sequential policy nawet przy niższej deklaracji, równolegle z PS018, ponieważ parsed feature musi mieć jedno deterministic behavior. Validator emituje migration diagnostic, gdy podniesienie wersji zmieni wynik, np. dla `@extend` przed target blockiem.

Shared merge engine przyjmuje jawny `MergePolicy`:

- inheritance: parent jako base, child wygrywa dla scalar i type mismatch;
- top-level oraz inline `@use`: zachować obecną source/import-wins precedence;
- `@extend`: zachować obecny additive merge oraz `field!`;
- `@override`: complete replacement z #349.

Powtórne zwykłe block declarations zachowują obecną semantykę w obrębie jednego source layer: każdy kolejny `BlockOperation` dla tego samego key dopisuje osobny block, compatibility `blocks` zachowuje duplicates i source order, a path lookup oraz formatter `findBlock` wybiera pierwszy matching block. Resolver nie łączy same-layer duplicates ukrycie.

Composition nie używa tej duplicate rule. Każda operation ma stable `sourceLayerId`. `@inherit` najpierw materializuje parent state, a pierwszy child block danego key mergeuje pierwszy inherited match przez inheritance policy; następne child declarations tego key są same-layer duplicates. `@use` mergeuje pierwszy imported match z pierwszym local match przez import policy, a kolejne imported duplicates pozostawia osobno. Dzięki temu parent/import nie zasłania child/source przez first-match lookup. Validator może raportować istniejący same-layer ambiguity warning, ale nie zmienia wyniku. Kontrakt działa tak samo w `legacyPhased` i `sequential`.

## Plan implementacji

1. **Core AST**
   - Dodać `BlockBody`, ordered entry types, `BlockPresentation`, `ProgramOperation` i discriminated operation kinds.
   - Zachować exported `Program` i `Block` dokładnie jako mutable legacy shapes, pod tymi samymi names i bez nowych required/readonly fields.
   - Wprowadzić separate `CanonicalProgram`, `CanonicalBlock`, `ProgramInput = Program | CanonicalProgram` i `BlockInput = Block | CanonicalBlock`. Canonical interfaces nie rozszerzają mutable legacy interfaces.
   - Dodać canonical `CanonicalBlock.body`, `CanonicalProgram.operations` oraz helpery `getBlockProperties`, `getBlockText`, `getBlockItems` i `getInlineUses`.
   - Oznaczyć canonical compatibility arrays, nested values i content jako `DeepReadonly`, nie tylko płytkie `readonly`.
   - Dodać AST factories `createBlock`, `createProgram`, `normalizeProgram`, `toLegacyProgram` oraz immutable update helpers. Legacy projection jest detached clone i nie może mutować canonical graph.
   - Dodać canonical `ValueNode`/`ObjectFieldNode`/`ArrayElementNode` z location na każdym nested field, scalar i elemencie. `FieldEntry.value` i `ListEntry.value` używają `ValueNode`; `Value` pozostaje compatibility value projection dla istniejących API.
   - Deep-freeze całe canonical nodes i canonical compatibility projections w factory. Detached legacy snapshots pozostają mutable i nie współdzielą references. Żaden publiczny canonical output nie udostępnia mutable nested arrays/maps.
   - Zachować named exports i location na każdym nowym node.
   - Oznaczyć `BlockContent` jako deprecated compatibility representation, bez usuwania go w pierwszym release.

2. **Grammar i visitor**
   - Zastąpić rozdzielne reguły `blockContent` i `extendBlockContent` jedną regułą ordered entries.
   - Ujednolicić top-level visitor tak, aby wpisywał `@inherit`, `@use`, block i `@extend` do jednego `CanonicalProgram.operations` bez grupowania po typie. #349 dodaje do tego samego streamu `@override`.
   - Zachować triple-quoted text, `field: value`, nested objects/arrays, dash-list i inline `@use`.
   - Emitować inline `@use` jako `InlineUseEntry` w jego dokładnej pozycji, nie w bocznym array.
   - Normalizować dash-list do `ListEntry`, zamiast specjalnego `@restrictions` parser branch.
   - Emitować canonical `BlockBody`; compatibility view tworzyć wyłącznie przez AST factory.
   - Zachować existing public parse function i `Program` return type przez `toLegacyProgram(parseCanonical(...))`. Dodać named `parseCanonical`; compiler, resolver i browser compiler używają go bez legacy round-trip.
   - Zachować `field!` jako modifier w operation metadata.
   - Zachować location nested object fields, array elements i standalone values podczas budowania `ValueNode`.
   - Dodać test parse order dla top-level declarations oraz `field -> inline use -> text -> list`, mixed content, empty body, nested values i legacy syntax.

3. **Resolver**
   - Przenieść shape merge do jednego modułu używanego przez Node i browser resolver dla inheritance, `@use`, `@extend` i później `@override`.
   - Merge ma działać na canonical entries z wymaganym `MergePolicy`, zachowując text concat, unique arrays i deep object merge.
   - Każda operation przechowuje `sourceLayerId`. Composition mergeuje first matching block między layers, natomiast kolejne declarations tego samego key w jednym layer pozostają oddzielnymi duplicates.
   - Zachować child-wins dla inheritance oraz obecną source/import-wins precedence dla `@use`, także dla scalar, `TextContent` i type mismatch.
   - Zachować source order declarations podczas `@inherit`, top-level `@use`, aliasowanych `@use`, blocków i extensions. Grammar może nadal ograniczać legalne pozycje, ale visitor nie grupuje poprawnych deklaracji po typie.
   - Dodać jawne `legacyPhased` i `sequential` execution policies. `legacyPhased` pozostaje defaultem do syntax `1.5.x` bez explicit override usage; `sequential` wybiera syntax `1.6.0` albo presence `@override`.
   - Inline `@use` nadal używa dedicated skill composition semantics. Pozycja entry wyznacza fazę i ownership względem sąsiednich entries, ale nie zamienia inline use w generic body merge.
   - Zachować same-layer duplicate `BlockOperation`s bez implicit merge. Cross-layer composition używa jawnej policy powyżej. Path operations wybierają pierwszy matching block zgodnie z obecnym `findIndex`/`findBlock`.
   - Usunąć duplikację `mergeBlockContent` z `inheritance.ts` i `imports.ts` po migracji callerów.
   - Wydzielić browser-safe shared module bez Node filesystem APIs. `packages/browser-compiler/src/resolver.ts` nie utrzymuje drugiej implementacji merge/operation engine.

4. **Migracja downstream**
   - Zmigrować `packages/core/src/template.ts`, resolver skills/guards/composition, compiler, browser compiler, validator walker/policy/rules, CLI inspect/lock scanner oraz formatter extractors.
   - Każdy direct `content.type`, `ast.blocks`, `ast.uses` i `ast.extends` ma używać canonical accessora albo jawnego compatibility boundary.
   - Publiczne serialization i inspection APIs dokumentują, czy zwracają canonical AST, compatibility view, czy oba.
   - Dodać temporary lint/search assertion blokujące nowe direct casts do `BlockContent` poza compatibility module.
   - Utrzymać publiczne validator/formatter/compiler entry points przyjmujące `ProgramInput`. Wewnętrzne funkcje po normalization przyjmują wyłącznie `CanonicalProgram`.
   - Zachować istniejący publiczny `Formatter.format(ast: Program)` contract dla custom formatterów. Formatter adapter zawsze przekazuje mu fresh detached `toLegacyProgram(canonical)` clone.
   - Dodać opt-in `CanonicalFormatter.formatCanonical(ast: CanonicalProgram)` dla built-in formatterów. Adapter używa canonical entry point tylko po explicit capability check; frozen canonical graph nigdy nie trafia do legacy formatter method.
   - Udokumentować, że mutacja legacy input i legacy parser output pozostaje wspierana, ale detached legacy output nie mutuje canonical graph. Canonical output jest immutable.

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
   - Przez jedną wersję eksportować mutable legacy i separate immutable canonical widok AST.
   - Udokumentować canonical source of truth oraz deprecated projections w public API.
   - Usunąć compatibility view dopiero po aktualizacji public API, direct consumers, browser compiler i fixtures downstream.
   - Nie wymagać `body`/`operations` od istniejących zewnętrznych object literals w pierwszym release.

## Testy i weryfikacja

- Core: object literals typed/imported jako existing `Program` i `Block` nadal typecheckują bez canonical fields; normalization generuje canonical AST; factory regeneruje deep-readonly canonical projections po każdej immutable transformacji.
- Public consumer fixture: osobny TypeScript project importuje `Program`/`Block` z package root, buduje i mutuje pre-#330 literals oraz parser output, po czym przechodzi typecheck bez casts.
- Core: mutacja detached legacy parser output nie zmienia canonical body; próba mutacji canonical projection jest blokowana typem oraz runtime deep freeze.
- Core: próba mutacji canonical body, operations, presentation lub nested value jest blokowana typem i runtime deep freeze.
- Parser: wszystkie kombinacje entry order i shape, w tym inline `@use` pomiędzy dwoma fields.
- Parser: nested object/array/scalar locations są dokładne.
- Resolver: inheritance, top-level i inline `@use`, aliases, nested paths, duplicate arrays, text deduplication oraz osobna scalar precedence dla inheritance i import.
- Resolver: parent/child oraz import/local same-key blocks mergeują między source layers zgodnie z policy; drugi same-key block w jednym pliku pozostaje duplicate i nie zasłania first composed result.
- Resolver: `@extend` przed target blockiem zachowuje obecny wynik do `1.5.x`; ten sam plik po upgrade do `1.6.0` dostaje migration diagnostic i deterministic sequential result.
- Resolver/formatter: duplicate blocks pozostają osobnymi entries, path mutation i rendering zachowują first-match behavior.
- Formatter: golden fixtures dla każdego built-in block i każdego targetu bazowego.
- Formatter compatibility: legacy custom formatter może mutować otrzymany detached `Program` bez throw i bez zmiany canonical graph; built-in formatter dostaje frozen `CanonicalProgram`.
- Downstream regression: template interpolation, validator walker, skills/guards, CLI inspect i lock scanner używają canonical accessors.
- Browser compiler: ten sam shared merge/operation engine oraz parity tests dla canonical i legacy input.
- Highlighter: `pnpm grammar:check`.
- Docs examples: `pnpm prs validate --strict` oraz compile smoke.

## Kryterium gotowości

- Jeden canonical AST body dla built-in i custom blocks.
- Jeden ordered program stream obejmuje wszystkie semantic declarations, a jeden ordered body stream obejmuje inline `@use`.
- Canonical compatibility fields są read-only projections i nie mogą rozjechać się z canonical AST; mutable legacy projection jest detached.
- Publiczne legacy AST object literals pozostają akceptowane przez jedną wersję przejściową.
- Wszystkie obecne poprawne pliki nadal kompilują się bez ręcznej migracji.
- Inheritance i `@use` zachowują swoją obecną, różną scalar precedence.
- Ordered operations gotowe dla #349.
- Brak shape-specific merge duplication w resolverze.
- Node i browser resolver używają wspólnego operation engine.
- Trzy highlightery i reference docs opisują ten sam model.
