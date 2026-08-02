# Issue #349 - explicit override block semantics

Issue: https://github.com/mrwogu/promptscript/issues/349

## Cel

Dodać `@override` jako jawne, atomowe replacement, bez zmiany dotychczasowego merge behavior `@extend` i `field!`.

```promptscript
@extend standards {
  testing: ["Use Vitest"]
}

@override standards.testing {
  ["Use Vitest"]
}
```

Standalone value wewnątrz body jest nową, celową częścią grammar `@override`. Nie jest traktowane jako istniejący regular block body.

## Stan obecny

- `parser.ts:39` i `:116` znają tylko `@extend`.
- `Program.extends` oraz `ExtendBlock` są w `core/src/types/ast.ts`.
- `applyExtends` w `resolver/src/extensions.ts` aplikuje merge w kolejności tablicy, ale `Program` nie zachowuje global order względem blocks.
- `mergeAtPath` tworzy brakujące nested paths.
- `assertSkillPathCanExtend` egzekwuje sealed properties.
- Syntax registry kończy się na `1.4.0`.

## Decyzje semantyczne

- `@extend` pozostaje additive/merge.
- `@override <dot-path> { body }` wymaga, aby pełny target path istniał. Brak targetu to `ResolveError` z path i location.
- Replacement dotyczy całego target value. `@override standards` zastępuje cały block body; `@override standards.testing` zastępuje property.
- Root replacement zastępuje cały `BlockBody`, w tym inline uses i presentation metadata. Brak tych elementów w replacement oznacza ich usunięcie.
- Nested override nie adresuje presentation metadata, aby nie kolidować z legalnymi domain fields. Root replacement zastępuje presentation atomowo; scoped title update używa `@extend` z contextual `@header` z #331.
- Zastąpienie jest atomiczne: resolver nie mutuje częściowo AST przed walidacją targetu i sealed constraints.
- Operations wykonują się w jednym declaration stream z #330. `@inherit`, top-level `@use`, block, `@extend` i `@override` nie są ponownie grupowane po typie. Inline `@use` zachowuje pozycję w ordered block body. `@extend` po `@override` może mergeować w replacement.
- `@override` nie omija sealed skill properties. Root skill replacement jest odrzucany, jeśli usuwa lub zmienia sealed metadata.
- `field!` zostaje jako compatibility syntax dla direct fields w `@extend`.
- Nowa funkcja wymaga `1.6.0`; plik z niższą syntax version dostaje compatibility diagnostic, nie ciche zachowanie.
- `override` pozostaje legalną nazwą custom blocku w legacy syntax. Directive jest contextual: `@override { ... }` to custom block, a `@override <dot-path> { ... }` to operation. Upgrade nie może zmienić istniejącego custom blocku w directive.
- Syntax `1.6.0` włącza sequential operation policy z #330. Syntax do `1.5.x` bez override usage zachowuje legacy phase order dla istniejących blocks i `@extend`; presence `@override` wymusza sequential policy także przy lower declaration i równolegle emituje PS018.

## Plan implementacji

1. **AST i grammar**
   - Nie dodawać lexer tokenu `Override` i nie dodawać `override` do `RESERVED_WORDS`. Lexer zawsze emituje zwykły `Identifier`, więc fields, values, aliases, params, dot-path segments i custom block names pozostają kompatybilne.
   - Dodać contextual `overrideBlock` z Chevrotain `GATE`: po `@` pierwszy `Identifier.image === 'override'`, następny token zaczyna dot-path, a nie `{`. `@override {` przechodzi przez regular block rule.
   - Dodać `OverrideBlock` z `targetPath`, `OverrideReplacement` i loc.
   - `OverrideReplacement` jest discriminated union: `BlockReplacement { body, presentation }` albo `ValueReplacement { value: ValueNode, loc }`. Raw `Value` powstaje tylko w compatibility projection.
   - Dodać `overrideBody`, które rozpoznaje regular ordered block entries albo dokładnie jeden standalone `ValueNode`. Dzięki temu `{ ["Use Vitest"] }`, `{ "text" }` i `{ { key: "value" } }` są parseable replacement values, ale nie stają się legalnym regular block body.
   - Root block override normalizuje standalone array/object/string/TextBlock do odpowiedniego `BlockBody`. Standalone number, boolean i null są parseable dla nested paths, ale root block replacement odrzuca je jako `ResolveError` z accepted root shapes i location.
   - Nested override zachowuje exact `ValueNode`, w tym number, boolean i null.
   - Wspólnie z #330 użyć `Program.operations: ProgramOperation[]`, zachowując `extends` jako read-only API compatibility projection.
   - Visitor wpisuje `@override` do tego samego ordered array co `@inherit`, top-level `@use`, block i `@extend`, bez sortowania po typie.
   - Zaktualizować Pygments, TextMate i Monaco jako contextual directive pattern, mimo braku dedicated lexer tokenu.

