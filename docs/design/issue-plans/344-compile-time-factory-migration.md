# Issue #344 - safe compile-time Factory hook migration

Issue: https://github.com/mrwogu/promptscript/issues/344

## Cel

Podczas `prs compile` przenieść jednoznaczne, user-owned legacy Factory hooks z `.factory/settings.json` do `.factory/hooks.json`, bez utraty ustawień i bez częściowej migracji.

## Stan obecny

- `packages/cli/src/utils/legacy-factory-hooks.ts:115` ma pure `migrateLegacyFactoryHooks`.
- `packages/cli/src/commands/hooks.ts:79` używa migracji przy `prs hooks install factory`.
- `packages/cli/src/commands/compile.ts:895` tylko wykrywa legacy hooks i emituje warning.
- `writeOutputs` ma dry-run, ownership merge i cleanup, ale compile migration nie jest częścią write transaction.

## Decyzje

- Default compile migration uruchamia się wyłącznie, gdy `.factory/hooks.json` nie istnieje.
- Gdy canonical file istnieje, compile pozostaje warning-only. Explicit merge mode może być osobnym follow-upem, nie ukrytą zmianą zachowania.
- Dodać `--no-migrate-legacy-hooks` jako opt-out warning-only. Flagę propagować także do watch recompiles.
- Migracja jest all-or-nothing: unknown event, malformed entry, mixed ambiguous handler, malformed JSON lub malformed canonical shape zatrzymuje całą migrację.
- Unrelated keys w `settings.json` pozostają value-semantically identyczne. Writer zachowuje wykryte indentation i EOL, ale nie obiecuje byte equality po JSON serialization.
- PromptScript-owned entries nie są przenoszone jako user entries i nie mogą się zdublować.
- Dry-run tylko raportuje canonical write, legacy cleanup i count; nie tworzy plików.
- Dry-run nie tworzy concurrency locka. Wykonuje read-only optimistic snapshot: fingerprintuje oba Factory documents i managed output state przed analizą, odczytuje je ponownie przed reportem, a przy zmianie kończy się actionable retry error. Concurrent dry-runs są dozwolone.
- Gdy legacy Factory hooks są aktywne, lecz migration jest wyłączona, ambiguous albo malformed, compile nie może utworzyć `.factory/hooks.json`, ponieważ canonical file wyłączyłby legacy fallback. Inne target outputs mogą powstać, ale Factory canonical write jest suppressed i compile zwraca warning-only diagnostic z remediation.
- `prs hooks install factory` nadal używa tego samego pure helpera i zachowuje obecny safe behavior.
- `promptscript.lock` jest dependency lockfile, nie concurrency lock. Migracja wymaga osobnego compile-wide lock.
- Dwa `rename` nie są prawdziwą filesystem transaction. Gwarancja oznacza: rollback po obsłużonym błędzie oraz recovery journal po przerwaniu procesu.
- Symlink hardening odrzuca pre-existing escape i wykryte zmiany podczas transaction, ale nie gwarantuje containment przeciw malicious same-privilege processowi ignorującemu compile lock i wykonującemu ancestor swap. Pełna taka gwarancja wymaga handle-relative `openat`/`renameat` primitives, których cross-platform Node API nie udostępnia.

## Plan implementacji

1. **Migration analysis API**
   - Rozszerzyć result helpera o reason/status: `migratable`, `ambiguous`, `malformed`, `unchanged`.
   - Dodać rozróżnienie absent canonical, existing canonical i malformed canonical.
   - Zwracać deterministic paths, entries, count, next canonical document i next legacy document do wykorzystania przez CLI.
   - Nie mieszać I/O z klasyfikacją hook ownership.
   - Porównywać unrelated settings po parsed values. Serialization zachowuje wykryte indentation, trailing newline i EOL, ale key order/whitespace nie jest częścią kontraktu.

