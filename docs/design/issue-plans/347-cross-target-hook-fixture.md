# Issue #347 - cross-target hook merge and cleanup fixture

Issue: https://github.com/mrwogu/promptscript/issues/347

## Cel

Dodać jeden end-to-end fixture, który testuje pełny lifecycle `@hooks`: compile, target serialization, merge z istniejącą konfiguracją, ownership, migration, repeated compile i removal.

## Stan obecny

- `packages/compiler/src/__tests__/hooks-targets.smoke.spec.ts` testuje root/cwd i capability warnings.
- `packages/formatters/src/__tests__/hook-adapters.spec.ts` ma szerokie unit coverage adapterów.
- `packages/cli/src/utils/__tests__/legacy-factory-hooks.spec.ts` testuje pure migration.
- Cleanup działa w compile flow i rozpoznaje ownership marker.
- Brakuje jednego fixture spinającego wszystkie warstwy i target overrides.

## Fixture

Source `.prs`:

- portable repository script under `.promptscript/scripts/`.
- `@hooks` with `pre-tool-use`, `post-tool-use` i `pre-terminal-command`.
- Factory, GitHub i VS Code target resource/matcher overrides z #343/#345.
- Portable resource jest także kompilowany dla Claude, Cursor, Codex, Gemini, Windsurf i Grok, aby assertions dla root strategy i terminal capability miały jawny target setup.
- `cwd: "project"`, nested cwd i args/path ze spacjami.

Pre-existing files:

- `.factory/hooks.json` or absent depending scenario.
- `.factory/settings.json` with unrelated settings, unmanaged hooks and legacy owned entries.
- `.github/hooks/promptscript.json` with unmanaged entries.
- VS Code target output only when `targets.vscode` is selected.
- unmanaged file/dir adjacent to generated output.

## Plan implementacji

1. **Fixture harness**
   - Dodać reusable temp-project builder w CLI integration tests, obok `packages/cli/src/commands/__tests__/compile.spec.ts`.
   - Tworzyć source, scripts, target config, existing JSON and ownership markers deterministically.
   - Expose helper wywołujący publiczny `compileCommand` z target selection, formatter output mode/version, output root, dry-run, watch-compatible options, injected `CliFileSystem` faults oraz repeated invocation.
   - Capture stdout, stderr, exit status i filesystem tree po każdym run.
   - Nie opierać lifecycle fixture na `Compiler.compile()`, ponieważ compiler zwraca in-memory outputs i nie wykonuje write, cleanup, migration ani dry-run.
   - Zachować osobne compiler smoke tests dla pipeline i formatter output bez filesystem assertions.

2. **Initial compilation assertions**
   - Factory emits `.factory/hooks.json` with PascalCase events.
   - GitHub emits `.github/hooks/promptscript.json` with current schema.
   - VS Code output appears only when `targets.vscode` is present.
   - Per-target command/script resources survive serialization.
   - Terminal event maps, warns lub jest omitted zgodnie z `HOOK_RUNTIME_CAPABILITIES`, bez ręcznej drugiej matrix.
   - Root guards są obecne dla env/Git-root script oraz command resources wymagających `cwd`.
   - Cursor i Gemini emitują best-effort terminal mapping, GitHub i Grok nie emitują misleading terminal entry.
   - VS Code terminal hook przechodzi przez generated payload filter: matching payload uruchamia sentinel, non-matching payload nie uruchamia.

3. **Merge and ownership assertions**
   - Unmanaged settings and hook entries remain value-semantically equivalent. Byte equality sprawdzać tylko dla plików, których compile nie zapisuje.
   - PromptScript-owned entries update in place.
   - Repeated compilation does not duplicate generated entries or marker commands.
   - Changed source replaces only owned entry, not unmanaged sibling.
   - Removed target output is cleaned only when fully PromptScript-owned.

