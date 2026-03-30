# Przegląd projektu: Skill Overlay / Extends

**Dokument:** Design Review
**Klient:** Comarch
**Data:** 2026-03-30
**Recenzent:** Architekt Enterprise
**Status:** Draft

---

## 1. Podsumowanie wykonawcze

Design proponuje rozszerzenie istniejącego mechanizmu `@use` + `@extend` o nową właściwość `references` w `SkillDefinition`, umożliwiając kompozycję umiejętności między warstwami rejestru Comarch (Layer 2 generyczny → Layer 3 BU-specyficzny → Layer 4 projekt). Propozycja jest dobrze osadzona w istniejących mechanizmach PromptScript i wymaga minimalnych zmian w parserze i rdzeniu. Ocena ogólna: **solidny fundament z kilkoma istotnymi lukami wymagającymi zamknięcia przed wdrożeniem produkcyjnym**.

---

## 2. Mocne strony

### 2.1 Minimalizm implementacyjny

Design celnie wykorzystuje istniejącą infrastrukturę. Parser nie wymaga zmian (`references: [...]` jest już poprawną składnią). Mechanizm `@extend` z `applyExtends()` już dziś obsługuje deep merge, append i replace. Dodanie nowej właściwości `references` do `SkillDefinition` to zmiana o niskim ryzyku. To podejście jest technicznie eleganckie.

### 2.2 Jasna semantyka per-property

Tabela semantyk (scalars replace, lists append, objects merge) jest czytelna i przewidywalna. To krytyczne w środowisku enterprise, gdzie wiele zespołów musi rozumieć, co dokładnie się stanie po złożeniu konfiguracji. Brak "magii" jest tu zaletą.

### 2.3 Zgodność z istniejącym modelem zasobów

Codebase już ma koncept `SkillResource` (w `packages/resolver/src/skills.ts`) z `relativePath` i `content`. Design naturalnie rozszerza ten model o kategorię `reference`. Formattery już emitują `additionalFiles` (typ `FormatterOutput`). Ścieżka integracji jest prosta.

### 2.4 Rozwiązanie realnego problemu

Problem jest autentyczny: 4-warstwowa architektura rejestru Comarch bez mechanizmu kompozycji to blokada adopcji. BU musi dziś kopiować i modyfikować pliki Layer 2 zamiast je rozszerzać. To prowadzi do dryfu i podwójnej pracy. Design rozwiązuje ten problem bez wymuszania zmian w istniejących umiejętnościach Layer 2.

---

## 3. Governance i compliance

### 3.1 BRAK: Audit trail kompozycji

**Ryzyko: WYSOKIE**

Design nie definiuje, jak skompilowany output dokumentuje swoje źródła. Kiedy `prs compile` generuje finalny SKILL.md z referencjami, nie ma informacji:
- Które referencje pochodzą z Layer 2, a które z Layer 3
- Kto i kiedy dokonał rozszerzenia
- Jaka wersja bazowego skilla została użyta

**Rekomendacja:** Dodać sekcję `<!-- provenance: ... -->` lub frontmatter `_sources` w wygenerowanych plikach. W środowisku regulowanym (banki, telco — klienci Comarch) to wymóg audytowy. Rozważyć opcję `--provenance` w CLI.

### 3.2 BRAK: Policy enforcement na poziomie warstw

**Ryzyko: ŚREDNIE**

Nic nie uniemożliwia Layer 4 (projekt) rozszerzenia Layer 2 (core) z pominięciem Layer 3 (BU). Nic nie uniemożliwia nadpisania `content` skilla w sposób niezgodny z polityką organizacji.

**Rekomendacja:** Rozważyć opcjonalną właściwość `sealed` lub `final` na poziomie skilla, która blokuje nadpisywanie `content` przez wyższe warstwy. To może być faza 2, ale powinna być wspomniana w designie.

### 3.3 BRAK: Widoczność "co się zmieniło"

**Ryzyko: ŚREDNIE**

Brak komendy `prs diff` lub `prs inspect` pokazującej różnice między bazowym a rozszerzonym skillem. Przy 4 warstwach debugowanie "dlaczego skill robi X zamiast Y" będzie ciężkie.

**Rekomendacja:** Dodać `prs inspect <skill-name> --layers` pokazujące każdą warstwę kompozycji osobno.

