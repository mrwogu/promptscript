# Audyt: @promptscript/resolver

Data: 2026-03-20
Glebokosc: SREDNIA (publiczne eksporty z index.ts)

## Ocena zbiorcza: PASS

Pakiet jest w bardzo dobrym stanie. Wszystkie testy przechodza (586/586 globalnie, 0 failing), typecheck strict mode bez bledow, lint czysty. Jedyny drobny problem to minimalna dokumentacja w README (swiadomie - pakiet oznaczony jako wewnetrzny).

---

## 1. Dokumentacja w README

**Ocena: WARN**

README (`packages/resolver/README.md`) zawiera jedynie 5 linii: nazwe pakietu, informacje o statusie "internal package" i licencje MIT. Nie opisuje zadnego publicznego API, nie zawiera przykladow uzycia ani listy eksportow.

Jest to swiadoma decyzja - pakiet jest oznaczony jako wewnetrzny ("Internal package - not published to npm separately"). Mimo to, przy ~50 publicznych eksportach (klasy, funkcje, typy, interfejsy), brak jakiejkolwiek dokumentacji API utrudnia orientacje nowym kontrybutorem.

**Eksporty publiczne nieudokumentowane w README:**

- `Resolver`, `createResolver`, `resolve` (standalone)
- `FileLoader`
- `FileSystemRegistry`, `HttpRegistry`, `CompositeRegistry`, `GitRegistry` + factory functions
- `resolveInheritance`, `normalizeBlockAliases`, `applyExtends`
- `resolveUses`, `isImportMarker`, `getImportAlias`, `getOriginalBlockName`
- `resolveNativeSkills`, `resolveNativeCommands`, `parseSkillMd`, `interpolateSkillContent`
- Git utilities: `isGitUrl`, `parseGitUrl`, `normalizeGitUrl`, `buildAuthenticatedUrl`, `getCacheKey`, `parseVersionedPath`, `isKnownGitHost`, `getWebUrl`
- Re-eksporty z core: `bindParams`, `interpolateText`, `interpolateContent`, `interpolateAST`, `isTemplateExpression`

## 2. Zgodnosc implementacji z deklaracjami typow

**Ocena: PASS**

- Typecheck (strict mode) przechodzi bez bledow dla wszystkich 11 pakietow, w tym resolver.
- Zweryfikowano recznie kluczowe eksporty:
  - `Resolver` klasa w `resolver.ts` - eksportuje `Resolver` i `createResolver`, zgodne z `index.ts`.
  - `resolve()` standalone w `index.ts` - sygnatury `ResolveOptions extends ResolverOptions` i `async function resolve(entryPath, options): Promise<ResolvedAST>` sa spojne.
  - `FileLoader` w `loader.ts` - eksportuje klase i interfejs `LoaderOptions`, zgodne.
  - `resolveNativeSkills`, `resolveNativeCommands`, `parseSkillMd`, `interpolateSkillContent` w `skills.ts` - sygnatury eksportow zgodne z deklaracjami w index.ts.
  - Registry klasy (`FileSystemRegistry`, `HttpRegistry`, `CompositeRegistry`, `GitRegistry`) - eksportowane wraz z interfejsami opcji i typami.
  - Git utilities w `git-url-utils.ts` - 8 nazwanych eksportow + 2 typy, zgodne z index.ts.
- Brak rozbieznosci miedzy deklaracjami typow a implementacja.

## 3. Pokrycie testami (happy path)

**Ocena: PASS**

Kazdy modul zrodlowy ma dedykowany plik testowy:

| Modul zrodlowy                  | Plik(i) testowe                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `resolver.ts`                   | `resolver.spec.ts`, `resolver-coverage.spec.ts`, `standalone.spec.ts`                                                          |
| `loader.ts`                     | `loader.spec.ts`                                                                                                               |
| `inheritance.ts`                | `inheritance.spec.ts`, `inheritance-coverage.spec.ts`                                                                          |
| `imports.ts`                    | `imports.spec.ts`                                                                                                              |
| `normalize.ts`                  | `normalize.spec.ts`                                                                                                            |
| `extensions.ts`                 | `extensions.spec.ts`, `extensions-coverage.spec.ts`                                                                            |
| `skills.ts`                     | `skills.spec.ts`, `skill-interpolation.spec.ts`, `skill-params.spec.ts`, `skill-contracts.spec.ts`, `shared-resources.spec.ts` |
| `registry.ts`                   | `registry.spec.ts`                                                                                                             |
| `git-registry.ts`               | `git-registry.spec.ts`, `git-registry.integration.spec.ts`                                                                     |
| `git-url-utils.ts`              | `git-url-utils.spec.ts`                                                                                                        |
| `git-cache-manager.ts`          | `git-cache-manager.spec.ts`                                                                                                    |
| `index.ts` (standalone resolve) | `standalone.spec.ts`                                                                                                           |

