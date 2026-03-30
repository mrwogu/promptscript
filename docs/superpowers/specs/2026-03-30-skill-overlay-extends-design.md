# Skill Overlay / Extends — Design Spec

**Data:** 2026-03-30
**Status:** Draft
**Klient:** Comarch
**Wersja:** 1.3 (po enterprise review + uwagi autora architektury Comarch)

---

## 1. Problem

Comarch operuje 4-warstwową architekturę rejestrów PromptScript:

```
Layer 1: @comarch         - Standardy ogólnofirmowe (security, testing, java-review)
Layer 2: @clm5core/@clm59 - Skille produktowe (clm512-expert, clm-java-review)
Layer 3: @bu              - Referencje BU (architektura, moduły, wzorce per klient)
Layer 4: project          - .promptscript/ nadpisania lokalne
```

Layer 2 definiuje skille z generycznymi workflow'ami. Layer 3 ma pliki referencyjne wzbogacające te skille o dane konkretnego klienta. Brak mechanizmu kompozycji — BU references są niewidoczne dla skilli z niższego layera. BU musi dziś kopiować i modyfikować pliki Layer 2 zamiast je rozszerzać, co prowadzi do dryfu i podwójnej pracy.

---

## 2. Rozwiązanie

Rozszerzenie istniejącego `@use` + `@extend` o:
- Nową skill property `references` — lista plików dołączanych do kontekstu skilla
- Zdefiniowaną semantykę `@extend` per property type (replace / append / merge)

Kompozycja odbywa się w języku PRS — explicite, czytelnie, wersjonowalnie. Żadnej magii w YAML, żadnych nowych keywords.

### 2.1 Odrzucone podejście: manifest-based `extends`

Oryginalna propozycja Comarch (Option A) zakładała deklarację `extends` w `registry-manifest.yaml`:

```yaml
catalog:
  - id: 'skills/clm512-expert'
    extends: '@clm5core/skills/clm512-expert'   # odrzucone
```

**Odrzucono na rzecz PRS `@extend`** z następujących powodów:
- Manifest to metadane rejestru, nie kod — kompozycja powinna być w języku, bo to "prompt as code"
- PRS `@extend` już istnieje i jest przetestowany — nie potrzebujemy drugiego mechanizmu
- `@extend` w `.prs` jest wersjonowany, czytelny, testowalny przez `prs validate`
- Manifest-based extends duplikuje informację — ścieżka w manifeście + overlay w katalogu

**Nie potrzebujemy obu mechanizmów.** PRS `@extend` wystarczy.

---

## 3. Nowa property: `references`

### 3.1 Deklaracja w PRS

```prs
@skills {
  clm512-expert {
    description: "CLM 5.12+ development expert"
    references: [
      ./references/architecture.md
      ./references/modules.md
      ./references/patterns.md
    ]
  }
}
```

### 3.2 Deklaracja w SKILL.md frontmatter

```yaml
---
name: clm512-expert
description: CLM 5.12+ Expert
references:
  - references/architecture.md
  - references/modules.md
---
```

### 3.3 Semantyka

- Lista ścieżek do plików tekstowych (`.md`, `.json`, `.yaml`, `.txt`, `.csv`)
- Ścieżki rozwiązywane identycznie jak w `@use` — relative do pliku `.prs` / `SKILL.md`, registry aliasy, wersjonowanie
- Pliki ładowane jako raw content (nie parsowane jako PRS)
- Formatter emituje je w `references/` subdirectory obok `SKILL.md`
- Walidacja path traversal przez `isSafeRelativePath()` na każdej ścieżce
- Limity rozmiaru **per skill (base + wszystkie overlaye razem)**:
  - `MAX_RESOURCE_SIZE` (1MB/plik) — pojedynczy plik referencji
  - `MAX_TOTAL_RESOURCE_SIZE` (10MB total) — suma wszystkich referencji skilla ze wszystkich warstw
  - `MAX_RESOURCE_COUNT` (100 plików) — łączna liczba referencji skilla ze wszystkich warstw
  - Scope: budżet jest **per skill**, nie per warstwa — zapobiega sytuacji gdzie każda z 4 warstw dodaje po 10MB

---

## 4. Kompozycja przez `@use` + `@extend`

### 4.1 Dodawanie referencji