---

## 4. Bezpieczeństwo

### 4.1 Path traversal w references

**Ryzyko: WYSOKIE**

Design mówi "Paths resolved identically to @use", ale nie wspomina o walidacji path traversal specyficznie dla `references`. Istniejący kod ma `isSafeRelativePath()` w `skills.ts`, ale to dotyczy auto-odkrytych zasobów, nie deklarowanych ścieżek w `references: [...]`.

Scenariusz ataku: `references: [../../.env]` lub `references: [/etc/passwd]`. Jeśli rozszerzenie Layer 3 jest skompromitowane, może wyciągnąć dowolny plik z systemu plików.

**Rekomendacja:** Explicite zastosować `isSafeRelativePath()` do każdej ścieżki w `references`. Dodać test bezpieczeństwa. Rozważyć allowlist rozszerzeń (tylko `.md`).

### 4.2 Rozmiar plików referencyjnych

Design wspomina warning dla plików > 100KB. To za mało.

**Rekomendacja:** Reuse istniejących limitów z `skills.ts`: `MAX_RESOURCE_SIZE` (1MB per plik), `MAX_TOTAL_RESOURCE_SIZE` (10MB total), `MAX_RESOURCE_COUNT` (100 plików). Te limity są już zdefiniowane i przetestowane. Nie wymyślajmy nowych.

**KOREKTA (v1.3):** Kluczowe pytanie: jaki jest scope budżetu? Design spec v1.3 definiuje go jako **per skill (base + wszystkie overlaye razem)** — tzn. jeśli `@clm5core` ma 2MB resources i `@bu` dodaje 3MB references, to razem 5MB z budżetu 10MB. Zapobiega sytuacji gdzie każda z N warstw dodaje po 10MB. Przy typowym deploymencie Comarch (4 pliki × 15-20KB per BU) to nie jest ograniczeniem, ale przy wielu BU rozszerzających ten sam skill budżet może się szybko wyczerpać.

### 4.3 Supply chain: zaufanie do referencji z rejestru

**Ryzyko: ŚREDNIE**

Referencje z `@clm5core` są ładowane jako raw content. Jeśli rejestr jest skompromitowany, złośliwy plik `.md` może wstrzyknąć instrukcje do AI. To specyficzne dla PromptScript — "prompt injection via reference file".

**Rekomendacja:** Rozważyć opcjonalny integrity check (hash w lockfile) dla referencji z rejestru, analogicznie do `prs.lock` dla importów.

---

## 5. Skalowalność multi-team

### 5.1 Kolejność aplikacji rozszerzeń

**Ryzyko: NISKIE** (skorygowane z ŚREDNIEGO)

**KOREKTA (v1.3):** Oryginalna ocena mówiła "kolejność importów może być niedeterministyczna". To było błędne. W PromptScript kolejność `@use` i `@extend` w pliku PRS jest deterministyczna (top-to-bottom). Wieloplikowy projekt też ma deterministyczną kolejność — `promptscript.yaml` definiuje entry point, a importy są rozwiązywane depth-first. Niedeterminizm może wystąpić tylko przy circular imports, co jest już wykrywanym błędem.

Jedyny realny problem: priorytet dwóch rejestrów tego samego layera (diamond dependency). Design spec v1.3 adresuje to w sekcji 5.1 — kolejność deklaracji w `registries:` w YAML determinuje priorytet.

### 5.2 Diamond dependency w referencjach

**Ryzyko: NISKIE, ale warto udokumentować**

Layer 3 BU-A i Layer 3 BU-B oba rozszerzają ten sam skill z Layer 2, dodając te same referencje. Layer 4 importuje oba. Wynik: duplikaty referencji.

Design wspomina "name collision → higher wins with warning". To poprawne, ale "higher" musi być ściśle zdefiniowane w kontekście wielowarstwowym.

### 5.3 Brak mechanizmu "usuwania" referencji

**Ryzyko: NISKIE**

Semantyka `references` to "append". Nie ma sposobu na _usunięcie_ referencji dodanej przez niższą warstwę. W praktyce: jeżeli Layer 2 doda błędną referencję, Layer 3 nie może jej skasować, tylko dodać własne.

**Rekomendacja:** Rozważyć składnię negacji w fazie 2, np. `references: [!./references/deprecated.md]`. Nie jest to krytyczne na start.

