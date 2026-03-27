# Szybki Start z PromptScript

## Trzy komendy do startu

Instalacja i pierwsze użycie PromptScript zajmuje minuty.

Krok 1: Instalacja. npm install -g @promptscript/cli

Krok 2: Inicjalizacja. Komenda prs init automatycznie wykrywa stos technologiczny projektu (język, framework, narzędzia) i generuje plik .prs z odpowiednimi ustawieniami.

Krok 3: Kompilacja. Komenda prs compile generuje natywne pliki konfiguracyjne dla wszystkich skonfigurowanych narzędzi AI.

## Alternatywy instalacji

Docker: Dla CI/CD lub środowisk bez Node.js wystarczy docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile.

Playground online: Można wypróbować PromptScript w przeglądarce bez instalacji na stronie getpromptscript.dev/playground.

## Migracja z istniejących plików

Jeśli projekt już ma pliki CLAUDE.md, .cursorrules lub copilot-instructions.md, komenda prs init --migrate automatycznie je wykryje i skonwertuje do formatu .prs z pomocą AI. Istniejące instrukcje zostają zachowane i zunifikowane w jednym źródle. Nie trzeba zaczynać od zera.

## Co dalej po pierwszej kompilacji

Skonfigurowanie watch mode (prs compile --watch) do automatycznej rekompilacji przy każdej zmianie. Podłączenie walidacji do pipeline CI/CD. Stworzenie rejestru zespołowego ze wspólnymi standardami. Dodanie skills dla często wykonywanych zadań takich jak code review, deployment czy generowanie testów.

## Open Source

PromptScript jest projektem open source na licencji MIT. Kod źródłowy, dokumentacja i issue tracker dostępne na GitHubie. Strona projektu: getpromptscript.dev. Aktualnie wspierane 37 narzędzi AI z aktywnym rozwojem i regularnym dodawaniem nowych.