```prs
@use @clm5core/skills/clm512-expert as base

@extend base.skills.clm512-expert {
  description: "CLM 5.12+ Expert z kontekstem BU CRM Retail"
  references: [
    ./references/architecture.md
    ./references/modules.md
    ./references/patterns.md
    ./references/integrations.md
  ]
}
```

### 4.2 Override treści

```prs
@extend base.skills.clm512-expert {
  content: """
    Zmodyfikowany workflow uwzględniający specyfikę BU...
  """
}
```

### 4.3 Konsumpcja złożonego skilla

```prs
@use @bu/skills/clm512-expert
```

Projekt widzi jeden spójny skill z `@bu` — nie musi wiedzieć o layerach.

---

## 5. Semantyka `@extend` per property

| Property | Semantyka | Opis |
|---|---|---|
| `content` | replace | Nowy content całkowicie zastępuje bazowy |
| `description` | replace | |
| `trigger` | replace | |
| `userInvocable` | replace | |
| `allowedTools` | replace | |
| `disableModelInvocation` | replace | |
| `context` | replace | |
| `agent` | replace | |
| `params` | shallow merge | Nowe klucze dodawane, istniejące nadpisywane |
| `inputs` / `outputs` | shallow merge | |
| `references` | append | Nowe dołączane do istniejącej listy; kolizja nazw → wyższy wygrywa z warningiem |
| `examples` | append | |
| `requires` | append | |

**Reguła:** skalary się nadpisują, listy się dołączają, obiekty się mergują.

**Wiele `@extend` na ten sam skill:** aplikowane w kolejności deklaracji, kumulatywne. Kolejność jest **deterministyczna** — `@use` i `@extend` w pliku PRS mają kolejność top-to-bottom, a wieloplikowy projekt rozwiązuje importy depth-first z entry point zdefiniowanego w `promptscript.yaml`. Niedeterminizm może wystąpić tylko przy circular imports, co jest już wykrywanym błędem.

**Mieszane źródła (SKILL.md frontmatter + PRS `@extend`):** append semantyka, spójna niezależnie od źródła.

### 5.1 Priorytet rejestrów tego samego layera (diamond dependency)

Gdy dwa rejestry Layer 3 (np. `@bu-retail` i `@bu-travel`) oba rozszerzają ten sam skill z Layer 2, priorytet determinuje **kolejność deklaracji w `registries:` w `promptscript.yaml`**:

```yaml
registries:
  '@clm5core': ...      # Layer 2
  '@bu-retail': ...      # Layer 3 — priorytet niższy
  '@bu-travel': ...      # Layer 3 — priorytet wyższy (później w pliku)
```

Rejestr zadeklarowany **później** w `registries:` wygrywa przy kolizji. To jest deterministyczne i jawne — zmiana kolejności w YAML zmienia wynik kompilacji.

Kompilator loguje resolved priority na poziomie `--verbose`:

```
ℹ Registry priority (highest last): @clm5core, @bu-retail, @bu-travel
⚠ skill clm512-expert: references/architecture.md from @bu-travel overrides @bu-retail
```

---

## 6. Zmiany w pipeline'ie

### 6.1 Parser — zero zmian

`references: [...]` to już poprawna składnia parsowana jako array field w generic block content.

### 6.2 Core — nowa property w `SkillDefinition`

```typescript
// packages/core/src/types/ast.ts
export interface SkillDefinition {
  // ... istniejące properties ...

  /** Reference files merged into skill context */
  references?: string[];
}
```

### 6.3 Resolver (`packages/resolver/src/skills.ts`)

1. Dodanie `'references'` do `SKILL_RESERVED_KEYS`
2. Po rozwiązaniu skill content — sprawdź property `references`
3. Dla każdej ścieżki:
   - Walidacja path traversal przez `isSafeRelativePath()`
   - Rozwiązanie ścieżki (relative, registry alias, absolute)
   - Załadowanie zawartości pliku
   - Sprawdzenie limitów rozmiaru (`MAX_RESOURCE_SIZE`, `MAX_TOTAL_RESOURCE_SIZE`, `MAX_RESOURCE_COUNT`)
4. Zapisanie jako `SkillResource[]` z kategorią `reference`
5. Obsługa `references` w `parseFrontmatterFields()` z SKILL.md YAML

### 6.4 Extend: dwa osobne etapy w resolverze