---

## 6. Wersjonowanie i kompatybilność

### 6.1 Spójność base/overlay przy aktualizacjach

**Ryzyko: WYSOKIE**

**KOREKTA (v1.3):** Oryginalnie ten punkt mówił o "Layer 2 zmienia referencje". To było błędne — Layer 2 (`@clm5core`) NIE ma referencji, ma tylko SKILL.md. To Layer 3 (`@bu`) ma references.

Realny problem jest odwrotny: co jeśli Layer 2 zmieni strukturę SKILL.md (np. usunie sekcję workflow, zmieni format, przeorganizuje treść), a referencje Layer 3 odwołują się do kontekstu, który już nie istnieje? Overlay staje się niespójny z bazą.

**Rekomendacja:** Faza 2: walidacja spójności semantycznej base/overlay. Na MVP: provenance w output pozwala szybko zidentyfikować źródło niespójności. Komunikacja między zespołami Layer 2 i Layer 3 (changelog, semver na skillach) jest tu ważniejsza niż tooling.

### 6.2 Kompatybilność wsteczna

**Ryzyko: NISKIE**

Design jest wstecznie kompatybilny. Nowa właściwość `references` jest opcjonalna. Istniejące skille bez referencji działają bez zmian. `SKILL_RESERVED_KEYS` w `skills.ts` trzeba zaktualizować o `'references'` — design to poprawnie identyfikuje.

### 6.3 Brak wersji formatu extend

**Ryzyko: NISKIE**

Tabela semantyk extend jest w kodzie, nie w metadanych. Jeśli w przyszłości zmienimy semantykę (np. `params` z "shallow merge" na "deep merge"), nie ma sposobu na wyrażenie "ten extend używa semantyk v1".

**Rekomendacja:** Na razie akceptowalne. Warto dodać komentarz w kodzie, że semantyki są zamrożone od wersji X.

---

## 7. Luki w designie

### 7.1 Brak specyfikacji formatu wyjściowego referencji per formatter

Design mówi "Formatter emits them in `references/` subdirectory alongside SKILL.md." Ale PromptScript wspiera 37 platform. Co z formatterami, które nie mają konceptu katalogów skill (np. Cursor `.cursorrules`, który jest jednym plikiem)?

Istniejący kod Claude formattera już obsługuje `resources` via `sanitizeResourceFiles()`. Ale Cursor, GitHub Copilot, Roo i inne formattery mogą potrzebować innego podejścia (inline w main file? ignorować? error?).

**Rekomendacja:** Dodać do tabeli feature-matrix zachowanie `references` per formatter. Formattery bez wsparcia katalogów powinny inlinować referencje w głównym pliku lub generować warning.

### 7.2 Brak specyfikacji zachowania `prs validate --strict`

Design dodaje regułę PS025, ale nie definiuje, czy brakujący plik referencji to error czy warning w trybie strict. Istniejący pipeline weryfikacji (`prs validate --strict`) musi to obsługiwać.

### 7.3 Brak wsparcia dla binary references

Design ogranicza referencje do `.md`. To rozsądne na start, ale klienci enterprise będą chcieli dołączać `.json` (schematy API), `.yaml` (konfiguracje), `.csv` (dane referencyjne). Istniejący `discoverSkillResources()` już obsługuje dowolne pliki tekstowe.

**Rekomendacja:** Rozważyć rozszerzenie na dowolne pliki tekstowe (`.md`, `.json`, `.yaml`, `.txt`, `.csv`) od razu. Ograniczenie do `.md` jest sztuczne i będzie frustrujące.

### 7.4 Brak testu integracyjnego z lockfile

`prs lock` musi odkryć ścieżki `references` jako zależności do zablokowania. Design nie wspomina o integracji z lockfile.

---

## 8. Atrakcyjność i pozycjonowanie konkurencyjne

### 8.1 Wow factor: WYSOKI

To jest killer feature dla enterprise. Żadne inne narzędzie AI instruction (Cursor rules, GitHub Copilot instructions, Claude projects) nie oferuje warstwowej kompozycji z semantyką merge/append/replace. Konkurencja oferuje "kopiuj plik i edytuj". PromptScript oferuje "rozszerzaj deklaratywnie".

### 8.2 Rozwiązanie realnego bólu

