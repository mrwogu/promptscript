# Open issue implementation plans

Stan analizy: 2026-08-03. Bazowy commit: `eba37c6202e8`. Repozytorium: `mrwogu/promptscript`.

## Zakres

Strona Issues pokazuje 9 otwartych issue:

- #330 `feat: unify block syntax across .prs blocks`
- #331 `feat: support overriding generated section headers`
- #343 `feat(hooks): support per-target commands and scripts`
- #344 `feat(cli): safely migrate legacy Factory hooks during compile`
- #345 `feat(hooks): add explicit terminal command lifecycle event`
- #346 `fix(hooks): fail closed when project root is unavailable`
- #347 `test(hooks): add cross-target integration fixture for merge and cleanup`
- #348 `docs(validator): define canonical block shapes and diagnostics`
- #349 `feat(language): add explicit override block semantics`

Zamknięte #333 i #335 są traktowane jako wdrożoną bazę techniczną. Ich zakres jest już obecny w `hook-adapters.ts`, capability metadata, migracji Factory i testach smoke. Nie tworzymy dla nich nowych planów.

## Decyzje łączne

### Zależności

```text
#330 -> #331 -> #349

#348 (niezależny kontrakt docs/validatora, wdrażany po #349 tylko dla ograniczenia churn)

#346 -> #343 -> #345 -> #347
#344 -----------------> #347
```

- #330 jest fundamentem dla jednego modelu treści, ale nie blokuje prac hookowych.
- #331 korzysta z uniform block metadata z #330. Nie parsuje nagłówków zależnie od formattera.
- #349 używa ordered operations z #330 i atomowej semantyki presentation metadata z #331.
- #348 nie jest blokowane przez redesign #330 ani funkcje #331/#349. Rule i reference korzystają z compatibility adaptera, jeśli canonical AST nie jest jeszcze dostępny. W tej serii wdrażamy je po #349 tylko po to, aby uniknąć podwójnej migracji tych samych fixtures i docs.
- #343, #345 i #346 zmieniają wspólną warstwę `hook-adapters.ts`; kolejność implementacji to #346, #343, #345, potem integracyjne #347. #344 może być rozwijane równolegle, ale #347 musi testować jego finalny kontrakt.

### Nakładanie zakresu

- #330 i #348: #330 zmienia parser/AST, #348 definiuje dokumentację i walidację. Nie dublować osobnych modeli shape.
- #330 i #349: dodać jeden ordered declaration stream dla `@inherit`, top-level `@use`, blocków, `@extend` i `@override`. Inline `@use` pozostaje wpisem w ordered block body.
- #331 i #348: contextual `@header` jest presentation entry; zwykłe fields `header` i `headers` pozostają domain data. #348 nie waliduje presentation semantics.
- #343 i #345: per-target `matcher` pozostaje wspólnym miejscem dla target-native tool names. #345 rozszerza istniejący `HookTerminalCapability`; nie tworzy drugiego capability registry.
- #344 i #347: migracja musi być serializowana compile-wide lockiem, odwracalna po błędzie i idempotentna. CLI fixture ma wymusić ten kontrakt.

### Rozstrzygnięte konflikty

1. **Unified grammar kontra kompatybilność.** #330 nie usuwa legacy syntax w jednym kroku. Parser normalizuje canonical i legacy formy do jednego AST, validator oznacza niejednoznaczne legacy formy, a migration notes opisują ewentualny codemod.
   - `CanonicalBlock.body` i `CanonicalProgram.operations` są jedynym canonical source of truth.
   - Existing exported `Program` i `Block` pozostają niezmienionymi mutable legacy input/output shapes. Istniejące imports, object literals i consumer mutation typecheckują jak wcześniej.
   - Separate `CanonicalProgram` i `CanonicalBlock` są deep-readonly i nie rozszerzają mutable legacy interfaces. `ProgramInput = Program | CanonicalProgram` jest normalizowany dokładnie raz.
   - Existing public parser entry point zachowuje `Program` return przez detached legacy projection. Nowy canonical entry point oraz resolver/compiler internals używają `CanonicalProgram`.
   - Cały canonical graph oraz `CanonicalBlock.content`, `CanonicalProgram.blocks`, `CanonicalProgram.uses` i `CanonicalProgram.extends` są deep-readonly i runtime deep-frozen przez factory. Mutacje legacy input pozostają legalne przed normalizacją; canonical outputs aktualizuje się wyłącznie immutable helperami.
   - Resolver, validator, compiler, browser compiler, CLI i formattery nie mogą równolegle mutować canonical i compatibility views.
   - Legacy custom formatter zawsze dostaje fresh detached `Program`; tylko explicit canonical formatter capability otrzymuje frozen `CanonicalProgram`.
   - Inline `@use` jest elementem `BlockBody.entries`, aby zachować pełną kolejność body.
   - Shared merge engine przyjmuje jawny policy i `sourceLayerId`. Inheritance zachowuje child-wins, `@use` zachowuje obecny import/source-wins, a duplicate first-match semantics dotyczą dopiero kolejnych declarations w tym samym source layer.
   - Pliki do syntax `1.5.x` bez `@override` wykonują blocks i `@extend` w legacy phase order, mimo że AST zachowuje source order. Syntax `1.6.0` albo presence `@override` włącza sequential operation mode wymagany przez #349. Lower version z override dostaje PS018, ale feature ma nadal jedno deterministic behavior. Upgrade diagnostics wykrywają `@extend` przed deklaracją targetu.
