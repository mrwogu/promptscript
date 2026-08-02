# Issue #343 - per-target commands and scripts

Issue: https://github.com/mrwogu/promptscript/issues/343

## Cel

Pozwolić target override wybrać własny `command` albo `script`, bez kopiowania całego hooka i bez utraty portable defaults.

```promptscript
@hooks {
  validate: {
    event: "post-tool-use"
    script: {
      path: ".promptscript/scripts/validate.py"
      interpreter: "python3"
    }
    targets: {
      factory: {
        command: ["node", ".promptscript/scripts/factory.mjs"]
      }
      vscode: {
        script: {
          path: ".promptscript/scripts/vscode.py"
          interpreter: "python3"
        }
      }
    }
  }
}
```

## Stan obecny

- `HookDefinition` i `HookTargetOverride` są w `packages/formatters/src/hook-adapters.ts:32`.
- `extractHooks` nie odczytuje `command` ani `script` w target override.
- `applyHookTargetOverrides` robi płaski spread, więc resource override wymaga rozszerzenia typów i walidacji.
- `valid-hooks.ts:240` ma osobną listę target fields.
- Wszystkie target serializers korzystają z effective hook, więc zmiana może być centralna.

## Decyzje

- Target override może mieć najwyżej jedno z `command` i `script`.
- Gdy nie ma żadnego, dziedziczy portable resource.
- Target override nie może usunąć resource przez `null`, pusty command ani pusty script.
- `command` zachowuje `string[]` i argument boundaries. Nigdy nie jest parsowany jako shell string.
- `script` przechodzi ten sam safe path/interpreter contract co portable script.
- Walidacja target script ma dwa etapy: AST/schema validation oraz filesystem containment validation po wybraniu effective resource.
- Existing `matcher` remains optional target-native matcher override, także dla #345.
- Disabled override (`enabled: false`) suppresses target output, jak obecnie.

## Plan implementacji

1. **Core hook model**
   - Przenieść portable hook IR z `packages/formatters/src/hook-adapters.ts` do browser-safe modułu w core.
   - Rozdzielić raw i validated IR: `RawHookDefinition`/`RawHookTargetOverride` zachowują unknown i malformed `ValueNode`; `HookDefinition`/`HookTargetOverride`/`HookResource` zawierają wyłącznie zwalidowane dane.
   - Dodać pure conversion `validateHookDefinition(raw): HookValidationResult`, zwracające validated hook albo diagnostics bez silent filtering.
   - Formatters re-exportują deprecated type aliases przez jedną wersję, aby nie łamać publicznych importów.
   - Rozszerzyć core `HookTargetOverride` o `command?: string[]` i `script?: HookScriptDefinition`.
   - Wydzielić pure `validateHookResource` w core, aby validator, compiler, browser compiler i target override używały jednej lexical/schema logiki bez dependency na formatters.
   - `applyHookTargetOverrides` wykonać explicit merge: scalar fields override, resource wybierany atomowo. Zwrócić także origin metadata `portable | target:<name>` i source location effective resource.
   - Nie mutować source hook ani nested targets.

2. **Parser/extractor**
   - Przenieść extractor do core hook IR. Formatters używają tego samego exported API.
   - `extractRawHooks` zachowuje target command arrays, script objects, unknown target entries i malformed resource candidates wraz z `ValueNode.loc`.
   - Validator wywołuje `validateHookDefinition`; compiler filesystem validator i formatters dostają tylko `HookDefinition[]`.
   - Effective hook zawiera wyłącznie validated resource; serializer nie filtruje malformed values jako normalnego flow.

3. **AST i semantic validator**
   - Dodać fields do `TARGET_OVERRIDE_FIELDS`.
   - Reject both fields, missing/empty command, non-string args, shell interpolation, unsafe script path, unsupported interpreter i malformed script args.
   - Dla override script komunikat ma zawierać target i hook ID.
   - Reuse exact portable lexical path policy: `.promptscript/scripts/`, no absolute/traversal/backslash.
   - Czytać location z canonical `ObjectFieldNode`/`ValueNode` z #330. Diagnostic wskazuje location pola `targets.<target>.command` albo `targets.<target>.script`, nie tylko location całego `@hooks`.

4. **Compiler filesystem validator**
   - Rozszerzyć `packages/compiler/src/hook-script-validator.ts`, aby iterował portable script oraz każdy enabled target override script, nie tylko `hook.script`.
   - Dla każdego kandydata wykonać `lstat`, `realpath`, file-type check i containment pod real `.promptscript/scripts/`.
   - Symlink escape, missing file i non-file raportują hook ID, target/origin, path i source location.
   - Jeden invalid target override zatrzymuje cały compile przed formatter output. Pozostałe poprawne targety nie maskują błędu.