2. **Syntax versioning**
   - Dodać `SYNTAX_FEATURES.EXPLICIT_OVERRIDE`.
   - Dodać wersję `1.6.0` z poprzednimi blocks/features i nową feature.
   - Dodać usage tracking w parserze przy contextual identifierze `@override` oraz zachować usage przez wszystkie destructive resolver passes.
   - Rozszerzyć browser-safe `collectSyntaxCompatibilityIssues(ast)` wprowadzone przez #331. Node i browser resolver wywołują collector dla każdego parsed AST przed semantic operations i propagują issues w `ResolvedAST`, także gdy późniejsza operacja zwróci `ResolveError`.
   - PS018 `syntax-version-compat` pozostaje jedynym właścicielem user-facing message, configured severity i suggestion. Parser nadaje usage stabilne ID. Compiler deduplikuje collected oraz direct-validator issue przez `usage.id`, z compatibility fallback `file + (offset ?? line:column) + feature`.
   - Zmienić PS018, aby raportował `usage.location`, nie `meta.loc`.
   - `prs validate --fix` używa collected usages/issues do wyliczenia minimum version nawet wtedy, gdy resolution później failuje; po fix ponowna walidacja nie emituje starego issue.
   - Dodać test monotoniczności registry.
   - `@meta.syntax` bez `1.6.0` raportuje dokładny feature i location identifiera `@override`, nawet jeśli target nie istnieje albo replacement narusza sealed constraint.

3. **Resolver operation engine**
   - Rozszerzyć browser-safe shared `applyOperation` z #330, używane przez Node i browser resolver dla `@extend` i `@override`.
   - Przed operation engine zebrać syntax compatibility issue bez rzucania. Compiler raportuje je razem z późniejszym target existence, traversal lub sealed error, więc PS018 nie jest maskowane.
   - Resolver wybiera sequential policy dla syntax `1.6.0` albo presence `@override`, następnie wykonuje `Program.operations` sekwencyjnie. `@inherit` ładuje base przed kolejnymi declarations, a top-level `@use` mergeuje source w swojej pozycji z import/source-wins policy z #330.
   - Najpierw rozwiązać alias/import marker do surviving block, potem zweryfikować cały path.
   - `@override` na root tworzy replacement block body tylko po znalezieniu target block.
   - Nested replacement traversuje wyłącznie istniejące object/mixed nodes; brak segmentu, scalar po drodze lub array path daje actionable `ResolveError`.
   - Nested paths `header` i `headers` pozostają zwykłymi domain properties. Presentation zmienia wyłącznie root replacement albo `@extend` z `@header`.
   - Clone target i candidate replacement przed commit; wyjątek nie może zostawić częściowego merge.
   - Root replacement nie zachowuje implicit inline uses ani presentation metadata. Replacement body jest kompletnym nowym stanem.
   - `BlockReplacement.presentation` pochodzi z contextual `@header` entries lub legacy heading extraction z #331. Brak presentation w replacement usuwa wcześniejsze metadata.
   - Nie aktualizować `blocks`, `uses` ani `extends` bezpośrednio. Po operation commit AST factory z #330 regeneruje read-only compatibility projections.

4. **Browser compiler**
   - Usunąć osobną implementację extension/path replacement z `packages/browser-compiler/src/resolver.ts` albo przepiąć ją na dokładnie ten sam shared operation engine.
   - Shared module nie może zależeć od Node filesystem APIs.
   - Browser compile musi wykonywać `@override`, alias resolution, syntax usage preservation i sealed checks identycznie jak Node resolver.
   - Parity test porównuje resolved AST, errors z location i formatter output. Same snapshots bez wykonania browser operation engine nie zamykają zakresu.

