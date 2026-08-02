# Issue #345 - explicit terminal command lifecycle event

Issue: https://github.com/mrwogu/promptscript/issues/345

## Cel

Dodać portable `pre-terminal-command`, które opisuje intencję przechwycenia uruchomienia komendy terminala. Nie udawać uniwersalnego coverage tam, gdzie host nie ma równoważnego lifecycle event.

```promptscript
@hooks {
  validate-terminal: {
    event: "pre-terminal-command"
    script: {
      path: ".promptscript/scripts/check-terminal.py"
      interpreter: "python3"
    }
  }
}
```

## Decyzja coverage

| Target   | Native mapping                           | Status                |
| -------- | ---------------------------------------- | --------------------- |
| Factory  | `PreToolUse`, default matcher `Execute`  | guaranteed            |
| Claude   | `PreToolUse`, default matcher `Bash`     | guaranteed            |
| Codex    | `PreToolUse`, default matcher `Bash`     | guaranteed            |
| Windsurf | `pre_run_command`                        | guaranteed            |
| VS Code  | `PreToolUse`/`run_in_terminal` matcher   | best effort           |
| GitHub   | no cross-host equivalent                 | unsupported, `PS4002` |
| Cursor   | `preToolUse`/`run_terminal_cmd` matcher  | best effort           |
| Gemini   | `BeforeTool`/`run_shell_command` matcher | best effort           |
| Grok     | no proven terminal contract              | unsupported, `PS4002` |

Matrix wynika z obecnego `HOOK_RUNTIME_CAPABILITIES`: Cursor i Gemini już mają best-effort terminal metadata, a GitHub ma `not-guaranteed`. Implementacja rozszerza ten istniejący contract zamiast wprowadzać drugi registry. Unsupported rows nie emitują misleading hook entry.

## Stan obecny

- Portable events i target maps są w `hook-adapters.ts`.
- Validator `VALID_HOOK_EVENTS` nie zawiera eventu.
- Windsurf ma event fan-out, pozostałe targety mają mapy scalar.
- `getHookCompatibilityWarnings` już raportuje unsupported events i matcher limitations.
- `HookTargetOverride.matcher` istnieje i wystarcza jako optional native tool-name override.
- `HookTerminalCapability` już przechowuje `guarantee`, `toolNames` i notes dla GitHub, Claude, Cursor, Factory, Gemini, Windsurf, Codex i VS Code.

## Plan implementacji

1. **Core contract**
   - Wyeksportować `PORTABLE_HOOK_EVENTS` i derived `PortableHookEvent` z core. Usunąć ręczne `PortableHookEvent` z formatters i `VALID_HOOK_EVENTS` z validatora; obie warstwy importują core registry.
   - Dodać `pre-terminal-command` wyłącznie do core `PORTABLE_HOOK_EVENTS`; validator i syntax docs korzystają z derived registry.
   - Rozszerzyć istniejący `HookTerminalCapability` o `preEvent`, `defaultMatcher` i `emission: 'emit' | 'omit'`.
   - Rozszerzyć capability o `matcherEnforcement: 'native' | 'payload-filter' | 'none'`.
   - Dodać `emissionContexts: readonly HookEmissionContext[]`, gdzie context wskazuje formatter, output versions i optional `requiresTargetOverride`. VS Code deklaruje emitter `github`, versions `multifile/full` i wymaga `targets.vscode`; nie udaje osobnego formattera ani nie używa fikcyjnej wersji `workspace`.
   - Zachować istniejące `guarantee` i `toolNames` jako public capability metadata. `defaultMatcher` musi należeć do `toolNames`, jeśli target używa native matchera albo payload filter.
   - Brak terminal capability albo `emission: 'omit'` oznacza unsupported. `not-guaranteed` GitHub mapuje do omit, nie do pozornego best-effort output.
   - `PORTABLE_HOOK_EVENTS` i `HOOK_RUNTIME_CAPABILITIES` pozostają jedynymi źródłami portable event names, native terminal event, default matcher, matcher enforcement, emission i guarantee.
   - Existing `nativeVersions` staje się generated compatibility projection z `emissionContexts` dla targetów emitowanych przez własny formatter. Tests i #347 używają `emissionContexts`.
   - Nie dodawać drugiego pola typu `nativeToolName`; istniejące `matcher` w `targets.<target>` jest target-specific override.
   - Dla `pre-terminal-command` matcher grammar to exact, case-sensitive native tool name, nie regex ani alternation. Override musi być non-empty i należeć do capability `toolNames`; inne events zachowują obecny matcher contract.

