# Audyt: @promptscript/cli

Data: 2026-03-20
Audytor: Claude Agent (pelna glebokosc)

## Ocena zbiorcza: PASS

Pakiet CLI jest dojrzaly, dobrze udokumentowany i pokryty testami. Nie wykryto problemow krytycznych (P0/P1).
Wszystkie 586 testow przechodzi (0 failing). Typecheck i lint bez bledow.

---

## 1. Publiczne API - eksporty vs dokumentacja

### Eksporty z `index.ts`

| Eksport                   | Typ      | Udokumentowany w README                                    | Ocena                         |
| ------------------------- | -------- | ---------------------------------------------------------- | ----------------------------- |
| `run`                     | function | Nie (wewnetrzny entry point)                               | PASS - CLI binary entry point |
| `initCommand`             | function | Tak (`prs init`)                                           | PASS                          |
| `compileCommand`          | function | Tak (`prs compile`)                                        | PASS                          |
| `validateCommand`         | function | Tak (`prs validate`)                                       | PASS                          |
| `pullCommand`             | function | Tak (`prs pull`)                                           | PASS                          |
| `diffCommand`             | function | Tak (`prs diff`)                                           | PASS                          |
| `checkCommand`            | function | Nie bezposrednio, ale `prs check` nie jest w tabeli komend | WARN                          |
| `updateCheckCommand`      | function | Tak (`prs update-check`)                                   | PASS                          |
| `loadConfig`              | function | Posrednio (sekcja Configuration)                           | PASS                          |
| `findConfigFile`          | function | Nie (API wewnetrzne)                                       | PASS                          |
| `CONFIG_FILES`            | const    | Nie (API wewnetrzne)                                       | PASS                          |
| `ConsoleOutput`           | object   | Nie (API wewnetrzne)                                       | PASS                          |
| `createSpinner`           | function | Nie (API wewnetrzne)                                       | PASS                          |
| `LogLevel`                | enum     | Nie (API wewnetrzne)                                       | PASS                          |
| `setContext`              | function | Nie (API wewnetrzne)                                       | PASS                          |
| `getContext`              | function | Nie (API wewnetrzne)                                       | PASS                          |
| `isVerbose`               | function | Nie (API wewnetrzne)                                       | PASS                          |
| `isQuiet`                 | function | Nie (API wewnetrzne)                                       | PASS                          |
| `checkForUpdates`         | function | Posrednio (Automatic Update Checks)                        | PASS                          |
| `forceCheckForUpdates`    | function | Nie (API wewnetrzne)                                       | PASS                          |
| `fetchLatestVersion`      | function | Nie (API wewnetrzne)                                       | PASS                          |
| `getCacheDir`             | function | Nie (API wewnetrzne)                                       | PASS                          |
| `getCachePath`            | function | Nie (API wewnetrzne)                                       | PASS                          |
| `printUpdateNotification` | function | Nie (API wewnetrzne)                                       | PASS                          |
| `CLIContext`              | type     | Nie (API wewnetrzne)                                       | PASS                          |
| `UpdateInfo`              | type     | Nie (API wewnetrzne)                                       | PASS                          |
| `InitOptions`             | type     | Tak (sekcja Init Options)                                  | PASS                          |
| `CompileOptions`          | type     | Tak (sekcja Compile Options)                               | PASS                          |
| `ValidateOptions`         | type     | Tak (sekcja Validate Options)                              | PASS                          |
| `PullOptions`             | type     | Tak (sekcja Pull Updates Options)                          | PASS                          |
| `DiffOptions`             | type     | Tak (sekcja Show Diff Options)                             | PASS                          |
| `CheckOptions`            | type     | Nie (pusty interfejs)                                      | PASS                          |

### Komendy zarejestrowane w `cli.ts` ale NIE wyeksportowane w `index.ts`

| Komenda                  | Eksportowana | Uwagi                                                                                   |
| ------------------------ | ------------ | --------------------------------------------------------------------------------------- |
| `importCommand`          | NIE          | Zarejestrowana w cli.ts, wyeksportowana w commands/index.ts, ale nie w glownym index.ts |
| `serveCommand`           | NIE          | Dynamiczny import w cli.ts, nie wyeksportowana                                          |
| `registry` (subcommands) | NIE          | Zarejestrowana via `registerRegistryCommands`, nie wyeksportowana                       |

### Typy zdefiniowane w `types.ts` ale NIE wyeksportowane w `index.ts`