4-warstwowa architektura Comarch (core → domain → BU → project) to wzorzec powszechny w dużych organizacjach. Każda firma z 10+ zespołami AI będzie miała analogiczny problem. To nie jest feature dla jednego klienta — to fundament platformy.

### 8.3 Czytelność składni

**KOREKTA (v1.3):** Oryginalna propozycja Comarch zakładała manifest-based `extends` w `registry-manifest.yaml`. Design spec odrzucił to na rzecz PRS `@extend` — istniejącego mechanizmu językowego. To jest świadoma decyzja: kompozycja odbywa się w kodzie PRS, nie w metadanych YAML. Nie potrzebujemy obu mechanizmów.

**Kto pisze `@extend` i gdzie?** BU tworzy nowy plik `.prs` w swoim rejestrze (`agents-config`). Dziś `agents-config` ma tylko gołe katalogi `skills/clm512-expert/references/` — po wdrożeniu feature'a BU musi dodać plik `.prs` obok:

```
# @bu (agents-config) — stan PRZED migracją:
skills/clm512-expert/
  references/
    architecture.md
    modules.md

# @bu (agents-config) — stan PO migracji:
skills/clm512-expert/
  clm512-expert.prs           ← NOWY: @use + @extend
  references/
    architecture.md
    modules.md
```

Zawartość nowego pliku:

```prs
@use @clm5core/skills/clm512-expert as base

@extend base.skills.clm512-expert {
  references: [
    ./references/architecture.md
    ./references/modules.md
  ]
}
```

To NIE jest obowiązek projektu (Layer 4) — BU pisze ten plik raz, a wszystkie projekty konsumują gotowy overlay przez `@use @bu/clm512-expert`. Pełny migration checklist jest w design spec sekcja 12.

To jest czytelne nawet dla nie-programistów. Menedżer BU może zrozumieć, co to robi. To ważne w enterprise, gdzie decyzje o adopcji podejmują ludzie, którzy nie piszą kodu.

### 8.4 Przewaga nad alternatywami

| Cecha | PromptScript (po zmianach) | Kopiowanie plików | Symlinki | Custom scripts |
|-------|---------------------------|-------------------|----------|----------------|
| Deklaratywność | Tak | Nie | Nie | Nie |
| Wersjonowanie | Tak (rejestr) | Git | Git | Git |
| Kompozycja wielowarstwowa | Tak | Nie | Częśc. | Możliwe |
| Audytowalność | Częściowa* | Brak | Brak | Brak |
| Determinizm | Tak | Ręczny | Tak | Zależne |

*Częściowa — wymaga dodania provenance (patrz 3.1).

### 8.5 Ryzyko: overengineering

Design jest odpowiednio prosty. Nie wprowadza nowych konceptów językowych, nie komplikuje gramatyki, nie zmienia modelu mentalnego użytkownika. To dobrze. Ryzyko overengineering jest niskie.

---

## 9. Zgodność z codebase

Po analizie istniejącego kodu:

| Element designu | Stan w codebase | Ocena |
|-----------------|----------------|-------|
| `SkillDefinition` w core | Istnieje w `ast.ts` | Łatwe rozszerzenie |
| `applyExtends()` w resolver | Istnieje w `extensions.ts`, obsługuje merge/append/replace | Wymaga dodania skill-aware semantyk |
| `SKILL_RESERVED_KEYS` | Istnieje w `skills.ts` | Dodać `'references'` |
| `SkillResource` interface | Istnieje w `skills.ts` | Reuse z dodaniem `category` |
| `additionalFiles` w formatterach | Istnieje w `FormatterOutput` | Naturalne rozszerzenie |
| `isSafeRelativePath()` | Istnieje w `skills.ts` | Reuse dla walidacji path |
| Validator PS025 | Nie istnieje, ale konwencja numeracji jest wolna | Nowa reguła |

**Ważna obserwacja:** Istniejący `applyExtends()` w `extensions.ts` operuje na ogólnym `BlockContent` i nie ma pojęcia o skill-specyficznych semantykach (np. "references = append, description = replace"). Design wymaga, aby rozszerzenia bloku `@skills` były traktowane inaczej niż rozszerzenia ogólne. To jest główne wyzwanie implementacyjne — trzeba albo dodać skill-aware logikę do `mergeValue()`, albo wprowadzić pre-processing w resolverze. **KOREKTA (v1.3):** Design spec v1.3 sekcja 6.4 adresuje to explicite — rozdziela na Etap A (merge properties w AST) i Etap B (discovery/agregacja plików z dysku).