2. **Compile integration**
   - Compiler nadal produkuje in-memory outputs. CLI przejmuje filesystem lifecycle po udanym compile.
   - Przed jakimkolwiek read-modify-write outputów nabyć compile-wide lock i pod lockiem ponownie odczytać `.factory/hooks.json`, `.factory/settings.json` oraz managed output state.
   - Gdy Factory target jest wybrany i canonical file jest absent, połączyć migratable user entries z generated canonical output w pamięci i deduplicate stable serialization.
   - Jeśli formatter nie wygenerował `.factory/hooks.json`, utworzyć canonical seed `{ hooks: {} }`, dodać migrated user entries i zarejestrować path jako transaction-owned mixed-ownership output. Późniejszy cleanup nie może usunąć user-only canonical file.
   - Gdy canonical istnieje, zachować warning-only i nie zmieniać legacy settings; fallback jest już canonical.
   - Gdy canonical nie istnieje, ale legacy hooks są ambiguous/malformed albo opt-out jest aktywny, usunąć `.factory/hooks.json` z `FilesystemPlan`, nie uruchamiać Factory cleanup i pozostawić legacy settings nietknięte. Diagnostic wyjaśnia, że canonical output został celowo suppressed, aby nie wyłączyć aktywnych legacy hooks.
   - W warning-only message podać realne remediation: popraw ambiguous entries albo uruchom `prs hooks install factory` po ręcznym przeglądzie. Nie dokumentować nieistniejącego `--migrate-legacy-hooks`.
   - Zbudować jeden `FilesystemPlan` przed write. Plan rozdziela normal outputs/cleanup od dwóch transaction-owned Factory paths.
   - Wyłączyć transaction-owned `.factory/hooks.json` i `.factory/settings.json` z normalnego `writeOutputs` oraz cleanup, aby żaden path nie był zapisany dwa razy.
   - Wykonać normal writes i cleanup przed Factory transaction. Jeśli wcześniejszy krok zawiedzie, nie rozpoczynać migracji. Factory transaction jest ostatnim mutating krokiem przed success report.
   - Przepiąć `writeOutputs`, ownership reads/rewrites, `cleanupManagedOutputs`, migration analysis, staging i recovery na jeden `CliFileSystem`. Żaden mutating call w compile path nie importuje bezpośrednio `fs/promises`.
   - Granica injection obejmuje output lifecycle od pierwszego managed-output/Factory state read pod lockiem do finalnego reportu. Config loading i resolver source reads pozostają poza transaction boundary.

3. **Compile-wide lock**
   - Dodać osobny lock utility dla outer `compileCommand`; nie używać `promptscript.lock`.
   - Lock obejmuje state reads, ownership merge, normal writes, cleanup, migration commit i success reporting.
   - Obecny hook debounce lock nie może otaczać compile i jednocześnie powodować self-deadlock. Przenieść ownership locka do compile flow albo przekazywać jawny acquired lock token.
   - `compileCommandWithResult` przyjmuje internal `CompileExecutionContext` z acquired tokenem. Nested calls z `--all-builds` używają tego tokenu i nie próbują nabyć locka ponownie.
   - `--all-builds` nabywa jeden lock przed pierwszym profilem i zwalnia po ostatnim success/error report. Inny compile nie może wejść między profile.
   - Lock key obejmuje canonical project root i output root. Profile piszące do różnych output roots nadal należą do jednej outer invocation; lista roots jest sortowana przed acquire, aby uniknąć deadlocku.
   - Candidate filename koduje validated PID, process start timestamp i random owner token przed `open`, np. `.promptscript-compile.lock.candidate.<pid>.<start>.<token>`. Candidate powstaje przez injected `open(candidate, 'wx')`, otrzymuje kompletne metadata, `FileHandle.sync()` i parent fsync. Dopiero atomic `link(candidate, lockPath)` publikuje lock; `EEXIST` oznacza przegraną bez nadpisania ownera. Po successful link usunąć candidate i fsync parent. `exists` plus `writeFile` na final lock path jest zabronione.
   - Crash przed metadata write albo `link` może zostawić wyłącznie candidate z owner identity w filename, nigdy pusty final lock. Startup skanuje tylko exact candidate pattern, wymaga regular non-symlink file i usuwa candidate wyłącznie, gdy filename PID nie żyje. Live/PID-reused candidate nie blokuje final lock acquisition i może pozostać do późniejszego cleanup. Malformed candidate name nie jest automatycznie usuwany. Malformed final lock nie jest zgadywany jako stale: compile failuje natychmiast z path i manual recovery guidance zamiast timeoutować bez wyjaśnienia.
   - Multi-root acquire bierze sorted locks po kolei. Przy konflikcie zwalnia tylko wcześniej nabyte własne tokens i retryuje cały zestaw do timeoutu.
   - Lock file zawiera PID, project root, start time i random owner token. Release usuwa lock tylko przy zgodnym tokenie.
   - Stale recovery sprawdza żywotność procesu, nie tylko arbitralny 30-second age, aby nie przerwać długiego aktywnego compile.
   - Drugi compile czeka z timeoutem albo kończy actionable error. Nie może cicho pominąć kompilacji.
   - Watch recompiles używają tego samego lock boundary.
   - Dry-run omija mutating lock i używa optimistic snapshot contractu. Normal compile nigdy nie korzysta z tego wyjątku.