2. **Mapping layer**
   - Dla zwykłych events zachować obecne mapping behavior. Dla `pre-terminal-command` `mapEvent` czyta wyłącznie `terminal.preEvent` z `HOOK_RUNTIME_CAPABILITIES`; nie dodawać tego eventu do target-specific map constants.
   - `getDefaultMatcher` czyta wyłącznie `terminal.defaultMatcher`.
   - Merge order: target override matcher > portable matcher > event default matcher. Target override jest najbardziej specific source.
   - Portable matcher użyty przez `pre-terminal-command` podlega exact tool-name validation osobno dla każdego targetu. Unknown native name emituje capability diagnostic i pomija entry zamiast rozszerzać coverage.
   - Jeśli użytkownik poda matcher w target override, nie dopisywać drugiego default matcher.
   - Windsurf mapuje event bez matcher; VS Code używa `matcherEnforcement: 'payload-filter'`, ponieważ host ignoruje matcher field.
   - Factory, Claude i Codex emitują guaranteed mapping. Cursor, Gemini i VS Code emitują mapping wraz z best-effort diagnostic. GitHub i Grok nie emitują entry.
   - Dla VS Code formatter emituje owned cross-platform Node helper `.promptscript/generated/vscode-hook-filter.mjs`. Hook entry przekazuje helperowi expected tool name, effective timeout w milliseconds i effective command array jako JSON arguments. Helper buforuje stdin, parsuje payload, sprawdza exact `tool_name`, uruchamia resource bez shell parsing i przekazuje oryginalny payload do child stdin. Non-match kończy się `0` bez uruchomienia user command/script.
   - Jeśli payload schema jest malformed albo nie można go odczytać, wrapper failuje closed z non-zero i diagnostic; nie uruchamia user resource.
   - Effective duration pochodzi z target override, portable `timeoutMs` albo documented VS Code default, w tej kolejności. Helper dostaje integer milliseconds; native VS Code hook dostaje `ceil(milliseconds / 1000)` seconds. Oba reprezentują tę samą duration, nie tę samą wartość liczbową.
   - Helper jest transparentnym process proxy: child stdout/stderr są dziedziczone, child exit code zostaje exit code helpera, spawn error daje non-zero diagnostic, a effective timeout obejmuje wrapper i child.
   - Helper forwarduje catchable termination signals do child process group i czeka na cleanup. Owned timeout kończy cały child tree, aby sentinel/resource nie został orphaned. Implementacja ma osobne Unix i Windows cleanup branches bez shell parsing.
   - Nie obiecywać cleanup po uncatchable hard kill, host crash ani machine loss. Docs opisują tę granicę; recovery takich procesów należy do hosta/OS.
   - Generated helper ma PromptScript marker, należy do managed outputs i podlega temu samemu ownership-safe cleanup co hook config.

3. **Capability diagnostics**
   - Rozdzielić `unsupported` od `best-effort` w warning code i message. Wybrać stabilny nowy rule ID po sprawdzeniu registry; nie przeciążać jednego komunikatu dwoma znaczeniami.
   - Warning ma podać host limitation i rzeczywistą alternatywę. Dla VS Code: generated payload filter albo `prs compile --watch`; nie polecać ignorowanego matcher field jako samodzielnego rozwiązania.
   - Generated docs nie mogą używać słów `guaranteed` dla best effort.
   - Capability docs, generated formatter docs, diagnostics i serializer emission są generowane lub testowane względem tego samego runtime registry.

4. **Serializers**
   - Zaktualizować Factory, Claude, Codex, Windsurf, Cursor, Gemini, VS Code i każdy target z `terminal.emission: 'emit'`.
   - Sprawdzić, że `matcher` trafia do właściwego native field przy `matcherEnforcement: 'native'`.
   - Przy `payload-filter` matcher steruje generated wrapperem, nie martwym native field. Native matcher można zachować tylko jako human-readable metadata z warningiem, nigdy jako enforcement.
   - Dla GitHub i Grok unsupported output pozostaje pusty, ale compile result zawiera diagnostic.

5. **Docs**
   - Dodać event do language reference i hook capability matrix.
   - Opisać różnicę między terminal command lifecycle a ogólnym `pre-tool-use`.
   - Pokazać target-specific override:

     ```promptscript
     targets: {
       vscode: { matcher: "run_in_terminal" }
     }
     ```

   - Wyjaśnić, że VS Code override konfiguruje generated payload filter, ponieważ host ignoruje native matcher.

## Testy i weryfikacja

- Validator accepts event and rejects typo.
- Mapping tests generowane dla każdego runtime capability row, bez ręcznej listy pomijającej target.
- Generated output tests dla Factory, Claude, Codex, Windsurf, Cursor, Gemini, GitHub, Grok i VS Code.
- Assertions for default matcher, override matcher, unsupported omission and best-effort warning.
- VS Code runtime tests: matching payload uruchamia sentinel raz; non-matching payload nie uruchamia; malformed payload failuje closed; Unix i Windows command variants zachowują ownership marker.
- VS Code proxy tests: child exit code, stdout, stderr i spawn error są propagowane; catchable SIGTERM i owned timeout usuwają child tree bez orphan process.
- VS Code timeout tests: override/portable/default precedence, helper milliseconds i native rounded-up seconds.
- Registry test: validator accepted events, formatter event type i capability docs są derived z core registries, bez równoległych list.
- Emission context test: VS Code wskazuje GitHub `multifile/full` plus required override; każdy inny native target wskazuje realny formatter/version.
- Assertion: target override matcher wygrywa z portable matcher, a portable matcher wygrywa z default.
- Matcher grammar: terminal exact names accepted; regex/alternation i unknown tool names odrzucone lub pominięte z capability diagnostic; non-terminal matcher behavior unchanged.
- Capability docs/generated formatter docs consistency.
- Cross-target fixture from #347 includes terminal hook and warning assertions.

## Kryterium gotowości

- Portable event maps deterministically.
- Runtime capability registry jest jedynym właścicielem terminal mapping i default matcher.
- Guaranteed/best-effort/unsupported status is visible in diagnostics and docs.
- Cursor i Gemini zachowują istniejący best-effort contract.
- No target claims coverage it cannot provide.
- Existing `pre-tool-use` behavior remains unchanged.
