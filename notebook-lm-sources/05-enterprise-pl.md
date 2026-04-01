# PromptScript w Skali Enterprise

## Architektura Organizacyjna

PromptScript został zaprojektowany z myślą o organizacjach, w których dziesiątki projektów korzystają z narzędzi AI takich jak GitHub Copilot, Claude Code, Factory AI i Gemini. Bez centralnego zarządzania instrukcje w tych projektach szybko się rozjeżdżają. Architektura trójpoziomowa rozwiązuje ten problem.

### Poziom 1: Organizacja

Centralny rejestr definiuje globalne standardy: polityki bezpieczeństwa, wymogi compliance, ogólne konwencje kodowania. Utrzymywany przez zespół platform lub security. Każdy zespół i projekt w organizacji automatycznie dziedziczy te standardy, niezależnie od tego, czy używa Copilota, Claude Code, Factory AI czy Gemini.

### Poziom 2: Zespoły

Zespoły (frontend, backend, mobile, data) dziedziczą z poziomu organizacji i dodają standardy specyficzne dla swojej domeny. Zespół backendowy może wymagać konkretnych wzorców architektonicznych i frameworków. Zespół frontendowy może narzucić standard komponentów i narzędzi testowych. Liderzy techniczni zarządzają tym poziomem.

### Poziom 3: Projekty

Pojedyncze repozytoria dziedziczą z poziomu zespołu i doprecyzowują instrukcje: specyficzna architektura serwisu, wersje frameworków i bibliotek, lokalne komendy. To eliminuje sytuację, w której każdy projekt ma bezrefleksyjnie skopiowane instrukcje z innego projektu.

## Governance i Compliance

Centralnie zarządzane standardy to kluczowa wartość dla enterprise. Zespół security aktualizuje politykę bezpieczeństwa w jednym miejscu w centralnym rejestrze. Zmiana automatycznie propaguje się do instrukcji AI w każdym repozytorium i każdym narzędziu, bez interwencji zespołów projektowych. Nie ma ryzyka, że jeden projekt pracuje ze starą wersją standardów.

Każda zmiana w instrukcjach jest wersjonowana w Git. Można prześledzić kto, kiedy i dlaczego zmienił dowolny standard. To istotne dla organizacji podlegających audytom i regulacjom.

Pipeline CI/CD może walidować, czy instrukcje AI w każdym repozytorium są zgodne z aktualnymi standardami organizacji. Merge z niepoprawnymi lub nieaktualnymi instrukcjami nie przejdzie.

Pliki lockfile gwarantują, że build jest powtarzalny. Aktualizacje standardów centralnych mogą wymagać świadomej aktualizacji lockfile'a przez zespół projektowy, co daje kontrolę nad tempem adopcji zmian.

## Prywatne Rejestry

Organizacje mogą hostować rejestry na prywatnych repozytoriach Git. Instrukcje i prompty firmowe nigdy nie opuszczają infrastruktury organizacji. Rejestry wspierają namespaces, wersjonowanie i kontrolę dostępu przez standardowe mechanizmy Git. Tryb vendor pozwala na budowanie w środowiskach air-gapped bez dostępu do sieci.

## Typowy scenariusz wdrożenia

1. Zespół platform tworzy centralny rejestr z globalnymi standardami bezpieczeństwa i kodowania.
2. Liderzy techniczni zespołów definiują standardy zespołowe dziedziczące z centralnego rejestru, dopasowane do frameworków i narzędzi używanych przez zespół.
3. Projekty konfigurują promptscript.yaml, wskazują na rejestr zespołowy i dodają lokalny kontekst: architekturę, wersje frameworków, specyficzne komendy.
4. Pipeline CI/CD waliduje zgodność instrukcji przy każdym pull request.
5. Aktualizacje standardów centralnych są propagowane kontrolowanie, z wersjonowaniem i lockfile'ami.

Efekt: dziesiątki lub setki repozytoriów z gwarantowaną spójnością instrukcji AI. Każde narzędzie, GitHub Copilot, Claude Code, Factory AI czy Gemini, dostaje prompty w swoim natywnym formacie, zoptymalizowane pod swój model, a jednocześnie spójne treściowo z resztą organizacji.