5. **Skills i sealed**
   - Przed replacementem przejść wszystkie affected skill paths i zbudować set sealed keys z base.
   - Reject `sealed` path, removal of sealed property i replacement całego skill, który narusza sealed contract.
   - Zachować istniejące dedicated skill merge strategies dla `@extend`; `@override` nie może ich obchodzić.
   - Błędy mają wskazywać target path, property i źródłową lokalizację.

6. **Validator**
   - Parser waliduje structure dot-path i non-empty body. Shared collector zapisuje version issue przed resolution.
   - Parser sprawdza tylko strukturę dot-path/body. Resolver po zastosowaniu wcześniejszych inheritance/use operations sprawdza target existence, traversal, root shape i sealed constraints, po czym emituje `ResolveError` na location `@override`.
   - PS018 konsumuje resolver-collected issues i direct AST usages przez jeden dedup path. Nie tworzyć drugiego resolver-specific message ani zmieniać rule severity.
   - Nie dublować semantic validation między resolverem i validatorem.

7. **Docs**
   - Rozszerzyć `@extend` section o porównanie `@extend`, `field!`, `@override`.
   - Dodać compile-checked examples standalone array/object/text value, regular block body, declaration order, root/nested replacement, presentation replacement, missing target i sealed error.
   - Migration guidance: używaj `@extend` dla additive, `field!` dla compatibility direct field, `@override` dla intentional complete replacement.

## Testy i weryfikacja

- Parser/CST: directive, dot paths, standalone array/object/text values, regular body shapes i pełny operation order.
- Parser/CST: legacy custom `@override { ... }` nadal jest zwykłym blockiem; `@override target { ... }` jest operation.
- Resolver: root array/object/text/mixed replacement, rejection root number/boolean/null, nested primitive replacement, aliases, `@inherit`, `@use` i declaration order bez grupowania.
- Ordering: `use -> block -> extend -> override -> extend` oraz inline `field -> use -> field`.
- Ordering compatibility: syntax do `1.5.x` bez override usage zachowuje legacy phase result; `1.6.0` lub override usage używa sequential result. Lower override usage raportuje PS018.
- Presentation: root replacement usuwa stare metadata/inline uses, a explicit replacement zachowuje tylko podane wartości.
- Errors: missing root, missing nested segment, scalar traversal, sealed skill, lower syntax version.
- Error aggregation: lower syntax issue nie jest maskowane przez missing target, invalid root shape ani sealed error.
- Diagnostics: lower syntax PS018 i semantic ResolveError mogą wystąpić razem, ale PS018 pojawia się raz i zachowuje configured severity/off policy.
- Version matrix: `1.4.x` raportuje PS018 dla `@header` i `@override`; bez override zachowuje phased policy. `1.5.x` akceptuje `@header`; bez override zachowuje phased policy, a z override raportuje PS018 i używa sequential policy. `1.6.0` akceptuje oba oraz używa sequential policy. Matrix przechodzi w Node resolver, browser resolver, direct validator i `prs validate --fix`.
- Syntax diagnostic: location wskazuje `@override`, nie `@meta`.
- Regression: `field!`, existing skill merge, non-existent `@extend` warning.
- Browser compiler wykonuje shared operation engine; resolved AST, diagnostics i formatter output są zgodne z Node.
- Docs examples strict validation.

## Kryterium gotowości

- `@override` ma osobny AST operation i syntax gate.
- Przykład standalone array jest obsługiwany przez jawne `overrideBody`, nie przez przypadkową lukę regular grammar.
- Replacement jest atomowy i target musi istnieć.
- Order obejmujący inherit/use/block/extend/override i inline use jest deterministyczny.
- Root replacement ma jednoznaczną semantykę dla presentation metadata i inline uses.
- Sealed skill rules pozostają nienaruszalne.
- Node i browser compiler używają tego samego operation engine.
- Żaden formatter nie wymaga zmian target-specific.
