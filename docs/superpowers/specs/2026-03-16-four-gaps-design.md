# PromptScript Four Gaps Design Spec

> **Data:** 2026-03-16
> **Status:** Draft
> **Autor:** Design session z FactoryAI feedback
> **Podejscie:** A (Adoption First) z elementami C (Parallel Tracks)

## Streszczenie

FactoryAI (Droid) zidentyfikowal 4 luki w PromptScript po analizie codebase. Ten dokument definiuje kompletny plan ich zaadresowania z naciskiem na maksymalizacje ROI dla enterprise i programistow.

Kazda zmiana MUSI spelniac:

1. **100% pokrycie testami** -- unit, integration, e2e
2. **Kompletna dokumentacja** -- docs, migration guides, przyklady
3. **Pozycjonowanie jako game changer** -- blog post, changelog, README update

---

## Sekwencja implementacji

```
Sprint 1-2 --> Luka 1: prs import (Tier 1+2)          [P0, 3-4 tyg.]
Sprint 3   --> Luka 3: Parametryzowane skille           [P1, 1-2 tyg.]
Sprint 4   --> Luka 1: prs import Tier 3 +              [P2, 2 tyg.]
               Luka 2: Skill folders + shared resources
Sprint 5-6 --> Luka 4: Skill contracts                  [P3, 3-4 tyg.]
```

Laczny naklad: ~10-12 tygodni.

**Uwaga o kolejnosci sekcji:** Sekcje w tym dokumencie sa ulozone wedlug
priorytetu implementacji (1, 3, 2, 4), nie wedlug numeracji luk.

### Nazewnictwo: `prs import` vs `prs migrate`

ROADMAP.md (linia 173) wymienia `prs migrate` jako planowana komende. Ten spec
wprowadza nazwe `prs import` zamiast `prs migrate`, poniewaz:

- `migrate` sugeruje jednorazowa operacje (jak database migration)
- `import` sugeruje powtarzalna konwersje (jak `terraform import`)
- `prs init --migrate` juz istnieje z innym znaczeniem (AI-assisted migration skill)
- Unikniecie kolizji nazw z istniejacym `--migrate` flag

ROADMAP.md powinien byc zaktualizowany po implementacji.

### Backward compatibility

Wszystkie zmiany sa **addytywne** -- nie lamia istniejacych plikow `.prs`:

- `params`, `inputs`, `outputs`, `requires` w `@skills` sa opcjonalne
- Istniejace pliki bez tych properties parsuja sie bez zmian
- Nowa wersja `syntax` (np. 1.2.0) nie jest wymagana, ale zalecana
- Stare pliki `.prs` nie wymagaja migracji

### Out of Scope

Nastepujace elementy sa poza zakresem tego spec:

- **`@policy` block** -- przykladay policy enforcement w Lukach 3 i 4 sa
  ilustracjami przyszlej synergii, NIE czescia tej implementacji. `@policy`
  wymaga osobnego spec i implementacji (roadmap sekcja 7).
- **Conditionals `{{#if}}`** -- system szablonow nie wspiera conditional blocks.
  ROADMAP wymienia to jako Phase 3. Przyklady w tym spec uzywajace `{{#if}}`
  sa oznaczone jako "przyszla skladnia".
- **Playground (`prs serve`)** -- aktualizacja playgroundu o nowe features
  bedzie osobnym taskiem po implementacji.
- **LSP/VS Code** -- integracja z nowa skladnia to osobny task.

---

## Luka 1: `prs import` -- Deterministyczny Reverse Parser

### Problem

Nie istnieje deterministyczny sposob konwersji istniejacych plikow instrukcji AI (CLAUDE.md, .cursorrules, copilot-instructions.md) do formatu .prs. Jedyna opcja to `prs init --migrate` (AI-assisted, niedeterministyczny). Organizacja z 500 deweloperami ma ~150 plikow do migracji = ~600 roboczogodzin recznej pracy.

### Rozwiazanie

Nowa komenda CLI `prs import` z heurystycznym parserem Markdown.

```bash
# Autodetekcja -- skanuje katalog, znajduje wszystkie pliki instrukcji AI
prs import

# Konkretny plik
prs import CLAUDE.md

# Konkretny format
prs import --format cursor .cursorrules

# Dry-run -- podglad bez zapisu
prs import --dry-run CLAUDE.md

# Batch -- cala organizacja
prs import --recursive ./repos/
```

### Architektura

Nowy pakiet `packages/importer/`:

```
packages/
  importer/
    src/
      index.ts           # Public API
      detector.ts        # Autodetekcja formatu (logika przeniesiona z cli/utils/ai-tools-detector)
      parsers/
        markdown.ts      # Heurystyczny parser Markdown -> bloki PRS
        cursor.ts        # .cursorrules (YAML frontmatter + MD)
        claude.ts        # CLAUDE.md specyficzne wzorce
        github.ts        # copilot-instructions.md
        generic.ts       # Fallback dla 30+ formatow (prosty MD)
      mapper.ts          # Mapowanie sekcji MD -> bloki @identity/@standards/etc.
      emitter.ts         # AST -> .prs tekst (pretty-printer)
      roundtrip.ts       # Weryfikacja: import -> compile -> diff z oryginalem
      confidence.ts      # System pewnosci klasyfikacji (high/medium/low)
```