2. **Nagłówek z przykładu #331 kontra spójność formatterów.** Canonical syntax to contextual `@header`, nie przeciążone domain fields ani formatter-specific parsing Markdown:

   ```text
   @standards {
     @header "Coding Rules"
     @header git-commits "Commit Rules"
     code: ["Use strict TypeScript"]
   }
   ```

   Początkowy `## Heading` staje się fallbackiem tylko dla syntax `1.5.0+` i registered primary ownera z `legacyHeadingFallback`; custom/unowned block oraz syntax do `1.4.x` zachowują heading jako body text. `@header` ma wyższy priorytet.
   Zwykłe fields `header` i `headers` w built-in/custom blocks oraz nested domain fields, w tym `mcpServers.*.headers`, pozostają nietknięte.
   Istniejący `KNOWN_SECTIONS` zostaje compatibility projection jednego rozszerzonego `SECTION_REGISTRY`, nie drugim registry.
   `@extend` przenosi presentation patch osobno od body; root `@override` używa `BlockReplacement { body, presentation }`.

3. **`@override` kontra sealed skills.** Override nie może zmienić ani usunąć sealed property. Root replacement `@override skills` jest odrzucany, jeśli narusza sealed state.
   Root replacement zastępuje całe `BlockBody` razem z presentation metadata i inline uses. Brak metadata lub inline use w replacement oznacza ich usunięcie.
4. **Automatyczna migracja Factory.** Compile-time migration działa tylko wtedy, gdy `.factory/hooks.json` jest całkowicie absent, wykonuje się pod compile-wide lockiem i ma tryb warning-only przez flagę `--no-migrate-legacy-hooks`. Każdy existing canonical file, także PromptScript-owned, wyłącza auto-migration. Staged writes, backups i recovery journal zapewniają rollback po obsłużonym błędzie oraz guarded recovery po przerwaniu. Durable complete journal finalizuje new state; unknown post-crash edits nigdy nie są nadpisywane automatycznie i wymagają manual recovery.
5. **Brak project root.** Nie ma fallbacku do process/session CWD dla wrapperów wymagających root. Environment-root i Git-root guards obejmują script oraz command resources wymagające `cwd`. `native-cwd` i `workspace-cwd` są osobnymi strategiami capability i generują jawne `PS4002`, gdy host nie gwarantuje repository root.
6. **Browser parity.** Browser compiler używa tego samego canonical operation engine, merge policies i override validation co Node resolver. Same parity snapshots nie wystarczają.
7. **Capability ownership.** Publiczne `PORTABLE_HOOK_EVENTS` i `HOOK_RUNTIME_CAPABILITIES` w core są jedynymi rejestrami portable events, statusu, root strategy, native event, terminal matcher i matcher enforcement. Validator i adaptery importują te dane zamiast utrzymywać równoległe listy.
8. **Hook IR i locations.** Core jest właścicielem raw i validated hook IR, target overrides i lexical validatora. Canonical `ValueNode` zachowuje location każdego nested object field, array elementu i scalar value; raw `Value` pozostaje tylko compatibility projection.
9. **Filesystem injection.** Locked output lifecycle używa jednego injected filesystem service. PID/start/token są zakodowane w candidate filename, pełne lock metadata trafia do durable candidate, a atomic hard link publikuje candidate jako lock bez okna z pustym plikiem; project-wide lock jest nabywany raz przez outer command, a `--all-builds` przekazuje token do wewnętrznych kompilacji bez ponownego lockowania. Dry-run nie tworzy locka i używa read-only stable snapshot check. Symlink checks odrzucają pre-existing/detected escapes, ale nie obiecują ochrony przed malicious same-privilege ancestor-swap race bez handle-relative OS primitives.

## Wspólny kontrakt jakości

- Każda zmiana ma test parsera, resolvera/validatora albo formattera odpowiednio do warstwy.
- Hook tests sprawdzają Unix, PowerShell, ścieżki ze spacjami, ownership marker i brak duplikatów.
- Docs przykłady muszą przejść compile/validation.
- Nowe tokeny i directives synchronizują zawsze Pygments, VS Code TextMate i Playground Monaco. Zwykłe identifier fields nie wymagają specjalnej reguły highlightera.
- `@extend` pozostaje kompatybilne. `field!` pozostaje kompatybilne.
- Każdy compatibility test porównuje resolved AST oraz output przed i po migracji, nie tylko snapshot nowej ścieżki.
- Cross-layer filesystem lifecycle jest testowany w CLI integration tests. Compiler tests pozostają in-memory.
- Compatibility tests obejmują publiczne legacy AST object literals, custom block `@override`, legacy phase order i upgrade do sequential syntax `1.6.0`.
- VS Code terminal best effort nie polega na ignorowanym matcher field. Generated payload-filter wrapper sprawdza `tool_name` przed uruchomieniem user resource.
- Brak zmian w `CHANGELOG.md`; changelog obsługuje release tooling.

## Kolejność wdrożenia

1. #330: canonical block body, ordered operations, legacy adapter.
2. #331: source-level presentation metadata, syntax `1.5.0` i formatter title resolution.
3. #349: `@override`, syntax `1.6.0`, atomic path replacement.
4. #348: shape matrix, canonical examples, validator diagnostics. Kolejność ogranicza churn, nie jest dependency.
5. #346: fail-closed root wrappers.
6. #343: per-target command/script resource override.
7. #345: `pre-terminal-command` capability mapping i VS Code payload filter.
8. #344: compile-time Factory migration.
9. #347: cross-target integration fixture i CI coverage dla wszystkich hook-emitting output modes.