**To jest główne wyzwanie implementacyjne.** Istniejący `applyExtends()` operuje na blokach PRS (AST nodes). Ale `references` to lista plików na dysku — merge dwóch list ścieżek plikowych to inna operacja niż merge dwóch bloków konfiguracji. Dlatego extend na skillach to **dwa etapy, nie jedno wywołanie `mergeValue()`**:

#### Etap A: Merge properties skilla w AST (`packages/resolver/src/extensions.ts`)

Operuje na AST — merguje properties skilla w pamięci:

1. Detekcja: jeśli `targetPath` wskazuje na property wewnątrz bloku `@skills`, aktywuj skill-aware semantykę
2. Zastosuj tabelę z sekcji 5: `content` → replace, `references` → concat list stringów, `params` → shallow merge, itd.
3. Wynik: AST node skilla z zaktualizowanymi properties (w tym `references: string[]` — nadal lista ścieżek, nie zawartości plików)

To jest czysto AST-owa operacja. Nie ładuje żadnych plików.

#### Etap B: Discovery i agregacja plików referencyjnych (`packages/resolver/src/skills.ts`)

Operuje na systemie plików — ładuje i waliduje referencje:

1. Po zakończeniu wszystkich `@extend` (etap A), weź finalną listę `references` ze skilla
2. Dla każdej ścieżki: rozwiąż (relative/registry/absolute), waliduj path traversal, załaduj content
3. Sprawdź limity rozmiaru
4. Sprawdź content safety (brak dyrektyw PRS — patrz sekcja 6.8)
5. Zapisz jako `SkillResource[]` z kategorią `reference`

**Kolejność w pipeline resolverze:**

```
resolveUses()          → import bloków
applyExtends()         → Etap A: merge properties w AST
resolveNativeSkills()  → Etap B: load + validate reference files
```

Etap B musi nastąpić **po** etapie A, bo dopiero po wszystkich extend'ach znamy finalną listę referencji.

### 6.5 Formatters (`packages/formatters/src/formatters/`)

Po wygenerowaniu SKILL.md, emituj pliki referencyjne jako `additionalFiles`:

```
.claude/skills/clm512-expert/
  SKILL.md
  references/
    architecture.md
    modules.md
    patterns.md
    integrations.md
```

Istniejący mechanizm `additionalFiles` w `FormatterOutput` już to obsługuje.

**Provenance — obowiązkowe w MVP:**

Każdy emitowany plik referencyjny zawiera komentarz provenance na początku:

```markdown
<!-- from: @bu/skills/clm512-expert/references/architecture.md -->
```

Dla inline mode (single-file formattery), provenance jest częścią headera:

```markdown
### architecture.md (from @bu/skills/clm512-expert)
```

Koszt implementacji: minimalny (string prefix przy emisji). Wartość diagnostyczna: krytyczna — bez tego pierwszy bug report to "skąd AI wziął te instrukcje?" i ręczne grzebanie w 4 rejestrach.

**Zachowanie `references` per typ formattera:**

| Kategoria | Formattery | Zachowanie |
|---|---|---|
| Multi-file z katalogami skill | Claude, Factory | Emit do `references/` subdirectory obok SKILL.md |
| Multi-file bez katalogów skill | GitHub (multifile) | Emit do `references/` obok instruction files |
| Single-file | Cursor (`.cursorrules`), Antigravity | Inline na końcu głównego pliku z headerem `## References` i sub-headerem per plik (`### architecture.md (from @bu)`) |
| Brak wsparcia | Custom formattery | Warning: "References for skill X not emitted, formatter Y does not support references" |

Każdy formatter musi zadeklarować `supportsReferences(): boolean` i `referencesMode(): 'directory' | 'inline' | 'none'`. To jest **blocker na MVP** — bez tego część zespołów nie widzi BU-specific data.

### 6.6 Validator — nowa reguła `PS025: valid-skill-references`

- Ścieżka nie istnieje → error
- Plik nie jest tekstowy → error
- Duplikaty w liście → warning
- Pusty plik → warning
- Plik > `MAX_RESOURCE_SIZE` → error
- W trybie `--strict`: wszystkie warningi traktowane jako errory

### 6.8 Content safety — walidacja dyrektyw PRS w referencjach