4. **Recoverable Factory transaction**
   - Rozszerzyć `CliFileSystem` o wszystkie potrzebne primitives: `open`, `link`, `fsync`/`FileHandle.sync`, `rename`, `rm`, `lstat`, `realpath`, `mkdir`, `readFile`, `writeFile`, `readdir`, `chmod` i `exists`.
   - Dodać utility zapisujący temp files w tych samych katalogach, sprawdzający każdy symlink ancestor i używający wyłącznie injected filesystem. Pre/post `lstat`/`realpath` oraz exclusive no-follow final open, gdy platforma je wspiera, failują przy wykrytej zmianie. Dokumentować powyższą same-privilege race boundary zamiast obiecywać pełne handle-relative containment.
   - Przed commit utworzyć backups poprzednich plików oraz fsync temp/backup content i parent directories. Jeśli platforma nie wspiera durability primitive, migration kończy się actionable error zamiast obniżać gwarancję po cichu.
   - Zapisać recovery journal z owner token, original paths, original/new content fingerprints, temp paths, backup paths i phase przed pierwszym rename. Journal content i parent directory muszą być durable przed destination rename.
   - Commit order: canonical hooks, legacy settings, journal complete. Po każdym rename fsync odpowiedni parent directory; complete phase także jest durable.
   - Usunąć backups i journal dopiero po obu udanych writes. Po cleanup fsync parent directories.
   - Przy obsłużonym błędzie drugiego rename odtworzyć previous states tylko wtedy, gdy current destination fingerprints odpowiadają phase zapisanej w journalu i backup fingerprints są zgodne. Unknown mismatch blokuje automatyczną mutację.
   - Przy startup pod compile lockiem wykryć incomplete journal. Rollback jest dozwolony wyłącznie dla original/new fingerprints znanych z journalu oraz zweryfikowanych backups.
   - Completed journal po crashu przed cleanup nie jest rollbackowany automatycznie. Recovery weryfikuje oba new fingerprints: zgodne destinations finalizują cleanup idempotentnie.
   - W completed phase każdy existing backup/temp musi mieć journaled fingerprint przed usunięciem; absent cleanup artifact oznacza już wykonany krok i nie jest tampering. Journal znika dopiero po zweryfikowaniu destinations i usunięciu albo potwierdzeniu absence wszystkich cleanup artifacts.
   - Każdy unknown/tampered destination albo existing backup/temp fingerprint zachowuje wszystkie pozostałe destinations, backups, temp files i journal bez zmian, kończy compile actionable manual-recovery error i nie nadpisuje możliwych post-crash user edits.
   - Testy oraz docs nazywają to recoverable transaction, nie pojedynczym atomowym rename wielu plików.
   - Nie usuwać legacy file, jeśli po migracji pozostają unknown/ambiguous entries.

5. **CLI options**
   - Dodać `--no-migrate-legacy-hooks` do compile command help, parsera i watch callback.
   - Dry-run output ma wymieniać: source, destination, migrated count, preserved settings, and whether legacy key would be removed.
   - Exit/status semantics: ambiguity jest warning-only zgodnie z opt-out policy, filesystem/write error jest compile error.