| Typ                       | Eksportowany | Uwagi                                          |
| ------------------------- | ------------ | ---------------------------------------------- |
| `RegistryInitOptions`     | NIE          | Uzywany wewnetrznie przez registry subcommands |
| `RegistryValidateOptions` | NIE          | Uzywany wewnetrznie przez registry subcommands |
| `RegistryPublishOptions`  | NIE          | Uzywany wewnetrznie przez registry subcommands |

---

## 2. Funkcje - poprawnosc vs kontrakt

| Funkcja                                | Deklaracja typow                                                                  | Implementacja                         | Ocena |
| -------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------- | ----- |
| `run(args?: string[])`                 | `(args: string[]) => void`                                                        | Parsuje args przez commander          | PASS  |
| `initCommand(options)`                 | `(options: InitOptions, services?: CliServices) => Promise<void>`                 | Inicjalizuje projekt, tworzy pliki    | PASS  |
| `compileCommand(options)`              | `(options: CompileOptions, services?: CliServices) => Promise<void>`              | Kompiluje .prs do formatow docelowych | PASS  |
| `validateCommand(options)`             | `(options: ValidateOptions) => Promise<void>`                                     | Waliduje pliki .prs                   | PASS  |
| `pullCommand(options)`                 | `(options: PullOptions) => Promise<void>`                                         | Pobiera z rejestru                    | PASS  |
| `diffCommand(options)`                 | `(options: DiffOptions) => Promise<void>`                                         | Pokazuje diff                         | PASS  |
| `checkCommand(options)`                | `(options: CheckOptions) => Promise<void>`                                        | Sprawdza zdrowie projektu             | PASS  |
| `updateCheckCommand()`                 | `() => Promise<void>`                                                             | Sprawdza aktualizacje CLI             | PASS  |
| `loadConfig(customPath?)`              | `(customPath?: string) => Promise<PromptScriptConfig>`                            | Laduje i parsuje YAML config          | PASS  |
| `findConfigFile(customPath?)`          | `(customPath?: string) => string \| null`                                         | Szuka pliku konfiguracyjnego          | PASS  |
| `checkForUpdates(currentVersion)`      | `(currentVersion: string) => Promise<UpdateInfo \| null>`                         | Sprawdza cache, potem npm             | PASS  |
| `forceCheckForUpdates(currentVersion)` | `(currentVersion: string) => Promise<{info: UpdateInfo \| null; error: boolean}>` | Wymusza sprawdzenie npm               | PASS  |
| `fetchLatestVersion()`                 | `() => Promise<string \| null>`                                                   | Fetch z npm registry z timeoutem      | PASS  |
| `ConsoleOutput.*`                      | Metody obiektu                                                                    | Respektuje LogLevel, quiet mode       | PASS  |
| `createSpinner(text)`                  | `(text: string) => Ora`                                                           | Cichj spinner w quiet mode            | PASS  |
| `setContext/getContext`                | `(context: Partial<CLIContext>) => void` / `() => CLIContext`                     | Globalne ustawienia CLI               | PASS  |

Uwaga: `loadEffectiveConfig` jest zdefiniowana w `config/loader.ts` i wyeksportowana w `config/index.ts` (barrel export wewnetrzny), ale NIE w glownym `index.ts`. To jest poprawne - jest uzywana wewnetrznie.

---

## 3. Typy - kompletnosc i spojnosc

| Typ               | Kompletnosc                                                                                                       | Spojnosc z implementacja | Ocena |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------ | ----- |
| `InitOptions`     | Wszystkie pola odpowiadaja opcjom CLI (--name, --team, --inherit, --registry, --targets, -i, -y, -f, -m)          | PASS                     | PASS  |
| `CompileOptions`  | Wszystkie pola odpowiadaja opcjom CLI (--target, --format, -a, -w, -o, --dry-run, --registry, -c, --force, --cwd) | PASS                     | PASS  |
| `ValidateOptions` | Pola: strict, format                                                                                              | PASS                     | PASS  |
| `PullOptions`     | Pola: force, dryRun, branch, tag, commit, refresh                                                                 | PASS                     | PASS  |
| `DiffOptions`     | Pola: target, all, full, noPager, color                                                                           | PASS                     | PASS  |
| `CheckOptions`    | Pusty interfejs (eslint-disable)                                                                                  | PASS                     | PASS  |
| `CLIContext`      | logLevel, colors                                                                                                  | PASS                     | PASS  |
| `UpdateInfo`      | currentVersion, latestVersion, updateAvailable                                                                    | PASS                     | PASS  |
| `CliServices`     | fs, prompts, cwd - poprawna abstrakcja DI                                                                         | PASS                     | PASS  |

---

## 4. Testy - coverage i edge cases

