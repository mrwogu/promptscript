# PromptScript jako Menadżer Skilli AI

## Skills - czym są i dlaczego to ważne

Nowoczesne narzędzia AI do kodowania wspierają koncepcję "skilli" - gotowych instrukcji, które AI wykonuje na polecenie użytkownika. Claude Code ma .claude/skills/, GitHub Copilot ma .github/skills/, Cursor ma swój format. Problem jest taki sam jak z instrukcjami ogólnymi: każde narzędzie oczekuje innego formatu, w innej lokalizacji.

PromptScript rozwiązuje ten problem, działając jako centralny menadżer skilli. Definiujesz skill raz, a PromptScript kompiluje go do natywnego formatu każdego narzędzia. Ale to nie wszystko - PromptScript daje też pełen ekosystem do odkrywania, instalowania, aktualizowania i współdzielenia skilli.

## Cztery sposoby ładowania skilli

### 1. Import z Git przez @use (główna metoda)

Najważniejszy sposób to import skilli bezpośrednio z repozytoriów Git. Składnia jest wzorowana na Go modules:

```
@use github.com/anthropics/skills/commit@1.0.0
```

Możesz importować pliki SKILL.md z dowolnego publicznego lub prywatnego repozytorium Git. PromptScript automatycznie rozpoznaje typ importowanego pliku - czy to skill z frontmatterem YAML, fragment .prs, czy surowy markdown do bazy wiedzy.

Wersjonowanie wspiera dokładne tagi, zakresy semantyczne (jak @^1.0.0) i gałęzie (jak @main). Lockfile gwarantuje powtarzalność buildów.

### 2. CLI do zarządzania skillami (prs skills)

PromptScript ma wbudowany CLI do zarządzania skillami:

Komenda prs skills add dodaje skill z repozytorium Git do pliku .prs i aktualizuje lockfile. Na przykład prs skills add github.com/anthropics/skills/commit@1.0.0 doda dyrektywę @use do pliku źródłowego i zapisze dokładny commit w lockfile.

Komenda prs skills remove usuwa skill z pliku .prs i lockfile'a. Wspiera dopasowanie po częściowej nazwie.

Komenda prs skills list wyświetla wszystkie zainstalowane skille.

Komenda prs skills update aktualizuje skille do najnowszych wersji. Można aktualizować wszystkie naraz lub wybrany skill po nazwie.

### 3. Lokalne skille (katalog .promptscript/skills/)

Skille można też definiować lokalnie w projekcie, w katalogu .promptscript/skills/. Każdy podkatalog z plikiem SKILL.md jest automatycznie odkrywany i kompilowany. Nie trzeba niczego konfigurować.

Lokalne skille mają najwyższy priorytet i nadpisują skille z rejestru o tej samej nazwie. To pozwala na tworzenie projektowych wersji wspólnych skilli.

### 4. Uniwersalny katalog .agents/skills/

Istnieje też katalog .agents/skills/, który działa jako katalog współdzielony. Można do niego instalować skille narzędziem npx skills lub ręcznie. PromptScript automatycznie skanuje ten katalog i włącza znalezione skille do kompilacji.

## Auto-discovery z zewnętrznych repozytoriów

PromptScript potrafi automatycznie odkrywać skille w importowanych repozytoriach, nawet jeśli te repozytoria nie wiedzą o PromptScript. Jeśli repozytorium zawiera pliki SKILL.md, .claude/agents/, .claude/commands/ lub .github/skills/, PromptScript automatycznie je rozpozna i zsyntetyzuje jako fragmenty .prs.

To oznacza, że autor skilla dla Claude Code nie musi znać PromptScript. Wystarczy że opublikuje SKILL.md w swoim repozytorium, a użytkownicy PromptScript mogą go zaimportować jedną linijką.

## Pliki zasobów przy skillach

Skille mogą zawierać pliki zasobów: skrypty Python, dane CSV, szablony JSON, pliki konfiguracyjne. Wszystkie pliki obok SKILL.md są automatycznie odkrywane i kopiowane do katalogów docelowych wszystkich 37 narzędzi AI.

Na przykład skill do projektowania UI może zawierać plik colors.csv z paletą kolorów i skrypt search.py do przeszukiwania wzorców. PromptScript skopiuje te pliki do .claude/skills/ui-design/, .cursor/skills/ui-design/ i pozostałych 35 lokalizacji.

Obowiązują limity bezpieczeństwa: maksymalnie 1 MB na plik, 10 MB na skill, 100 plików. Pliki systemowe (.env, node_modules, lock files) są automatycznie pomijane.

## Kontrakty wejścia/wyjścia

Skille mogą definiować formalne kontrakty opisujące, jakie dane przyjmują i co zwracają. Kontrakt definiuje się w frontmatterze YAML pliku SKILL.md:

Dane wejściowe (inputs) opisują co skill potrzebuje do działania, na przykład listę plików do przeskanowania albo minimalny poziom severity. Dane wyjściowe (outputs) opisują co skill produkuje, na przykład raport w markdown albo flagę boolean czy skan przeszedł.

Typy wspierane w kontraktach to string, number, boolean i enum z predefiniowanymi opcjami. PromptScript waliduje kontrakty na etapie kompilacji.

## Parametryzowane skille

Skille mogą przyjmować parametry, które są interpolowane w czasie kompilacji. Na przykład skill test-generator może przyjmować parametry language, framework i coverage. Każdy projekt może użyć tego samego skilla z innymi wartościami parametrów.

## Skill jako komenda użytkownika

Skille mogą być oznaczone jako userInvocable, co oznacza że użytkownik może je wywołać komendą, na przykład /deploy lub /commit. Można też ograniczyć narzędzia dostępne dla skilla (allowedTools) i zdefiniować zależności między skillami (requires).

## Rejestr skilli

Organizacje mogą tworzyć wewnętrzne rejestry skilli na prywatnych repozytoriach Git. Rejestr może zawierać manifest z katalogiem skilli, tagami, opisami i wskazówkami do auto-detekcji. Zespoły mogą przeglądać dostępne skille, a PromptScript może sugerować skille na podstawie zależności projektu.

## Podsumowanie

PromptScript nie jest tylko kompilatorem instrukcji AI. To pełnoprawny menadżer skilli, który łączy odkrywanie, instalowanie, wersjonowanie, walidowanie i dystrybucję skilli AI w jednym narzędziu. Napisz skill raz, zarządzaj nim centralnie, kompiluj do 37 narzędzi.