Pliki referencyjne to **dane, nie instrukcje**. Złośliwy aktor z write access do BU registry może wstawić dyrektywy PromptScript do pliku `.md`, np. `@identity`, `@standards`, `@restrictions`, co AI może zinterpretować jako instrukcje nadrzędne.

`prs validate --strict` sprawdza pliki referencyjne pod kątem obecności dyrektyw PRS:

**Skanowane wzorce:**
- Linie zaczynające się od `@meta`, `@identity`, `@standards`, `@restrictions`, `@guards`, `@skills`, `@commands`, `@agents`
- Bloki triple-quote `"""`
- Dyrektywy `@use`, `@inherit`, `@extend`

**Zachowanie:**
- Tryb normalny: warning — "Reference file references/architecture.md contains PRS directive '@identity' — references should contain data, not instructions"
- Tryb `--strict`: error — blokuje kompilację

**Implementacja:** Nowa reguła `PS026: safe-reference-content` w `packages/validator/src/rules/`. Skan jest lekki — regex na liniach, nie pełne parsowanie PRS.

### 6.7 Lockfile (`packages/cli/src/commands/lock-scanner.ts`)

`prs lock` musi odkrywać ścieżki `references` jako zależności do zablokowania. Lock scanner musi:
- Parsować property `references` z bloków `@skills`
- Parsować `references` z SKILL.md frontmatter
- Dodawać odkryte pliki do grafu zależności

---

## 7. Error handling

### 7.1 Błędy

| Sytuacja | Zachowanie |
|---|---|
| Ścieżka w `references` nie istnieje | `ResolveError` — "Reference file not found: ./references/arch.md in skill clm512-expert" |
| Plik referencji nie jest czytelny | `ResolveError` — "Cannot read reference file" |
| Path traversal wykryty | `ResolveError` — "Unsafe path in references: ../../.env — path traversal not allowed" |
| Plik przekracza `MAX_RESOURCE_SIZE` | `ResolveError` — "Reference file exceeds 1MB limit" |
| Suma plików przekracza `MAX_TOTAL_RESOURCE_SIZE` | `ResolveError` — "Total reference size exceeds 10MB limit" |
| `@extend` na skill który nie istnieje w base | Istniejący błąd — "Cannot extend undefined skill" |

### 7.2 Warningi

| Sytuacja | Zachowanie |
|---|---|
| `@extend` dodaje referencję o tej samej nazwie co bazowa | "Reference architecture.md in skill clm512-expert overridden by @extend" |
| Plik referencji jest pusty | "Empty reference file: ./references/modules.md" |
| Formatter nie obsługuje katalogów skill | "References for skill X not emitted, formatter Y does not support skill directories" |
| Duplikat w liście referencji | "Duplicate reference: ./references/arch.md in skill clm512-expert" |

### 7.3 Edge cases

- **Circular references** — niemożliwe, referencje to raw pliki tekstowe, nie parsowane jako PRS
- **Diamond dependency** — dwa rejestry tego samego layera (np. `@bu-retail` i `@bu-travel`) rozszerzają ten sam skill → priorytet wg kolejności deklaracji w `registries:` (patrz sekcja 5.1); deduplikacja po filename, wyższy priorytet wygrywa z warningiem
- **Brak SKILL.md w base** — `@extend` na skill bez content → valid, tworzy skill wyłącznie z referencji (np. skill czysto referencyjny)
- **Layer 2 zmienia strukturę SKILL.md** — Layer 2 (`@clm5core`) nie ma referencji, ma SKILL.md. Jeśli Layer 2 zmieni strukturę skilla (usunie sekcję, zmieni workflow), overlay z Layer 3 (`@bu`) może stać się niespójny (np. referencje odwołują się do kontekstu, który już nie istnieje). Validator PS025 powinien w przyszłości (Faza 2) sprawdzać spójność semantyczną między bazowym skillem a overlayem. Na MVP: provenance w output pozwala szybko zidentyfikować źródło niespójności.

---

## 8. Wpływ na `suggestionRules`

### 8.1 Problem

Layer 2 manifest (`@clm5core`) definiuje suggestion rules:

```yaml
suggestionRules:
  - condition: { files: ['**/clm-microservices/**'] }
    suggest: { skills: ['skills/clm512-expert'] }
```

