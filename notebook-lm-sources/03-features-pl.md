# Kluczowe Funkcje PromptScript

## Kompilacja do 37 narzędzi AI

PromptScript kompiluje instrukcje do natywnych formatów promptów 37 narzędzi AI. Główne cele to GitHub Copilot, Claude Code, Factory AI i Gemini. Dodatkowo wspierane są Cursor, OpenCode, Antigravity, Windsurf, Cline, Roo Code, Codex, Continue, Augment, Goose, Kilo Code, Amp, Trae, Junie, Kiro CLI i wiele innych.

Nie chodzi o to, żeby kompilować do wszystkich 37 naraz. W konfiguracji wybierasz narzędzia, których używa twoja organizacja. Typowa firma kompiluje do 2-3 narzędzi. Ale jeśli jutro firma zdecyduje się przetestować Gemini obok Copilota, dodanie nowego narzędzia to jedna linijka w konfiguracji. PromptScript zadba o to, żeby Gemini dostał instrukcje w swoim formacie i strukturze, zoptymalizowane pod jego model.

## Hierarchiczne Dziedziczenie

To odpowiedź na problem bezrefleksyjnego copy-paste instrukcji z projektu do projektu. PromptScript pozwala budować hierarchie instrukcji jak w kodzie obiektowym.

Organizacja definiuje globalne standardy, na przykład polityki bezpieczeństwa i ogólne konwencje kodowania. Zespoły dziedziczą z organizacji i dodają swoje wymagania, na przykład zespół backendowy dodaje wzorce architektoniczne. Projekty dziedziczą z zespołu i doprecyzowują kontekst, na przykład podają szczegóły konkretnego serwisu.

Zmiana na poziomie organizacji automatycznie propaguje się w dół. Nie trzeba ręcznie aktualizować trzydziestu repozytoriów.

## Parametryzowane Szablony

Szablony mogą przyjmować parametry, jak w Infrastructure as Code. Definiujesz szablon @stacks/typescript-service z parametrami takimi jak projectName, framework i port. Każdy projekt może użyć tego szablonu z własnymi wartościami. Szablony eliminują sytuację, w której każdy projekt ma trochę inną wersję tych samych instrukcji.

## Rejestr i Importy

PromptScript ma system rejestrów wzorowany na Go modules. Importujesz instrukcje z dowolnego repozytorium Git przez URL lub krótki alias. Organizacja konfiguruje aliasy raz, na przykład @company wskazuje na repozytorium ze standardami firmowymi. Od tego momentu każdy projekt importuje wspólne standardy jedną linijką.

Pliki lockfile gwarantują powtarzalność buildów. Tryb vendor umożliwia budowanie offline i w środowiskach bez dostępu do sieci.

## Migracja z Istniejących Instrukcji

Komenda prs init --migrate automatycznie wykrywa istniejące instrukcje AI, na przykład CLAUDE.md, pliki Copilota czy instrukcje Cursora, i konwertuje je do formatu .prs z pomocą AI. Nie trzeba zaczynać od zera. Istniejące prompty zostają zachowane i zunifikowane w jednym źródle.

## Walidacja i CI/CD

PromptScript waliduje instrukcje na etapie kompilacji. Wyłapuje błędy, niespójności i odwołania do nieistniejących zasobów zanim instrukcje trafią do narzędzi AI. Obraz Docker pozwala walidować instrukcje w dowolnym pipeline CI/CD, gwarantując że żaden merge nie przejdzie z niepoprawnymi promptami.

## Watch Mode

Tryb watch (prs compile --watch) automatycznie rekompiluje przy każdej zmianie pliku źródłowego. Edytujesz plik .prs, a instrukcje dla GitHub Copilot, Claude Code, Factory AI i reszty aktualizują się natychmiast.

## Wbudowana Umiejętność Językowa

AI agenty automatycznie uczą się składni PromptScript dzięki wstrzykiwanemu plikowi SKILL.md. Agent wie jak pisać i edytować pliki .prs, więc pomaga tworzyć instrukcje bez konieczności pamiętania składni.