| Modul                      | Plik testowy                                             | Happy path                                | Error path                                         | Ocena |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- | ----- |
| `run` (cli.ts)             | cli.spec.ts                                              | TAK (rejestracja komend, parsowanie)      | Brak dedykowanych                                  | WARN  |
| `initCommand`              | init-command.spec.ts, commands/**tests**/init.spec.ts    | TAK                                       | TAK (already initialized, Ctrl+C)                  | PASS  |
| `compileCommand`           | compile-utils.spec.ts, compile-overwrite.spec.ts         | TAK                                       | TAK (overwrite protection, non-TTY, errors)        | PASS  |
| `validateCommand`          | (brak dedykowanego pliku)                                | Posrednio przez cli.spec.ts               | Posrednio                                          | WARN  |
| `pullCommand`              | (brak dedykowanego pliku)                                | Tylko rejestracja w cli.spec.ts           | Brak                                               | WARN  |
| `diffCommand`              | (brak dedykowanego pliku)                                | Tylko rejestracja w cli.spec.ts           | Brak                                               | WARN  |
| `checkCommand`             | check-command.spec.ts                                    | TAK                                       | TAK                                                | PASS  |
| `updateCheckCommand`       | update-check-command.spec.ts, update-check-smoke.spec.ts | TAK                                       | TAK                                                | PASS  |
| `importCommand`            | import-command.spec.ts                                   | TAK                                       | TAK                                                | PASS  |
| `serveCommand`             | commands/**tests**/serve.spec.ts                         | TAK                                       | TAK                                                | PASS  |
| `loadConfig`               | config-loader.spec.ts                                    | TAK (valid YAML, env vars, interpolation) | TAK (missing file, invalid YAML, custom path)      | PASS  |
| `findConfigFile`           | config-loader.spec.ts                                    | TAK (various sources)                     | TAK (not found)                                    | PASS  |
| `loadEffectiveConfig`      | config-loader.spec.ts                                    | TAK (merge test)                          | Brak dedykowanego                                  | PASS  |
| `ConsoleOutput`            | console-output.spec.ts                                   | TAK (wszystkie metody)                    | TAK (quiet mode)                                   | PASS  |
| `version-check`            | version-check.spec.ts                                    | TAK (fetch, cache, compare)               | TAK (network, timeout, invalid JSON, cache errors) | PASS  |
| `preAction hook`           | cli-preaction.spec.ts                                    | TAK                                       | TAK                                                | PASS  |
| Typy                       | types.spec.ts                                            | TAK (ksztalt typow)                       | N/A                                                | PASS  |
| `suggestion-engine`        | suggestion-engine.spec.ts                                | TAK                                       | TAK                                                | PASS  |
| `project-detector`         | project-detector.spec.ts                                 | TAK                                       | TAK                                                | PASS  |
| `ai-tools-detector`        | ai-tools-detector.spec.ts                                | TAK                                       | TAK                                                | PASS  |
| `manifest-loader`          | manifest-loader.spec.ts                                  | TAK                                       | TAK                                                | PASS  |
| `registry-resolver`        | registry-resolver.spec.ts                                | TAK                                       | TAK                                                | PASS  |
| `prettier-loader`          | prettier-loader.spec.ts                                  | TAK                                       | TAK                                                | PASS  |
| `env-config`               | env-config.spec.ts                                       | TAK                                       | TAK                                                | PASS  |
| `user-config`              | user-config.spec.ts                                      | TAK                                       | TAK                                                | PASS  |
| `merge-config`             | merge-config.spec.ts                                     | TAK                                       | TAK                                                | PASS  |
| `registry init`            | registry-init.spec.ts                                    | TAK                                       | TAK                                                | PASS  |
| `registry validate`        | registry-validate.spec.ts                                | TAK                                       | TAK                                                | PASS  |
| `registry publish`         | registry-publish.spec.ts                                 | TAK                                       | TAK                                                | PASS  |
| `registry scaffolder`      | registry-scaffolder.spec.ts                              | TAK                                       | TAK                                                | PASS  |
| `registry validator`       | registry-validator.spec.ts                               | TAK                                       | TAK                                                | PASS  |
| `slugify`                  | utils/**tests**/slugify.spec.ts                          | TAK                                       | TAK                                                | PASS  |
| `resolve-target-directory` | utils/**tests**/resolve-target-directory.spec.ts         | TAK                                       | TAK                                                | PASS  |
| `migrate-skill-templates`  | migrate-skill-templates.spec.ts                          | TAK                                       | TAK                                                | PASS  |
| `bundle-smoke`             | bundle-smoke.spec.ts                                     | TAK                                       | N/A                                                | PASS  |
| `security-validation`      | security-validation.smoke.spec.ts                        | TAK                                       | N/A                                                | PASS  |