### Algorytm parsowania

```
Input: CLAUDE.md
  |
  +- 1. Detekcja formatu (autodetekcja z ai-tools-detector)
  |
  +- 2. Parsowanie struktury Markdown
  |     +- H1/H2 -> kandydaci na bloki @block
  |     +- Listy "You are..." -> @identity
  |     +- Listy "Never/Don't/Always" -> @restrictions
  |     +- Listy "Use/Prefer/Follow" -> @standards
  |     +- Tabele -> properties (key: value)
  |     +- Bloki kodu -> zachowane jako tekst
  |     +- Mermaid/diagramy -> zachowane doslownie
  |
  +- 3. Klasyfikacja z confidence score
  |     +- HIGH (>80%): Automatyczne mapowanie
  |     +- MEDIUM (50-80%): Mapowanie + komentarz # REVIEW:
  |     +- LOW (<50%): Wrzucenie do @context jako surowy tekst
  |
  +- 4. Emisja .prs + promptscript.yaml
  |
  +- 5. Roundtrip check: compile -> diff -> raport pokrycia
```

### Priorytet formatow

| Tier    | Formaty                                            | Pokrycie rynku | Sprint   |
| ------- | -------------------------------------------------- | -------------- | -------- |
| 1 (MVP) | CLAUDE.md, copilot-instructions.md, .cursorrules   | ~60%           | Sprint 1 |
| 2       | AGENTS.md, .windsurf/rules, .clinerules, GEMINI.md | ~85%           | Sprint 2 |
| 3       | Pozostale 30+ (generic MD parser)                  | ~99%           | Sprint 4 |

### Przyklad konwersji

Input `CLAUDE.md`:

```markdown
# My Project

You are an expert TypeScript developer working on MyApp.

## Code Style

- Use strict mode
- Never use `any` type
- Prefer interfaces over types

## Testing

- Framework: Vitest
- Target >90% coverage
```

Output `project.prs`:

```text
@meta {
  name: "my-project"
  version: "1.0.0"
}

@identity {
  role: "Expert TypeScript developer"
  project: "MyApp"
}

@standards {
  code-style: [
    "Use strict mode"
    "Prefer interfaces over types"
  ]
  testing: {
    framework: "Vitest"
    coverage: ">90%"
  }
}

@restrictions {
  forbidden: [
    "Never use `any` type"
  ]
}
```

### Output komendy

```
$ prs import CLAUDE.md

  Detected format: Claude Code (CLAUDE.md)
  Parsed 6 sections (4 high confidence, 2 medium)
  Generated project.prs (45 lines)
  Generated promptscript.yaml

Roundtrip check:
  94% semantic coverage
  2 sections marked # REVIEW: (manual check recommended)

Files created:
  .promptscript/project.prs
  promptscript.yaml
```

### Obsluga bledow i edge cases

| Scenariusz                  | Zachowanie                                                    |
| --------------------------- | ------------------------------------------------------------- |
| Plik z 0% confidence        | Cala tresc wrzucona do `@context` jako surowy tekst + warning |
| Plik binarny                | Error: "Binary file detected, cannot import"                  |
| Pusty plik                  | Error: "Empty file, nothing to import"                        |
| Plik bez naglowkow          | Cala tresc jako `@context` z LOW confidence                   |
| Plik z samym kodem          | Tresc jako `@knowledge` z MEDIUM confidence                   |
| Brak uprawnien              | Error z sciezka pliku i wymaganymi uprawnieniami              |
| Plik >1MB                   | Warning + import z truncation notice                          |
| Mieszane formaty w katalogu | Kazdy plik importowany wg autodetekcji, raport zbiorczy       |

### Enterprise value

| Metryka                                   | Bez prs import           | Z prs import             |
| ----------------------------------------- | ------------------------ | ------------------------ |
| Koszt migracji (500-dev org, ~150 plikow) | ~600h recznej pracy      | ~15h review              |
| Czas wdrozenia                            | 3-6 miesiecy             | 1-2 tygodnie             |
| Audytowalnosc                             | Brak (reczne)            | Pelna (deterministyczne) |
| Wymagany LLM                              | Tak (prs init --migrate) | Nie                      |

### Testy -- wymagane 100% pokrycie

| Kategoria          | Zakres                                                                  | Typ testu   |
| ------------------ | ----------------------------------------------------------------------- | ----------- |
| Parsery formatow   | Kazdy Tier 1/2/3 parser z fixture files                                 | Unit        |
| Mapper sekcji      | Kazda heurystyka klasyfikacji (identity, standards, restrictions, etc.) | Unit        |
| Confidence scoring | Progi HIGH/MEDIUM/LOW z edge cases                                      | Unit        |
| Emitter            | Generowanie poprawnego .prs z AST                                       | Unit        |
| Roundtrip          | Import -> compile -> diff z oryginalem                                  | Integration |
| CLI                | `prs import`, `--dry-run`, `--format`, `--recursive`                    | E2E         |
| Edge cases         | Puste pliki, pliki bez sekcji, pliki z samym kodem, binarne             | Unit        |
| Batch import       | Wiele plikow, rozne formaty w jednym katalogu                           | Integration |
| Error handling     | Brak pliku, brak uprawnien, niepoprawny format                          | Unit        |