---

## 9a. Migration checklist for existing registries

**DODANE (v1.3):** Design spec sekcja 12 zawiera pełny migration checklist. Kluczowe akcje:

### `@bu` (agents-config) — 3 nowe pliki `.prs`:

| Plik do utworzenia | Bazowy skill | Istniejące references |
|---|---|---|
| `skills/clm512-expert.prs` | `@clm5core/skills/clm512-expert` | `architecture.md`, `modules.md`, `patterns.md`, `integrations.md` |
| `skills/clm512-database.prs` | `@clm5core/skills/clm512-database` | `migration-patterns.md` |
| `skills/clm59-expert.prs` | `@clm59/skills/clm59-expert` | `architecture.md`, `modules.md`, `patterns.md` |

### `@bu` registry-manifest.yaml — 3 nowe wpisy katalogowe:

```yaml
catalog:
  - id: 'skills/clm512-expert'
    path: 'skills/clm512-expert.prs'
    name: 'CLM 5.12+ Expert (BU overlay)'
  - id: 'skills/clm512-database'
    path: 'skills/clm512-database.prs'
    name: 'CLM 5.12+ Database (BU overlay)'
  - id: 'skills/clm59-expert'
    path: 'skills/clm59-expert.prs'
    name: 'CLM 5.9 Expert (BU overlay)'
```

### Projekty (Layer 4):

Zmiana w `project.prs`: `@use @clm5core/clm512-expert` → `@use @bu/clm512-expert`

### Weryfikacja:

`prs compile` w projekcie wdrożeniowym musi wyprodukować output z provenance potwierdzającym, że referencje z `@bu` zostały dołączone.

### `@clm5core`, `@comarch` — brak zmian wymaganych.

---

## 10. Rekomendacje priorytetyzowane

### Faza 1 (MVP — przed releasem)

1. **Walidacja path traversal** dla `references` — krytyczne bezpieczeństwo
2. **Reuse istniejących limitów** rozmiaru z `skills.ts` (budżet per skill, nie per warstwa)
3. **Dodanie `references` do `SKILL_RESERVED_KEYS`**
4. **Skill-aware extend semantics** — dwa etapy: merge properties w AST + discovery/agregacja plików
5. **Rozszerzenie dozwolonych typów plików** poza `.md` (`.json`, `.yaml`, `.txt`)
6. **Integracja z `prs lock`** — referencje muszą być odkrywane jako zależności
7. **Provenance metadata** — `<!-- from: @registry/path -->` przy każdym emitowanym reference (koszt minimalny, wartość diagnostyczna krytyczna przy 4 warstwach)
8. **Zachowanie per formatter** — directory/inline/none (blocker: bez tego część zespołów nie widzi BU data)
9. **Content safety** — `PS026: safe-reference-content` skanujący dyrektywy PRS w referencjach
10. **Test e2e z wielowarstwowym rejestrem**

### Faza 2 (post-MVP)

11. **`prs inspect --layers`** do debugowania kompozycji
12. **Walidacja spójności semantycznej** base/overlay przy aktualizacjach Layer 2
13. **Negacja referencji** (`!path`)
14. **`sealed`/`final` na poziomie skilla**

### Faza 3 (roadmap)

15. **Integrity hashes** w lockfile dla referencji z rejestru
16. **Policy engine** walidujący zgodność rozszerzeń z regułami organizacji

---

## 11. Werdykt

**AKCEPTACJA Z WARUNKAMI.** Design jest solidny architektonicznie, dobrze osadzony w istniejącym codebase i rozwiązuje realny problem enterprise. Główne ryzyka (path traversal, brak provenance, niejasna semantyka skill-aware extend) są zaadresowane w design spec v1.3 i przypisane do Fazy 1 MVP. Rekomenduję zamknięcie punktów 1-10 z Fazy 1 przed releasem. Punkty 11-16 mogą iść na roadmap.

Feature ma wysoki potencjał biznesowy — jest to mechanizm, który może być kluczowym argumentem sprzedażowym dla klientów enterprise z wielozespołową organizacją.