---

## 5. Dead code - nieuzywane eksporty/funkcje

Zgodnie z `automated-results.md`, nastepujace eksporty CLI sa UNUSED w monorepo:

- `run` - PASS (entry point CLI binary)
- `initCommand`, `compileCommand`, `validateCommand`, `pullCommand`, `diffCommand`, `checkCommand`, `updateCheckCommand` - PASS (uzywane przez CLI binary w cli.ts)
- `loadConfig`, `findConfigFile`, `CONFIG_FILES` - PASS (uzywane wewnetrznie i przez CLI binary)
- `ConsoleOutput`, `createSpinner`, `LogLevel`, `setContext`, `getContext`, `isVerbose`, `isQuiet` - PASS (uzywane wewnetrznie)
- `checkForUpdates`, `forceCheckForUpdates`, `fetchLatestVersion`, `getCacheDir`, `getCachePath`, `printUpdateNotification` - PASS (uzywane wewnetrznie)
- Typy (`InitOptions`, `CompileOptions`, etc.) - PASS (eksportowane dla zewnetrznych konsumentow)

**Wszystkie "unused" eksporty sa oczekiwane** - CLI jest pakietem koncowym (entry point), nie bibliotekg importowang przez inne pakiety monorepo.

### Wewnetrzne eksporty niewyeksportowane w `index.ts`

| Modul                | Eksport                                      | Status                                                                                  |
| -------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `commands/import.ts` | `importCommand`                              | Zarejestrowany w cli.ts, wyeksportowany w commands/index.ts, ale nie w glownym index.ts |
| `commands/serve.ts`  | `serveCommand`                               | Dynamiczny import w cli.ts, niewyeksportowany                                           |
| `config/loader.ts`   | `loadEffectiveConfig`                        | Wyeksportowany w config/index.ts, ale nie w glownym index.ts                            |
| `services.ts`        | `CliServices`, `createDefaultServices`, etc. | Uzywane wewnetrznie, nie wyeksportowane w index.ts                                      |

**Ocena: PASS** - te eksporty sa celowo wewnetrzne.

---

## 6. Dokumentacja - README vs rzeczywistosc

### Opisane komendy vs kod

| Komenda w README        | Istnieje w kodzie              | Ocena |
| ----------------------- | ------------------------------ | ----- |
| `prs init`              | TAK (commands/init.ts)         | PASS  |
| `prs compile`           | TAK (commands/compile.ts)      | PASS  |
| `prs compile -w`        | TAK (watch mode w compile.ts)  | PASS  |
| `prs compile --dry-run` | TAK (dryRun w CompileOptions)  | PASS  |
| `prs validate`          | TAK (commands/validate.ts)     | PASS  |
| `prs diff`              | TAK (commands/diff.ts)         | PASS  |
| `prs import`            | TAK (commands/import.ts)       | PASS  |
| `prs pull`              | TAK (commands/pull.ts)         | PASS  |
| `prs update-check`      | TAK (commands/update-check.ts) | PASS  |

### Komendy w kodzie NIE opisane w README

| Komenda                              | Uwagi                                                       | Ocena |
| ------------------------------------ | ----------------------------------------------------------- | ----- |
| `prs check`                          | Nie opisana w tabeli komend README, ale istnieje w check.ts | WARN  |
| `prs serve`                          | Nie opisana w README (komenda developerska do playground)   | WARN  |
| `prs registry init/validate/publish` | Nie opisana w README                                        | WARN  |

### Przyklady w README

| Przyklad                                                                                   | Poprawnosc skladniowa                       | Ocena |
| ------------------------------------------------------------------------------------------ | ------------------------------------------- | ----- |
| Quick Start (`prs init`, `prs compile`)                                                    | TAK                                         | PASS  |
| Import (`prs import CLAUDE.md`, `prs import .cursorrules --dry-run`, `prs init --migrate`) | TAK                                         | PASS  |
| Example .prs file                                                                          | TAK (poprawna skladnia PromptScript)        | PASS  |
| Init Options                                                                               | TAK (odpowiadaja commander config w cli.ts) | PASS  |
| Compile Options                                                                            | TAK (odpowiadaja commander config w cli.ts) | PASS  |
| Import Options                                                                             | TAK                                         | PASS  |
| Validate Options                                                                           | TAK                                         | PASS  |
| Pull Options                                                                               | TAK                                         | PASS  |
| Diff Options                                                                               | TAK                                         | PASS  |
| Update Check                                                                               | TAK                                         | PASS  |
| Configuration YAML                                                                         | TAK (poprawna skladnia YAML)                | PASS  |
| Docker examples                                                                            | TAK (poprawna skladnia bash)                | PASS  |
| Environment variables                                                                      | TAK (odpowiadaja kodowi)                    | PASS  |