### Dokumentacja -- wymagana kompletna

| Dokument                          | Zawartosc                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `docs/guides/import.md`           | Kompletny przewodnik z przykladami dla kazdego formatu                                       |
| `docs/guides/migration-from-X.md` | Dedykowane przewodniki: migration-from-claude, migration-from-cursor, migration-from-copilot |
| README.md update                  | Sekcja "Migration" z one-liner przykladem                                                    |
| CHANGELOG.md                      | Feature highlight z before/after                                                             |
| Blog post draft                   | `docs/blog/prs-import-game-changer.md` -- pozycjonowanie jako game changer                   |

### Pozycjonowanie jako game changer

**Narracja:** "Zero-friction migration. One command. 38+ formats. No AI required."

Kluczowe przekazy:

- **Dla deweloperow:** "Masz 500-liniowy CLAUDE.md? `prs import` i gotowe w 30 sekund."
- **Dla enterprise:** "Migracja 150 plikow: z 600h do 15h. ROI w pierwszym tygodniu."
- **Dla decision makerow:** "Deterministyczny, audytowalny, powtarzalny -- bez wysylania instrukcji do LLM."

---

## Luka 3: Parametryzowane Skille

### Problem

System szablonow (`bindParams`, `interpolateAST`, `{{variable}}`) dziala dla `@inherit` i `@use`, ale nie dla `@skills`. Zespoly duplikuja skille zamiast parametryzowac -- 5 jezykow x 3 poziomy strictness = 15 duplikatow zamiast 1 skilla.

### Rozwiazanie

Podlaczenie istniejacego template system do `@skills`.

### Skladnia -- definicja parametrow w .prs

```text
@skills {
  code-review: {
    description: "Review {{language}} code"
    params: {
      language: string = "typescript"
      strictness: enum("relaxed", "standard", "strict") = "standard"
      coverage?: number
    }
    content: """
      Review {{language}} code with {{strictness}} rules.
      Minimum coverage: {{coverage}}%.
    """
    # UWAGA: Conditionals {{#if}} nie sa jeszcze wspierane (ROADMAP Phase 3).
    # MVP uzywa prostej interpolacji {{variable}}.
  }
}
```

### Skladnia -- definicja parametrow w SKILL.md

```markdown
---
name: code-review
description: Review {{language}} code
params:
  language:
    type: string
    default: typescript
  strictness:
    type: enum
    options: [relaxed, standard, strict]
    default: standard
  coverage:
    type: number
    optional: true
---

Review {{language}} code with {{strictness}} rules.
```

### Skladnia -- przekazywanie parametrow

```text
# W @agents
@agents {
  reviewer: {
    skills: [
      "code-review(language: 'python', strictness: 'strict')"
    ]
  }
}

# Skill kompozytowy
@skills {
  full-review: {
    description: "Complete review pipeline"
    skills: [
      "code-review(language: 'go', coverage: 95)"
      "security-scan"
    ]
  }
}
```

### Zmiany w pipeline

Reuse istniejacego `packages/core/src/template.ts` -- nowy kod to glownie "klej":