Czy sugestia `clm512-expert` automatycznie wciąga overlay z `@bu`? Czy BU może dodać własne suggestion rules triggerujące overlay?

### 8.2 Rozwiązanie

**Sugestie NIE wciągają automatycznie overlayów.** Suggestion rules operują na poziomie pojedynczego rejestru — sugerują skill z tego rejestru. Overlay to świadoma decyzja deklarowana w PRS, nie efekt uboczny sugestii.

**BU może dodać własne suggestion rules** w swoim manifeście:

```yaml
# @bu registry-manifest.yaml
suggestionRules:
  - condition: { files: ['**/clm-microservices/**'] }
    suggest: { skills: ['skills/clm512-expert'] }
    # Sugeruje BU-owy skill (który wewnętrznie @extend-uje @clm5core)
```

**Flow dla nowego projektu:**

1. `prs init` wykrywa `**/clm-microservices/**` → sugeruje `@clm5core/clm512-expert`
2. Jeśli `@bu` jest skonfigurowany i ma suggestion rule na tę samą condition → sugeruje `@bu/clm512-expert` (overlay)
3. Przy kolizji sugestii: wyświetl obie opcje, pozwól użytkownikowi wybrać
4. Wybrany skill trafia do `promptscript.yaml`

**Brak zmian w mechanizmie sugestii** — suggestion rules działają jak dziś. Overlay jest ortogonalny do sugestii.

---

## 9. Interim Workaround

**Zanim feature będzie gotowy, BU może korzystać z referencji manualnie:**

### 9.1 Podejście: inline w `project.prs`

```prs
@use @clm5core/skills/clm512-expert

@knowledge {
  """
  ## BU CRM Retail — Architecture Reference

  (skopiowana treść z @bu/skills/clm512-expert/references/architecture.md)
  """
}
```

**Wady:** duplikacja, brak automatycznej synchronizacji, ręczne kopiowanie.

### 9.2 Podejście: `@use` na BU wrapper

BU tworzy plik `skills/clm512-expert-bu.prs`:

```prs
@use @clm5core/skills/clm512-expert

@knowledge {
  """
  ## Architecture
  (treść architecture.md)

  ## Modules
  (treść modules.md)
  """
}
```

Projekt:

```prs
@use @bu/skills/clm512-expert-bu
```

**Wady:** treść referencji jest w `.prs` (nie w osobnych `.md`), trudniejsze do utrzymania. Ale działa już dziś — `@use` + `@knowledge` to istniejąca mechanika.

### 9.3 Migracja do extends

Po wdrożeniu feature'a, BU zamienia `@knowledge` na `references`:

```prs
@use @clm5core/skills/clm512-expert as base

@extend base.skills.clm512-expert {
  references: [
    ./references/architecture.md
    ./references/modules.md
  ]
}
```

Pliki `.md` już istnieją w repo BU — wystarczy przenieść je z `@knowledge` do osobnych plików i dodać `references`.

---

## 10. Testowanie

### 10.1 Unit testy per package

**Core** (`packages/core`):
- `SkillDefinition.references` akceptuje `string[]`

**Resolver** (`packages/resolver`):
- Rozwiązywanie ścieżek relative w `references`
- Rozwiązywanie ścieżek registry (`@bu/references/arch.md`)
- Plik nie istnieje → `ResolveError`
- Path traversal → `ResolveError`
- Pusty plik → warning
- Plik > `MAX_RESOURCE_SIZE` → error
- `references` z SKILL.md frontmatter
- `@extend` append semantyka — bazowe + nowe referencje
- `@extend` kolizja nazw — wyższy wygrywa z warningiem
- Wiele `@extend` na ten sam skill — kumulatywne
- Mieszane źródła (frontmatter + `@extend`)

**Extensions** (`packages/resolver`):
- `@extend` na `content` → replace
- `@extend` na `description` → replace
- `@extend` na `references` → append
- `@extend` na `params` → shallow merge
- `@extend` na `examples` → append
- Skill-aware merge vs generic merge — poprawna detekcja

**Validator** (`packages/validator`):
- `PS025: valid-skill-references` — ścieżka istnieje
- Path traversal → error
- Duplikaty w liście → warning
- Pusty plik → warning
- `--strict` mode
- `PS026: safe-reference-content` — brak dyrektyw PRS w referencjach
- PRS directive detected → warning (strict: error)