6. **Docs**
   - Uzupełnić `docs/guides/hooks.md`, `docs/reference/cli/hooks.md` i compile CLI docs.
   - Opisać trigger condition: canonical missing.
   - Pokazać successful migration, warning-only ambiguity, malformed JSON, dry-run i opt-out.
   - Opisać compile lock, recovery po interrupted migration i granicę gwarancji recoverable transaction.
   - Wyraźnie rozdzielić language-level `@hooks` output od `prs hooks install`.

## Testy i weryfikacja

- Pure helper: unambiguous events, duplicates, owned entries, unknown events, malformed arrays, mixed handlers.
- CLI integration: missing canonical, existing canonical, unrelated settings, malformed JSON, ambiguous entry, rerun idempotence.
- CLI integration: migration tworzy canonical user-only file także wtedy, gdy source nie generuje żadnego Factory hooka.
- Filesystem plan: transaction-owned paths nie trafiają do normal writer ani cleanup.
- Filesystem boundary: injected service przechwytuje każdy output-state read oraz write/rename/remove/chmod/fsync od wejścia w locked output lifecycle; test failuje przy bezpośrednim Node fs callu wewnątrz tej granicy.
- Recoverable failure: inject failure między renames i assert previous files restored.
- Crash recovery: zostawić journal po każdej incomplete commit phase, uruchomić kolejny compile i assert guarded rollback przed nowym write. Durable complete phase podlega osobnemu finalize testowi, nie rollback assertion.
- Completed-journal recovery: crash po durable complete przed każdym cleanup step finalizuje zgodne destinations; już usunięty backup/temp jest akceptowany, existing tampered artifact albo tampered/missing destination zachowuje evidence i wymaga manual recovery.
- Incomplete-journal safety: known phase fingerprints rollbackują; unknown post-crash edits zatrzymują recovery bez mutacji.
- Concurrency: dwa direct compile, hook-triggered compile i watch recompile nie zapisują równolegle; drugi proces nie jest cicho pomijany.
- Multi-build concurrency: jeden outer lock obejmuje wszystkie profiles, bez interleaving i self-deadlocku.
- Long compile: active lock starszy niż 30 sekund nie jest uznany za stale, jeśli owner process żyje.
- Lock ownership: proces nie usuwa locka z obcym owner tokenem.
- Atomic locking: concurrent creators publikują complete durable candidates przez hard link; dokładnie jeden nabywa key, crash bezpośrednio po candidate open zostawia filename z dead PID i nie tworzy final lock, malformed final metadata daje immediate actionable error, a multi-root conflict zwalnia tylko własne partial locks przed retry.
- Symlink ancestors: pre-existing escape i injected mid-transaction detected swap failują; docs/test threat boundary nie obiecuje ochrony przed malicious same-privilege race bez handle-relative primitives.
- Dry-run: no file mutation, planned actions visible.
- Dry-run concurrency: brak lock file; stable snapshot daje report, concurrent mutation daje retry error, concurrent dry-runs nie blokują się.
- Opt-out: warning preserved, no migration.
- Opt-out/ambiguity safety: przy absent canonical compile nie tworzy `.factory/hooks.json`, legacy hooks pozostają aktywne, inne target outputs nadal zapisują się.
- Compile output: generated Factory hooks plus migrated user entries, no duplicates.
- Existing `prs hooks install factory` tests remain green.
- Cross-target fixture #347 covers migration during repeated compilation and cleanup.

## Kryterium gotowości

- Compile safely removes stale active legacy hooks only when migration is unambiguous.
- Obsłużony write failure rollbackuje oba Factory documents. Interrupted commit jest naprawiany z journal pod lockiem przed kolejnym compile.
- Canonical i settings paths mają jednego writera w compile lifecycle.
- Concurrent compile nie może ominąć locka ani zostać cicho pominięty.
- Rerun is idempotent.
- User can opt out and receive actionable warning.