| Pakiet      | Plik                     | Zmiana                                                                                                                                                                             |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parser`    | `lexer.ts` / `parser.ts` | Rozpoznawanie `params:` w skill objects                                                                                                                                            |
| `core`      | `types/ast.ts`           | Nowy interfejs `SkillDefinition` (nie istnieje -- skille sa obecnie `Record<string, Value>` w `ObjectContent`) z `params?: ParamDefinition[]`                                      |
| `resolver`  | `skills.ts`              | Parsowanie `params:` z SKILL.md frontmatter (wymaga rozszerzenia `parseSkillMd()` z prostego regex na pelniejsze parsowanie YAML -- uzyc lekkiego YAML parsera np. `yaml` package) |
| `resolver`  | `skills.ts`              | Faza interpolacji po zaladowaniu SKILL.md                                                                                                                                          |
| `compiler`  | `compiler.ts`            | Wywolanie `bindParams()` dla skilli                                                                                                                                                |
| `validator` | reguly                   | Walidacja typow parametrow skilli                                                                                                                                                  |

Istniejaca infrastruktura z `template.ts`:

- `bindParams()` (eksportowane) -- wiazanie argumentow z definicjami
- `interpolateAST()` / `interpolateText()` (eksportowane) -- interpolacja `{{var}}`
- `validateParamType()` (prywatne, uzywane wewnetrznie przez `bindParams`) -- walidacja typow
- `MissingParamError`, `UnknownParamError`, `ParamTypeMismatchError` -- bledy
- `ParamDefinition`, `ParamArgument`, `TemplateExpression` -- typy AST

**Uwaga:** `validateParamType` jest funkcja prywatna. Dla walidacji skilli
uzywamy `bindParams()`, ktory wewnetrznie ja wywoluje. Nie trzeba jej eksportowac.

### Enterprise use cases

| Scenariusz                       | Bez parametrow            | Z parametrami               |
| -------------------------------- | ------------------------- | --------------------------- |
| 5 jezykow x 3 poziomy strictness | 15 duplikatow skilli      | 1 skill                     |
| 5 srodowisk (dev -> prod)        | 5 wariantow deploy skilla | 1 skill                     |
| 30 zespolow, rozne konwencje     | 30 kopii code-review      | 1 skill + 30 konfiguracji   |
| SOC2 vs HIPAA vs PCI-DSS         | 3 security skille         | 1 skill(compliance: "SOC2") |

### Synergia z policy enforcement (PRZYSZLA FUNKCJA)

**UWAGA:** `@policy` nie istnieje w aktualnym jezyku. Ponizszy przyklad
ilustruje przyszla synergie -- nie jest czescia tego spec.

```text
# PRZYKLAD PRZYSZLEJ SKLADNI
@policy {
  enforce: {
    skill: "deploy"
    when: { param: "env", equals: "production" }
    require: { param: "approval", equals: true }
  }
}
```

### Testy -- wymagane 100% pokrycie

| Kategoria  | Zakres                                                                    | Typ testu   |
| ---------- | ------------------------------------------------------------------------- | ----------- |
| Parser     | `params:` w skill objects, wszystkie typy (string, number, boolean, enum) | Unit        |
| Parser     | Parametry w SKILL.md frontmatter (YAML)                                   | Unit        |
| Resolver   | `bindParams()` dla skilli -- happy path i error paths                     | Unit        |
| Resolver   | Interpolacja `{{var}}` w skill content i description                      | Unit        |
| Compiler   | End-to-end: .prs z parameterized skill -> output                          | Integration |
| Validator  | Brakujacy wymagany param, nieznany param, bledny typ                      | Unit        |
| Formatters | Output z interpolowanymi wartosciami dla kazdego formattera               | Unit        |
| Edge cases | Skill bez params, skill z samymi defaults, nested params                  | Unit        |
| SKILL.md   | Natywny skill z params w frontmatter -> interpolacja                      | Integration |
| Roundtrip  | Parametryzowany skill: parse -> resolve -> compile -> verify              | E2E         |

### Dokumentacja -- wymagana kompletna

| Dokument                               | Zawartosc                                        |
| -------------------------------------- | ------------------------------------------------ |
| `docs/guides/parameterized-skills.md`  | Kompletny przewodnik z 5+ przykladami            |
| `docs/reference/skill-params.md`       | Referencyjna dokumentacja skladni params         |
| Aktualizacja `docs/getting-started.md` | Sekcja o parametryzacji skilli                   |
| README.md update                       | Przyklad parameterized skill w "Features"        |
| CHANGELOG.md                           | Feature highlight                                |
| Blog post draft                        | `docs/blog/parameterized-skills-game-changer.md` |

### Pozycjonowanie jako game changer

**Narracja:** "One skill, infinite configurations. Stop duplicating, start parameterizing."

Kluczowe przekazy:

- **Dla deweloperow:** "Jeden skill code-review obsluguje TypeScript, Python, Go -- zmien parametr, nie duplikuj."
- **Dla enterprise:** "150 wariantow skilli -> 1 szablon. Governance na parametrach, nie na kopiach."
- **Dla decision makerow:** "Parametry to enforcement points -- policy moze kontrolowac kazdy wariant."

---

## Luka 2: Skill Folders jako First-Class + Shared Resources

### Problem

Resolver juz obsluguje foldery skilli z `scripts/`, `references/`, `assets/`, `.skillignore`. Ale:

1. Skladnia `.prs` ukrywa to -- skille wygladaja na inline bloki tekstowe
2. Brak cross-skill shared resources -- kazdy skill jest izolowany
3. Dokumentacja nie promuje folder-based skills jako primary pattern

### Rozwiazanie: 3 warstwy

### Warstwa 1: Konwencja katalogow

Promowanie istniejacego wzorca jako canonical:

```
.promptscript/
  project.prs
  skills/
    code-review/
      SKILL.md              # Tresc + frontmatter (z params)
      scripts/
        run-eslint.sh       # Skrypt pomocniczy
        check-types.sh
      references/
        style-guide.md      # Material referencyjny
      assets/
        checklist.json      # Dane strukturalne
      .skillignore
    deploy/
      SKILL.md
      scripts/
        pre-deploy.sh
      templates/
        k8s-manifest.yaml
  shared/                   # NOWE -- zasoby cross-skill
    templates/
      pr-template.md
    data/
      team-config.json