**Formatters** (`packages/formatters`):
- Claude: emituje `references/` obok SKILL.md z provenance `<!-- from: ... -->`
- GitHub: emituje `references/` obok SKILL.md z provenance
- Cursor (single-file): inline na końcu z headerem `## References` i provenance w sub-headerze
- Skill bez referencji → brak katalogu `references/`
- Formatter bez wsparcia katalogów → warning + inline lub skip

**Lock scanner** (`packages/cli`):
- `prs lock` odkrywa `references` z `@skills` bloków
- `prs lock` odkrywa `references` z SKILL.md frontmatter

### 10.2 Integration test (e2e)

```
fixtures/skill-references/
  registry/
    @base/skills/expert/
      SKILL.md                    <- bazowy skill z references: [spring.md]
      references/spring.md
    @overlay/skills/expert/
      overlay.prs                 <- @use + @extend dodaje referencje
      references/architecture.md
  project/
    project.prs                   <- @use @overlay/skills/expert
```

Test: `prs compile` → output zawiera SKILL.md z `@base` + referencje z obu źródeł (`spring.md`, `architecture.md`).

### 10.3 Security test

- Path traversal: `references: [../../.env]` → error
- Absolute path: `references: [/etc/passwd]` → error
- Symlink escape: `references: [./symlink-to-outside]` → error
- PRS directive in reference: `@identity` w `.md` → warning (strict: error)
- PRS directive in reference: `@restrictions` w `.md` → warning (strict: error)

### 10.4 Diamond dependency test

```
fixtures/diamond-references/
  registry/
    @base/skills/expert/
      SKILL.md
    @bu-retail/skills/expert/
      overlay.prs               <- @extend, dodaje architecture.md
      references/architecture.md
    @bu-travel/skills/expert/
      overlay.prs               <- @extend, dodaje architecture.md (inna treść)
      references/architecture.md
  project/
    promptscript.yaml           <- registries: @base, @bu-retail, @bu-travel (w tej kolejności)
    project.prs                 <- @use oba overlay
```

Test: `architecture.md` z `@bu-travel` wygrywa (później w `registries:`). Warning o override.

---

## 11. Przykład end-to-end (scenariusz Comarch)

### 11.1 Layer 2: `@clm5core` — `skills/clm512-expert/SKILL.md`

```yaml
---
name: clm512-expert
description: CLM 5.12+ development expert
references:
  - references/spring-patterns.md
---
Generic workflows for CLM 5.12+ development...
```

### 11.2 Layer 3: `@bu` — `skills/clm512-expert.prs`

```prs
@use @clm5core/skills/clm512-expert as base

@extend base.skills.clm512-expert {
  description: "CLM 5.12+ Expert z kontekstem BU CRM Retail"
  references: [
    ./references/architecture.md
    ./references/modules.md
    ./references/patterns.md
    ./references/integrations.md
  ]
}
```

### 11.3 Layer 4: projekt — `project.prs`

```prs
@use @bu/skills/clm512-expert
```

### 11.4 Wynik `prs compile` (target: claude)

```
.claude/skills/clm512-expert/
  SKILL.md                    <- content z @clm5core
  references/
    spring-patterns.md        <- z @clm5core (Layer 2)
    architecture.md           <- z @bu (Layer 3)
    modules.md                <- z @bu (Layer 3)
    patterns.md               <- z @bu (Layer 3)
    integrations.md           <- z @bu (Layer 3)
```

AI widzi jeden spójny skill z pełnym kontekstem.

### 11.5 Trzy warstwy — kolizja

Jeśli `@clm5core` ma `references/spring-patterns.md` i `@bu` też ma `references/spring-patterns.md`:

- `@bu` (Layer 3) wygrywa — wyższy layer override
- Kompilator loguje: `⚠ skill clm512-expert: references/spring-patterns.md from @bu overrides @clm5core`

---

## 12. Impact on existing registries — migration checklist

Po wdrożeniu feature'a, istniejące rejestry Comarch wymagają następujących zmian:

### 12.1 `@bu` (agents-config) — BU CRM Retail

Katalogi overlay, które dziś są orphaned (istnieją w repo, ale nie są konsumowane przez kompilator):