4. **Legacy migration assertions**
   - Legacy `.factory/settings.json` unambiguous user hooks migrate to canonical file.
   - Unrelated settings survive.
   - Owned legacy hooks do not duplicate.
   - Unknown event, malformed JSON, mixed ownership and ambiguous handler nie mutują legacy settings i nie tworzą częściowo migrated canonical state.
   - Rerun after migration is unchanged.
   - `--dry-run` and `--no-migrate-legacy-hooks` report/no-op correctly.
   - Inject failure między Factory transaction renames i sprawdzić rollback.
   - Pozostawić recovery journal po każdej phase, uruchomić następny compile i sprawdzić recovery przed nowym output.
   - Sprawdzić, że `.factory/hooks.json` i `.factory/settings.json` są zapisane tylko przez transaction path, nie wcześniej przez generic writer/cleanup.
   - Uruchomić `--all-builds` z co najmniej dwoma profiles do wspólnego output root i potwierdzić jeden outer lock, brak interleaving oraz brak self-deadlocku.
   - Uruchomić drugi `--all-builds` scenario z różnymi output roots. Asertować sorted lock acquisition, cleanup wszystkich wcześniej nabytych locków po partial acquire failure i brak deadlocku przy odwróconej kolejności profiles.

5. **Removal and cleanup**
   - Remove `@hooks` from source, compile again.
   - Only PromptScript-owned generated files/entries disappear.
   - Managed empty directories are pruned.
   - Unmanaged files and directories survive.
   - Legacy settings are not deleted wholesale.

6. **Runtime root failure assertions**
   - Wykonać wygenerowane POSIX wrappers w temp project z sentinel script/command.
   - Dla unset/empty env root, non-zero `git rev-parse` i blank Git root assert non-zero exit oraz brak sentinel invocation.
   - Powtórzyć dla portable i per-target command/script z `cwd`.
   - PowerShell sprawdzać wykonaniem, gdy `pwsh` jest dostępne, inaczej exact structural assertions wspólnego guard contract.
   - Native-CWD i workspace-CWD nie używają session fallback udającego repository guarantee; diagnostics są zgodne z odrębnymi strategies.

7. **CI wiring**
   - Register fixture in CLI integration target.
   - Parametryzować każdy runtime target po `HOOK_RUNTIME_CAPABILITIES[target].emissionContexts`: realny formatter, wszystkie hook-emitting versions i required target override.
   - VS Code uruchamia GitHub formatter w `multifile` i `full` z `targets.vscode`; `simple` asertuje brak outputu. Nie traktować `vscode` jako formattera ani `workspace` jako formatter version.
   - Unsupported modes muszą jawnie asertować brak outputu.
   - Ensure test runs on Unix i Windows-compatible assertions. POSIX runtime wykonuje się na Unix; PowerShell runtime wykonuje się, gdy `pwsh` jest dostępne, inaczej używa structural contract assertions.
   - Avoid relying on installed external AI tools; assert generated contract locally.
   - Keep focused adapter tests for exact serialization; fixture asserts cross-layer behavior.

## Test matrix

| Scenario                   | Expected                                     |
| -------------------------- | -------------------------------------------- |
| first compile              | all selected outputs created                 |
| repeat compile             | no duplicates, unchanged result              |
| changed source             | owned entries updated                        |
| unmanaged sibling          | parsed value preserved                       |
| legacy unambiguous         | committed through recoverable transaction    |
| legacy ambiguous           | no legacy mutation, diagnostic               |
| transaction write failure  | previous Factory documents restored          |
| interrupted transaction    | next compile recovers journal before writing |
| missing project root       | script/command fails closed before sentinel  |
| terminal event best effort | output plus explicit capability diagnostic   |
| terminal event unsupported | `PS4002`, no false output                    |
| remove `@hooks`            | owned output removed, unmanaged retained     |
| dry-run                    | actions reported, files unchanged            |
| all builds                 | one outer lock, no interleaving/deadlock     |
| all builds, multiple roots | sorted acquire, partial failure cleanup      |
| supported output modes     | every hook-emitting mode covered in CI       |

## Kryterium gotowości

- One CLI fixture catches regressions across compiler, formatters, CLI migration, write and cleanup.
- All acceptance criteria from #347 are direct assertions, not snapshots alone.
- Filesystem lifecycle nie jest testowany przez in-memory compiler helper.
- Recoverable transaction, root guards i capability-driven terminal behavior są wykonywane, nie tylko snapshotowane.
- Fixture can be extended for new hook events/targets without copying setup.