5. **Browser filesystem validator**
   - Rozszerzyć `packages/browser-compiler/src/hook-script-validator.ts` o ten sam iteration/effective-resource contract.
   - Rozszerzyć `VirtualFileSystem` o typed entries `file | directory | symlink`, `lstat`, `realpath` i deterministic symlink resolution z cycle detection. Existing `Map<string, string>` constructor nadal tworzy regular file entries dla compatibility.
   - Rozszerzyć publiczny `BrowserCompileInput`/`compile()` o `Record<string, string | VirtualFileEntry> | Map<string, string | VirtualFileEntry>` oraz convenience builders `file()`, `directory()`, `symlink()`. Existing `Record<string, string>` i `Map<string, string>` pozostają source-compatible.
   - Dodać named exports `VirtualFileEntry`, `VirtualFileKind`, `file`, `directory` i `symlink` z `@promptscript/browser-compiler` package entrypoint. Bez deep importów.
   - Zachować `toMap(): Map<string, string>` i `toObject(): Record<string, string>` jako deprecated regular-file-only projections. Jeśli VFS zawiera directory lub symlink, te metody rzucają actionable error zamiast gubić typ wpisu.
   - Dodać lossless `toEntryMap()` i `toEntryObject()` dla typed entries. `clone()` i `merge()` zawsze zachowują entry kind, symlink target i file content; merge używa obecnej other-wins path precedence.
   - Normalizować VFS path i wymagać containment pod project `.promptscript/scripts/` dla portable oraz target scripts.
   - Browser validator odrzuca symlink escape, dangling link, cycle, directory i unknown entry type. Adapter bez typed metadata może dostarczyć tylko regular files; nie może oznaczyć opaque entry jako bezpiecznej.
   - Parity tests porównują hook ID, target, error code i exact source location między Node i browser dla regular file, missing file, directory, symlink escape, dangling symlink i cycle.

6. **Serializers**
   - Przepiąć wszystkie `generate*Hooks` na effective resource.
   - Sprawdzić Factory, GitHub, VS Code, Claude, Cursor, Codex, Gemini, Windsurf i Grok.
   - Dla targetów z osobnym Unix/Windows commandem utrzymać oba warianty.
   - Ownership marker nadal jest final tokenem dla generated command.
   - Native serializers nie mogą flattenować command arrays w sposób zmieniający quoting.
   - Command override z `cwd` używa root strategy i fail-closed guards z #346. Serializer nie może ominąć guard tylko dlatego, że resource nie jest script.

7. **Docs**
   - Dodać per-target override examples do `docs/reference/language.md` i automation guide.
   - Zdefiniować inheritance order: target override resource > portable resource; other portable properties unchanged.
   - Opisać, że override `enabled: false` emituje zero entry.

## Testy i weryfikacja

- AST validator: exactly-one, empty command, shell interpolation, invalid path/interpreter, valid fallback i precise target field location.
- Node filesystem validator: valid target script, missing file, directory, traversal i symlink escape dla portable oraz każdego override.
- Browser validator: target script VFS containment, regular file, missing path, directory, symlink escape, dangling symlink, cycle i Node parity.
- Browser convenience API: typed VFS entries przechodzą przez publiczne `compile()`, nie tylko internal validator.
- Browser input compatibility: typed Record i Map działają identycznie; istniejące string-only Record/Map zachowują wynik.
- Browser package API: consumer fixture importuje wszystkie typed VFS types/builders z package root, kompiluje TypeScript i wykonuje Record oraz Map input przez publiczne `compile()`.
- VFS compatibility: legacy exports działają dla regular files i failują jawnie dla typed-only entries; lossless exports, clone i merge zachowują wszystkie entry metadata.
- Public API: stare imports typów hooków z formatters nadal działają przez deprecated re-exports.
- Raw/validated boundary: malformed resource pozostaje w raw IR z location, nie dociera do filesystem validatora ani serializerów.
- Extractor: command/script inheritance and target override parsing.
- Adapter unit tests for every target family.
- Factory/GitHub/VS Code snapshots with spaces and special characters in args/path.
- Unix/PowerShell command generation and ownership marker.
- Integration compile with target overrides plus repeated compile/cleanup fixture from #347.

## Kryterium gotowości

- One hook source can select different safe resources per target.
- Missing override resource falls back predictably.
- Invalid override fails validation before output generation.
- Portable i target scripts przechodzą ten sam two-stage safety contract w Node i browser compilerze.
- No target serializer duplicates override merge logic.