| Overlay | Bazowy skill | Akcja |
|---|---|---|
| `skills/clm512-expert/references/` | `@clm5core/skills/clm512-expert` | Utworzyć `skills/clm512-expert.prs` z `@use` + `@extend` |
| `skills/clm512-database/references/` | `@clm5core/skills/clm512-database` | Utworzyć `skills/clm512-database.prs` z `@use` + `@extend` |
| `skills/clm59-expert/references/` | `@clm59/skills/clm59-expert` | Utworzyć `skills/clm59-expert.prs` z `@use` + `@extend` |

**Przykład nowego pliku `skills/clm512-expert.prs`:**

```prs
@use @clm5core/skills/clm512-expert as base

@extend base.skills.clm512-expert {
  references: [
    ./references/architecture.md
    ./references/modules.md
    ./references/patterns.md
    ./references/integrations.md
  ]
}
```

### 12.2 `@clm5core` (clm5core/prs-registry)

Brak zmian wymaganych. Layer 2 definiuje SKILL.md bez referencji — overlay z Layer 3 dołącza referencje. Istniejące skille działają bez modyfikacji.

### 12.3 `@comarch` (comarch-promptscript-registry)

Brak zmian wymaganych. Layer 1 nie uczestniczy w overlay.

### 12.4 Projekty (Layer 4)

Projekty, które dziś mają `@use @clm5core/clm512-expert`, muszą zmienić na `@use @bu/clm512-expert` żeby korzystać z overlay. Alternatywnie mogą zachować bezpośredni import z Layer 2 bez referencji BU.

### 12.5 `registry-manifest.yaml` w `@bu`

Dodać wpisy katalogowe dla overlay'ów:

```yaml
catalog:
  # Istniejące skille w pełni posiadane przez BU:
  - id: 'skills/clm512-deployment'
    path: 'skills/clm512-deployment/'
    name: 'CLM 5.12+ Deployment'

  # Nowe: overlay'e na skille z niższych warstw:
  - id: 'skills/clm512-expert'
    path: 'skills/clm512-expert.prs'
    name: 'CLM 5.12+ Expert (BU overlay)'
    description: 'BU-specific references for CLM 5.12+ expert skill'

  - id: 'skills/clm512-database'
    path: 'skills/clm512-database.prs'
    name: 'CLM 5.12+ Database (BU overlay)'

  - id: 'skills/clm59-expert'
    path: 'skills/clm59-expert.prs'
    name: 'CLM 5.9 Expert (BU overlay)'
```

---

## 13. Fazy wdrożenia

### Faza 1 — MVP

1. Property `references` w `SkillDefinition` i `SKILL_RESERVED_KEYS`
2. Resolver etap A: skill-aware extend semantics — merge properties w AST (sekcja 6.4)
3. Resolver etap B: discovery i agregacja plików referencyjnych (sekcja 6.4)
4. Obsługa `references` w SKILL.md frontmatter (`parseFrontmatterFields()`)
5. Formatter: emisja `references/` jako `additionalFiles` z zachowaniem per typ (directory/inline/none — sekcja 6.5)
6. Provenance metadata: `<!-- from: @registry/path -->` przy każdym emitowanym reference (sekcja 6.5)
7. Validator: reguła `PS025: valid-skill-references` (sekcja 6.6)
8. Validator: reguła `PS026: safe-reference-content` — skan dyrektyw PRS w referencjach (sekcja 6.8)
9. Lock scanner: odkrywanie referencji jako zależności (sekcja 6.7)
10. Priorytet rejestrów tego samego layera wg kolejności deklaracji w YAML (sekcja 5.1)
11. Testy unit + integration + security + diamond dependency
12. Dozwolone typy plików: `.md`, `.json`, `.yaml`, `.yml`, `.txt`, `.csv`

### Faza 2 — post-MVP

13. `prs inspect <skill-name> --layers` — debugowanie kompozycji
14. Walidacja spójności semantycznej base/overlay — wykrywanie, gdy Layer 2 zmieni SKILL.md w sposób łamiący overlay Layer 3
15. Negacja referencji (`references: [!./references/deprecated.md]`)
16. `sealed` / `final` property blokująca override `content` przez wyższe warstwy
17. Rozszerzenie suggestion rules o overlay-aware sugestie

### Faza 3 — roadmap

18. Integrity hashes w lockfile dla referencji z rejestru
19. Policy engine walidujący zgodność rozszerzeń z regułami organizacji