Lacznie 21 plikow testowych. Happy path jest pokryty dla wszystkich publicznych eksportow.

## 4. Import przez inne pakiety

**Ocena: PASS**

Pakiet jest importowany przez:

| Pakiet konsumujacy                         | Importowane symbole                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@promptscript/compiler`                   | `Resolver`, `ResolvedAST` (type), `ResolverOptions` (type)                                                                                       |
| `@promptscript/cli` (pull.ts)              | `createFileSystemRegistry`, `createHttpRegistry`, `createGitRegistry`, `GitCloneError`, `GitAuthError`, `GitRefNotFoundError`, `Registry` (type) |
| `@promptscript/cli` (registry-resolver.ts) | `createGitRegistry`, `GitCacheManager`, `normalizeGitUrl`, `getCacheKey`                                                                         |

Kluczowe eksporty (`Resolver`, factory functions, Git registry, error classes) sa aktywnie uzywane. Eksporty nieuzywane przez inne pakiety w monorepo (np. `createResolver`, `FileLoader`, `resolveInheritance`, `normalizeBlockAliases`, `applyExtends`) stanowia publiczne API dla zewnetrznych konsumentow lub sa uzywane wewnetrznie przez `Resolver` klase.

## 5. Czy README opisuje istniejace funkcje

**Ocena: WARN**

README nie opisuje zadnych funkcji - zawiera jedynie informacje o statusie pakietu. Wszystkie eksporty z index.ts sa nieudokumentowane na poziomie README. Kod zrodlowy zawiera natomiast dobre komentarze JSDoc przy eksportowanych funkcjach i klasach (np. `resolve()`, `Resolver`, `parseSkillMd`, `resolveNativeSkills`).

## 6. Poprawnosc przykladow

**Ocena: WARN**

README nie zawiera przykladow. Przyklady istnieja natomiast w kodzie zrodlowym jako komentarze JSDoc:

- `resolver.ts` linia 53-61: przyklad uzycia `Resolver` - poprawny, zgodny z API.
- `index.ts` linia 128-139: przyklad uzycia standalone `resolve()` - poprawny, zgodny z sygnatura.

## 7. Coverage gap: `packages/resolver/src/skills.ts`

**Ocena: WARN (niski priorytet)**

Dane z automated-results.md: 93% stmt, 95% fn, 1 nieprzykryta funkcja.

Plik `skills.ts` zawiera ~20 funkcji (w tym publiczne: `resolveNativeSkills`, `resolveNativeCommands`, `parseSkillMd`, `interpolateSkillContent`). Przy 95% fn coverage, 1 prywatna funkcja pomocnicza nie jest bezposrednio testowana. Prawdopodobne kandydatury to `fileExists()` (trywialna funkcja opakowujaca `fs.access`) lub jedna z mniejszych helperow.

Wszystkie 4 publiczne eksporty z tego pliku sa dobrze pokryte testami (5 dedykowanych plikow testowych). Gap dotyczy wewnetrznej implementacji i nie stanowi ryzyka dla API.

---

## Podsumowanie dead exports (z automated-results.md)

Nastepujace eksporty z index.ts nie sa importowane przez zaden inny pakiet w monorepo:

- `createResolver` - factory function, alternatywa do `new Resolver()`
- `FileLoader` - uzywany wewnetrznie przez Resolver, eksportowany dla zaawansowanych scenariuszy
- `resolveInheritance` - nisko-poziomowy helper, uzywany wewnetrznie
- `normalizeBlockAliases` - nisko-poziomowy helper, uzywany wewnetrznie
- `applyExtends` - nisko-poziomowy helper, uzywany wewnetrznie

Te eksporty sa czescia publicznego API i moga byc uzywane przez zewnetrznych konsumentow. Nie stanowia "martwego kodu" - to swiadoma decyzja architektoniczna.

## Eskalacje

Brak eskalacji. Wszystkie testy PASS (0 failing). Typecheck strict mode: 0 bledow (P0 clear). Lint: 0 errors/warnings.