### Opcje komend: README vs cli.ts

| Komenda    | Opcje w README                                                         | Opcje w cli.ts            | Roznice                                      | Ocena |
| ---------- | ---------------------------------------------------------------------- | ------------------------- | -------------------------------------------- | ----- |
| `init`     | -n, -t, --inherit, --registry, --targets, -i, -y, -f                   | + `-m, --migrate`         | --migrate jest w README (sekcja Quick Start) | PASS  |
| `compile`  | -t, -f, -a, -w, -o, --dry-run, --force, --registry, --verbose, --debug | + `-c, --config`, `--cwd` | --config i --cwd brak w README               | WARN  |
| `validate` | --strict, --format                                                     | Zgodne                    | -                                            | PASS  |
| `pull`     | -f, --dry-run, -b, --tag, --commit, --refresh                          | Zgodne                    | -                                            | PASS  |
| `diff`     | -t, -a, --full, --no-pager, --color, --no-color                        | Zgodne                    | -                                            | PASS  |
| `import`   | -f, -o, --dry-run, --validate                                          | Zgodne                    | -                                            | PASS  |

---

## 7. Findings (lista problemow z priorytetem P0-P3)

### P2 - Brak dedykowanych testow jednostkowych

**F1: `pullCommand` nie ma dedykowanych testow** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/src/commands/pull.ts`
- Opis: `pullCommand` jest testowana tylko posrednio (rejestracja w cli.spec.ts). Brak testow happy path (poprawne pull) i error path (GitAuthError, GitRefNotFoundError, GitCloneError, brak inherit, dry-run).
- Zalecenie: Dodac `pull-command.spec.ts` z testami dla kazdego scenariusza error handling.

**F2: `diffCommand` nie ma dedykowanych testow** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/src/commands/diff.ts`
- Opis: `diffCommand` jest testowana tylko posrednio. Brak testow happy path (nowe pliki, zmienione pliki, brak zmian) i error path (brak entry file, blad kompilacji).
- Zalecenie: Dodac `diff-command.spec.ts`.

**F3: `validateCommand` nie ma dedykowanych testow** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/src/commands/validate.ts`
- Opis: `validateCommand` jest testowana tylko posrednio. Brak testow dla formatowania JSON, strict mode, entry file not found.
- Zalecenie: Dodac `validate-command.spec.ts`.

### P3 - Dokumentacja niekompletna

**F4: Komenda `prs check` nie jest opisana w tabeli komend README** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/README.md`
- Opis: Tabela "Commands" w README nie zawiera `prs check`, mimo ze komenda istnieje i jest wyeksportowana.
- Zalecenie: Dodac `prs check` do tabeli komend.

**F5: Komendy `prs serve` i `prs registry` nie sa opisane w README** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/README.md`
- Opis: `serve` (komenda developerska) i `registry` (subkomendy: init, validate, publish) nie sa opisane.
- Zalecenie: Dodac sekcje o registry subcommands. Serve moze byc pominiete jako wewnetrzne narzedzie.

**F6: Opcje `--config` i `--cwd` komendy `compile` nie sa opisane w README** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/README.md`
- Opis: Sekcja "Compile Options" w README nie dokumentuje `-c, --config <path>` ani `--cwd <dir>`.
- Zalecenie: Dodac brakujace opcje do dokumentacji.

**F7: `importCommand` i `ImportCommandOptions` nie sa wyeksportowane w `index.ts`** (WARN)

- Plik: `/Users/wogu/Work/Projects/promptscript/packages/cli/src/index.ts`
- Opis: Komenda `import` jest zarejestrowana w cli.ts i wyeksportowana w commands/index.ts, ale brak eksportu w glownym index.ts. Nie stanowi to problemu funkcjonalnego (CLI dziala), ale jest niespojne z innymi komendami.
- Zalecenie: Dodac eksport `importCommand` i typ `ImportCommandOptions` do index.ts lub uzasadnic roznice.

### Brak finding P0 i P1

- Wszystkie 586 testow PASS (0 failing) - brak eskalacji P1
- Typecheck: 0 bledow
- Lint: 0 warnings, 0 errors
- Walidacja .prs: PASS
- Schema check: PASS