```

### Warstwa 2: Shared Resources

Nowy katalog `.promptscript/shared/` widoczny dla wszystkich skilli.

Zmiana w resolverze `packages/resolver/src/skills.ts`:

```typescript
// discoverSkillResources() -- dodanie shared jako dodatkowego zrodla
async function discoverSkillResources(
  skillDir: string,
  sharedDir?: string, // NOWE
  logger?: Logger
): Promise<SkillResource[]> {
  const resources = await discoverLocalResources(skillDir, logger);

  if (sharedDir) {
    const shared = await discoverLocalResources(sharedDir, logger);
    for (const r of shared) {
      resources.push({
        relativePath: `@shared/${r.relativePath}`,
        content: r.content,
      });
    }
  }

  return resources;
}
```

W SKILL.md odwolanie do shared:

```markdown
---
name: code-review
description: Review code against team standards
---

Use the PR template from shared resources.

See @shared/templates/pr-template.md for the expected format.
```

### Warstwa 3: Deklaratywne zaleznosci miedzy skillami

```text
@skills {
  full-review: {
    description: "Complete code review pipeline"
    requires: ["code-review", "security-scan"]
    content: """
      Run all required skills in sequence and aggregate results.
    """
  }
}
```

Walidacja compile-time: jesli skill deklaruje `requires: ["X"]`, a `X` nie istnieje, to blad kompilacji.

**Uwaga:** `requires` jest implementowane raz w Luce 2 (Skill Folders) i reuzywane
w Luce 4 (Skill Contracts). Luka 4 dodaje `inputs`/`outputs` obok juz istniejacego
`requires` -- nie reimplementuje go.

### Zmiany w pakietach

| Pakiet       | Plik           | Zmiana                                                                                                              |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `resolver`   | `skills.ts`    | `sharedDir` parametr w `resolveNativeSkills()` (publiczne API), propagowany do prywatnej `discoverSkillResources()` |
| `resolver`   | `skills.ts`    | Autodiscovery `shared/` obok `skills/`                                                                              |
| `validator`  | nowa regula    | Walidacja `requires` zaleznosci                                                                                     |
| `core`       | `types/ast.ts` | Rozszerzenie `SkillDefinition` (nowy typ z Luki 3) o `requires?: string[]`                                          |
| `formatters` | sekcja skills  | Emitowanie informacji o resources w output                                                                          |

### Polaczenie z Registry (roadmap sekcja 6)

Skill folder = unit publikacji w registry:

```bash
prs publish ./skills/code-review/
# -> @myorg/code-review@1.0.0

prs install @myorg/code-review
# -> .promptscript/skills/code-review/ z SKILL.md + resources
```

### Enterprise governance

| Warstwa       | Kto zarzadza  | Przyklad                                      |
| ------------- | ------------- | --------------------------------------------- |
| Organizacyjna | Platform team | `@company/security-review` w registry, sealed |
| Zespolowa     | Tech lead     | Lokalne skille rozszerzajace organizacyjne    |
| Indywidualna  | Developer     | `shared/` zasoby lokalne dla projektu         |

### Testy -- wymagane 100% pokrycie

| Kategoria           | Zakres                                                     | Typ testu   |
| ------------------- | ---------------------------------------------------------- | ----------- |
| Shared discovery    | Autodiscovery `shared/` katalogu                           | Unit        |
| Shared resources    | Resources z prefiksem `@shared/` w skill resources         | Unit        |
| Shared resolution   | Skill odwolujacy sie do @shared/\*                         | Integration |
| Requires validation | Poprawne requires, brakujacy skill, cykliczne zaleznosci   | Unit        |
| Skill folders       | Pelny folder: SKILL.md + scripts + references + assets     | Integration |
| .skillignore        | Ignorowanie plikow w shared/                               | Unit        |
| Limity              | MAX_RESOURCE_SIZE, MAX_TOTAL_RESOURCE_SIZE w shared        | Unit        |
| Path traversal      | Bezpieczenstwo: shared nie pozwala wyjsc poza katalog      | Unit        |
| Formatters          | Output z resources i requires informacja                   | Unit        |
| E2E                 | Pelny pipeline: skill folder + shared -> compile -> output | E2E         |

### Dokumentacja -- wymagana kompletna

| Dokument                               | Zawartosc                                      |
| -------------------------------------- | ---------------------------------------------- |
| `docs/guides/skill-folders.md`         | Kompletny przewodnik po strukturze folderow    |
| `docs/guides/shared-resources.md`      | Przewodnik po shared resources                 |
| `docs/guides/skill-dependencies.md`    | Jak uzywac `requires`                          |
| Aktualizacja `docs/getting-started.md` | Sekcja "Skills as Packages"                    |
| README.md update                       | Przyklad folder-based skill                    |
| CHANGELOG.md                           | Feature highlight                              |
| Blog post draft                        | `docs/blog/skills-as-packages-game-changer.md` |

### Pozycjonowanie jako game changer

**Narracja:** "Skills are packages, not text blocks. Scripts, templates, data -- all bundled."

Kluczowe przekazy:

- **Dla deweloperow:** "Skill to folder z wlasnym ekosystemem -- skrypty, szablony, dane. Nie kolejny blob tekstu."
- **Dla enterprise:** "Publikuj skille jak npm pakiety. Wersjonuj, udostepniaj, kontroluj."
- **Dla decision makerow:** "Skill governance: kto publikuje, kto uzywa, audit trail na poziomie pakietu."

---

## Luka 4: Skill Contracts -- Minimalne SOLID na poziomie jezyka

### Problem

Skille nie maja kontraktu -- nie wiadomo czego skill oczekuje, co produkuje, jakie narzedzia potrzebuje. Blokuje governance, kompozycje, autogenerowana dokumentacje.

### Czego NIE robimy

Pelne SOLID: zadnych interfejsow, klas abstrakcyjnych, dependency injection, polimorfizmu. PromptScript to DSL konfiguracyjny.

| DSL                    | Co ma                           | Czego NIE ma   |
| ---------------------- | ------------------------------- | -------------- |
| Terraform              | `variable`, `output`            | interfejsy, DI |
| GitHub Actions         | `inputs`, `outputs`             | dziedziczenie  |
| Kubernetes             | `apiVersion`/`kind`             | kompozycja     |
| **PromptScript (cel)** | `inputs`, `outputs`, `requires` | interfejsy, DI |

### Rozwiazanie: Deklaratywne kontrakty skilli

```text
@skills {
  security-scan: {
    description: "Scan code for security vulnerabilities"

    # Kontrakt
    inputs: {
      files: "List of file paths to scan"
      severity: enum("low", "medium", "high", "critical") = "medium"
    }
    outputs: {
      report: "Markdown security report"
      passedCheck: boolean
    }

    # Konfiguracja
    params: {
      compliance: enum("SOC2", "HIPAA", "PCI-DSS") = "SOC2"
    }
    requires: ["code-review"]
    content: """
      Scan provided files for security issues.
      Minimum severity threshold: {{severity}}.
      Compliance framework: {{compliance}}.
    """
  }
}
```

### Roznica: params vs inputs

| Aspekt       | `params`              | `inputs`                                |
| ------------ | --------------------- | --------------------------------------- |
| Kiedy        | Compile-time          | Runtime (opisowe)                       |
| Kto podaje   | Autor .prs            | Agent/uzytkownik wywolujacy skill       |
| Walidacja    | Typowana, egzekwowana | Dokumentacyjna, opcjonalnie egzekwowana |
| Interpolacja | `{{param}}` w tresci  | Nie -- to kontrakt, nie template        |
| Cel          | Konfiguracja wariantu | Opis API skilla                         |

### Skladnia w SKILL.md

```markdown
---
name: security-scan
description: Scan code for security vulnerabilities
inputs:
  files: List of file paths to scan
  severity:
    type: enum
    options: [low, medium, high, critical]
    default: medium
