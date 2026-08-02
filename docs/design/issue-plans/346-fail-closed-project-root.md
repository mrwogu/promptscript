# Issue #346 - fail closed when project root is unavailable

Issue: https://github.com/mrwogu/promptscript/issues/346

## Cel

Generated portable script and command wrappers must stop before resource execution when required project root cannot be resolved. Never silently run from agent session CWD.

## Stan obecny

- `projectRootExpression` in `packages/formatters/src/hook-adapters.ts:112` emits target environment variables.
- `projectCwdPrefix` prepends `cd` but does not guard empty variables.
- POSIX `serializeGitRootScriptCommand` używa assignment z `&&`, więc zatrzymuje non-zero `git rev-parse`, ale nie odrzuca blank output.
- `serializePowerShellScriptCommand` assigns Git root without validating result.
- Command resource bez script omija Git-root resolution nawet wtedy, gdy ma `cwd`.
- Native-CWD i workspace-CWD serializers intentionally rely on host-provided CWD.
- Existing smoke tests cover nested dirs and warnings, but not all empty-root/error paths.

## Decyzje

- Environment-root targets fail if variable is unset or empty.
- Git-root targets fail if `git rev-parse --show-toplevel` returns non-zero or blank.
- Native-CWD targets retain native `cwd`; they do not claim project-root guarantee and continue to emit `PS4002` when applicable.
- Workspace-CWD jest osobną strategią. VS Code zachowuje host workspace cwd i osobny warning contract, nie jest klasyfikowany jako native-CWD.
- Script zawsze wymaga root dla repository-local path w environment-root i Git-root targetach. Command wymaga root guard, gdy używa `cwd: "project"` lub project-relative `cwd`.
- Error goes to stderr, names target and missing root strategy, and exits non-zero before interpreter/command.
- Guard must precede `cd`, interpreter, command and ownership marker. Marker remains final token of successful generated command.
- Do not use shell fallback such as `pwd`, `$PWD` or current session directory.

## Target strategies

| Strategy      | Targets                       | Guard                                              |
| ------------- | ----------------------------- | -------------------------------------------------- |
| env root      | Claude, Factory, Gemini, Grok | non-empty variable check                           |
| Git root      | Cursor, Codex                 | checked `git rev-parse --show-toplevel`            |
| native CWD    | GitHub, Windsurf              | preserve native CWD, warning for no guarantee      |
| workspace CWD | VS Code                       | preserve workspace CWD, workspace-specific warning |

Actual target list must come from `HOOK_RUNTIME_CAPABILITIES`; table is a design contract, not a second registry.

## Plan implementacji

1. **Central guard functions**
   - Add `serializeRequiredEnvRootGuard(target, variable)` returning POSIX-safe prefix.
   - Add checked Git-root prefix with temporary variable and explicit status/blank check.
   - Add PowerShell equivalents using `$env:VAR`, `$LASTEXITCODE` and `[string]::IsNullOrWhiteSpace`.
   - Escape target/variable names as fixed constants, not user input.
   - Guard helper przyjmuje `HookProjectRootStrategy` i obsługuje exhaustively `environment`, `git-root`, `native-cwd`, `workspace-cwd` i `none`. Dodanie nowej strategy powoduje TypeScript exhaustive failure.

2. **Integrate serializers**
   - Apply env guard do każdego script oraz command z project-relative `cwd`.
   - Apply Git guard do Cursor/Codex script oraz command z project-relative `cwd`.
   - Command bez script i bez `cwd` nie wymaga sztucznego root lookup. Zachowuje obecne native command behavior.
   - Per-target command/script overrides z #343 przechodzą przez ten sam effective-resource guard path.
   - Ensure cwd path with spaces still uses existing quoting after root resolution.
   - Preserve `getScriptPathFromNativeCwd` behavior for native-CWD targets.
   - Preserve VS Code workspace-CWD behavior osobno od native-CWD. Nie mapować `workspace-cwd` na `native-cwd` bez jawnej branch i diagnostic.
   - Keep ownership marker final after guard and command.

3. **Diagnostics**
   - Update capability warning text osobno dla native-CWD i workspace-CWD limitations.
   - Compile-time validation still checks source `cwd`; runtime guard handles unavailable host root.
   - Error wording identifies target, strategy, and required env variable or Git worktree.
   - Cursor/Codex command z `cwd` nie może już kończyć tylko warningiem i wykonać się w session CWD. Ma dostać guarded wrapper albo compile error, jeśli target serializer nie potrafi go bezpiecznie opakować.

4. **Documentation**
   - Remove wording that implies fallback to session CWD.
   - Add generated POSIX/PowerShell examples and failure behavior.
   - Document that a hook may be skipped by the host if it does not provide project root; this differs from running in the wrong root.

## Testy i weryfikacja

- Exact script i command strings dla każdego env target z unset, empty i valid variable.
- Git-root script oraz command z `cwd`: success, non-zero exit i blank output.
- PowerShell script/command generation and error path.
- Paths with spaces and nested `cwd`.
- Assert interpreter i raw command są textually after guard.
- Execute wrappers z sentinel script/command i potwierdzić, że sentinel nie został wywołany przy missing root.
- Native-CWD targets retain behavior plus `PS4002`.
- VS Code retains workspace-CWD behavior i workspace-specific diagnostic.
- Command bez `cwd` zachowuje obecny output i nie dostaje zbędnego Git/env lookup.
- Execute generated wrappers in temporary Unix fixtures where shell exists; PowerShell tests remain platform-independent string/fixture tests when CI lacks `pwsh`.
- Cross-target smoke fixture from #347 asserts no wrong-directory execution.

## Kryterium gotowości

- Missing required root always causes non-zero exit before script lub command execution.
- No generated wrapper silently falls back to process CWD.
- Unix and PowerShell guards use identical fail-closed semantics.
- Native-CWD i workspace-CWD limitations są odrębne, explicit i tested.