outputs:
  report: Markdown security report
  passedCheck:
    type: boolean
---
```

### Skill composition z kontraktami

```text
@skills {
  lint-check: {
    description: "Run linting"
    outputs: { issues: "List of lint issues" }
  }

  security-scan: {
    description: "Security analysis"
    outputs: { vulnerabilities: "List of CVEs" }
  }

  full-review: {
    description: "Complete review pipeline"
    requires: ["lint-check", "security-scan"]
    outputs: {
      summary: "Aggregated review report"
      passedAll: boolean
    }
    content: """
      1. Run lint-check -> collect issues
      2. Run security-scan -> collect vulnerabilities
      3. Aggregate into summary report
    """
  }
}
```

### Walidacja compile-time

Nowe reguly w `packages/validator/`:

1. Jesli skill deklaruje `requires: ["X"]`, X musi istniec
2. Jesli skill deklaruje `inputs` z typami, typy musza byc poprawne
3. Jesli skill deklaruje `outputs`, content powinien odwolywac sie do nich (warning)
4. Jesli `params` i `inputs` maja ta sama nazwe -> error (kolizja)

### Zmiany w pakietach

| Pakiet       | Plik           | Zmiana                                                            |
| ------------ | -------------- | ----------------------------------------------------------------- |
| `core`       | `types/ast.ts` | Rozszerzenie `SkillDefinition` (z Luki 3) o `inputs?`, `outputs?` |
| `parser`     | `parser.ts`    | Parsowanie `inputs:` / `outputs:` w skill objects                 |
| `resolver`   | `skills.ts`    | Parsowanie inputs/outputs z SKILL.md frontmatter                  |
| `validator`  | nowa regula    | Walidacja kontraktow (typy, kolizje, referencje)                  |
| `formatters` | sekcja skills  | Emitowanie inputs/outputs w dokumentacji skilla                   |

### Enterprise governance -- synergia z policy enforcement (PRZYSZLA FUNKCJA)

**UWAGA:** `@policy` nie istnieje w aktualnym jezyku. Ponizsze przyklady
ilustruja przyszla synergie po implementacji policy enforcement (roadmap sekcja 7).
Nie sa czescia tego spec.

```text
# PRZYKLAD PRZYSZLEJ SKLADNI -- nie implementowane w tym spec
@policy {
  rules: [
    # Kazdy skill MUSI deklarowac outputs
    { require: "skill.outputs", message: "Skills must declare outputs" }

    # Security skille MUSZA miec output passedCheck
    {
      when: { skill: "*security*" }
      require: "skill.outputs.passedCheck"
      type: "boolean"
    }
  ]
}
```

### Autogenerowana dokumentacja z kontraktow

```markdown
## security-scan

Scan code for security vulnerabilities.

**Inputs:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| files | string | (required) | List of file paths to scan |
| severity | enum | medium | low, medium, high, critical |

**Outputs:**
| Name | Type | Description |
|------|------|-------------|
| report | string | Markdown security report |
| passedCheck | boolean | Whether scan passed |

**Requires:** code-review
**Parameters:** compliance (SOC2, HIPAA, PCI-DSS)
```

### Testy -- wymagane 100% pokrycie

| Kategoria   | Zakres                                                                 | Typ testu   |
| ----------- | ---------------------------------------------------------------------- | ----------- |
| Parser      | `inputs:` i `outputs:` w skill objects, wszystkie typy                 | Unit        |
| Parser      | inputs/outputs w SKILL.md frontmatter                                  | Unit        |
| Validator   | Poprawne kontrakty, brakujace wymagane pola                            | Unit        |
| Validator   | Kolizja params/inputs nazw                                             | Unit        |
| Validator   | Warning gdy content nie odwoluje sie do outputs                        | Unit        |
| Resolver    | Parsowanie kontraktow z natywnych SKILL.md                             | Unit        |
| Formatters  | Autogenerowana dokumentacja skilla z kontraktow                        | Unit        |
| Composition | requires + inputs/outputs w zlozonym skillu                            | Integration |
| Policy      | Egzekwowanie reguł na kontraktach (mock)                               | Unit        |
| E2E         | Pelny pipeline: skill z kontraktem -> compile -> output z dokumentacja | E2E         |

### Dokumentacja -- wymagana kompletna

| Dokument                                | Zawartosc                                   |
| --------------------------------------- | ------------------------------------------- |
| `docs/guides/skill-contracts.md`        | Kompletny przewodnik po inputs/outputs      |
| `docs/guides/skill-composition.md`      | Jak komponowac skille z requires            |
| `docs/reference/skill-contract-spec.md` | Formalna specyfikacja kontraktow            |
| Aktualizacja `docs/getting-started.md`  | Sekcja "Skill Contracts"                    |
| README.md update                        | Przyklad skilla z kontraktem                |
| CHANGELOG.md                            | Feature highlight                           |
| Blog post draft                         | `docs/blog/skill-contracts-game-changer.md` |

### Pozycjonowanie jako game changer

**Narracja:** "Skills with contracts. Know what goes in, what comes out. Govern at scale."

Kluczowe przekazy:

- **Dla deweloperow:** "Skill ma inputs i outputs jak funkcja. Wiesz dokladnie co robi bez czytania implementacji."
- **Dla enterprise:** "Policy enforcement na kontraktach -- wymus ze kazdy security skill MUSI miec output passedCheck."
- **Dla decision makerow:** "Autogenerowana dokumentacja kazdego skilla. Zero manualnego utrzymywania docs."

---

## Podsumowanie calosciowe

### Metryki sukcesu

| Luka                 | Metryka                             | Cel                      |
| -------------------- | ----------------------------------- | ------------------------ |
| prs import           | Czas migracji pliku                 | < 1 min (vs 2-4h reczne) |
| prs import           | Pokrycie semantyczne roundtrip      | >= 90%                   |
| Parameterized skills | Redukcja duplikatow skilli          | >= 80%                   |
| Skill folders        | Skilli uzywajacych shared resources | Mierzalne w telemetrii   |
| Skill contracts      | Skilli z deklarowanymi outputs      | Rosnacy trend            |

### Wymagania przekrojowe -- OBOWIAZKOWE

#### Testy (100% pokrycie)

Kazda luka MUSI miec:

- Unit testy dla kazdej publicznej funkcji
- Integration testy dla kazdego pipeline'u (parse -> resolve -> compile -> format)
- E2E testy dla kazdej komendy CLI
- Edge case testy (puste pliki, bledne dane, limity)
- Fixture files dla kazdego obslugiwanego formatu
- Coverage target: >95% lines, >90% branches

#### Dokumentacja (kompletna)

Kazda luka MUSI miec:

- Przewodnik (guide) z przykladami end-to-end
- Dokumentacje referencyjna (skladnia, API)
- Migration guide (jesli zmienia istniejace zachowanie)
- Aktualizacje README.md i getting-started.md
- Wpis w CHANGELOG.md z before/after

#### Pozycjonowanie jako game changer

Kazda luka MUSI miec:

- Blog post draft w `docs/blog/` z narracja game-changer
- Kluczowe przekazy dla 3 audience: deweloperzy, enterprise, decision makers
- Before/after porownanie (metryki, kod, workflow)
- Aktualizacja ROADMAP.md -- przeniesienie z "planned" do "completed"

### Calosciowy impact

| Aspekt              | Przed                            | Po                             |
| ------------------- | -------------------------------- | ------------------------------ |
| Migracja            | 600h recznej pracy / 500-dev org | 15h review                     |
| Duplikacja skilli   | 150 wariantow                    | 1 szablon + parametry          |
| Skill structure     | Inline tekst                     | Pakiety z zasobami             |
| Skill governance    | Zero                             | Kontrakty + policy enforcement |
| Dokumentacja skilli | Reczna                           | Autogenerowana z kontraktow    |

---

## Aktualizacja globalnego SKILL promptscript

Globalny skill PromptScript (`skills/promptscript/SKILL.md`) jest automatycznie
wstrzykiwany do kazdej kompilacji. MUSI byc aktualizowany rownolegle z kazda
luka, aby agenci AI korzystajacy z PromptScript znali nowe mozliwosci.

### Zmiany per luka

#### Po Luce 1 (prs import)

Dodac do SKILL.md:

- Sekcja "## Importing Existing Instructions" z opisem `prs import`
- Przyklad: `prs import CLAUDE.md` -> `.promptscript/project.prs`
- Lista obslugiwanych formatow (Tier 1/2/3)
- Tip: `--dry-run` do podgladu przed konwersja
- Aktualizacja sekcji CLI Commands o `prs import`
- Aktualizacja opisu frontmatter description o "importing existing AI instructions"

#### Po Luce 3 (Parameterized Skills)

Dodac do SKILL.md:

- Rozszerzenie sekcji "@skills" o skladnie `params:`
- Przyklad: skill z `params: { language: string = "typescript" }`
- Przyklad: `{{variable}}` interpolacja w skill content
- Przyklad: params w SKILL.md frontmatter (YAML)
- Aktualizacja sekcji "Block Reference > @skills" o properties: params

#### Po Luce 2 (Skill Folders + Shared Resources)

Dodac do SKILL.md:

- Nowa sekcja "## Skill Folders" z kanoniczna struktura katalogow
- Opis `scripts/`, `references/`, `assets/`, `.skillignore`
- Sekcja "## Shared Resources" z opisem `.promptscript/shared/`
- Przyklad: `@shared/templates/pr-template.md`
- Opis `requires:` property w skill definitions
- Aktualizacja sekcji "Project Organization" o skill folders

#### Po Luce 4 (Skill Contracts)

Dodac do SKILL.md:

- Rozszerzenie sekcji "@skills" o skladnie `inputs:` i `outputs:`
- Przyklad: skill z pelnym kontraktem (inputs, outputs, params, requires)
- Wyjasnienie roznicy params vs inputs
- Opis autogenerowanej dokumentacji
- Przyklad skill composition z kontraktami
- Aktualizacja properties list: inputs, outputs, requires

### Aktualizacja frontmatter description

Aktualny opis:

```
description: >-
  PromptScript language expert for reading, writing, modifying, and
  troubleshooting .prs files. Use when working with PromptScript syntax,
  creating or editing .prs files, adding blocks like @identity, @standards,
  @restrictions, @shortcuts, @skills, or @agents, configuring
  promptscript.yaml, resolving compilation errors, understanding inheritance
  (@inherit) and composition (@use, @extend), or migrating AI instructions
  to PromptScript. Also use when asked about compilation targets (GitHub
  Copilot, Claude Code, Cursor, Antigravity, Factory AI, and 30+ other
  AI coding agents).
```

Po wszystkich lukach, zaktualizowac do:

```
description: >-
  PromptScript language expert for reading, writing, modifying, and
  troubleshooting .prs files. Use when working with PromptScript syntax,
  creating or editing .prs files, adding blocks like @identity, @standards,
  @restrictions, @shortcuts, @skills, or @agents, configuring
  promptscript.yaml, resolving compilation errors, understanding inheritance
  (@inherit) and composition (@use, @extend), importing existing AI
  instructions (prs import), parameterizing skills with typed parameters,
  composing skills with contracts (inputs/outputs/requires), managing
  skill folders with shared resources, or migrating AI instructions to
  PromptScript. Also use when asked about compilation targets (GitHub
  Copilot, Claude Code, Cursor, Antigravity, Factory AI, and 30+ other
  AI coding agents).
```

### Synchronizacja kopii

SKILL.md istnieje w wielu lokalizacjach (synchronizowane przez `pnpm skill:check`):

- `skills/promptscript/SKILL.md` -- zrodlo prawdy
- `.claude/skills/promptscript/SKILL.md` -- kopia
- `.promptscript/skills/promptscript/SKILL.md` -- kopia
- `packages/cli/skills/promptscript/SKILL.md` -- kopia (bundled z CLI)

Po kazdej aktualizacji zrodla: `pnpm skill:check` musi przechodzic.

### Testy SKILL.md

| Kategoria          | Zakres                                                  | Typ testu             |
| ------------------ | ------------------------------------------------------- | --------------------- |
| Sync check         | Wszystkie kopie SKILL.md sa identyczne                  | CI (pnpm skill:check) |
| Content validation | SKILL.md zawiera sekcje o nowych funkcjach              | Unit (grep-based)     |
| Frontmatter        | Description zawiera nowe keywords                       | Unit                  |
| Compile test       | SKILL.md kompiluje sie poprawnie do wszystkich targetow | Integration           |
