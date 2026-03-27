# PromptScript vs Ręczne Zarządzanie Promptami

## Porównanie punkt po punkcie

### Spójność instrukcji między projektami

Ręcznie: każdy projekt ma swoją wersję instrukcji, kopiowaną z innego projektu i modyfikowaną na miejscu. Po kilku miesiącach wersje się rozjeżdżają, nikt nie wie która jest aktualna.
PromptScript: wszystkie projekty dziedziczą z jednego źródła standardów. Zmiana w jednym miejscu propaguje się wszędzie.

### Dopasowanie do narzędzia AI

Ręcznie: ten sam tekst wklejany do Copilota, Claude Code, Factory AI i Gemini. Każde narzędzie ma inną strukturę promptów i inny model za sobą, ale dostaje ten sam generyczny tekst.
PromptScript: kompiluje instrukcje do natywnego formatu każdego narzędzia, zoptymalizowane pod jego strukturę i specyfikę modelu.

### Zmiana narzędzia AI

Ręcznie: przejście z Copilota na Gemini oznacza przepisanie promptów w każdym repozytorium, aktualizację README i dokumentacji. Tygodnie pracy.
PromptScript: zmiana targetu w konfiguracji i przebudowanie. Minuty.

### Aktualizacja standardów organizacji

Ręcznie: zmiana polityki bezpieczeństwa oznacza ręczne aktualizowanie instrukcji w dziesiątkach repozytoriów. Dziesiątki pull requestów, miesiące zanim wszędzie dotrze.
PromptScript: jedna zmiana w rejestrze, automatyczna propagacja do wszystkich projektów przy następnej kompilacji.

### Synchronizacja z wersją frameworków

Ręcznie: projekt migruje z Jest na Vitest, ale instrukcje AI dalej mówią o Jest. Nikt nie pamiętał, żeby zaktualizować prompty.
PromptScript: instrukcje to kod, żyją w tym samym repozytorium i zmieniają się razem z projektem.

### Walidacja

Ręcznie: brak walidacji. Błędy w promptach odkrywane dopiero gdy AI generuje kod niezgodny z oczekiwaniami.
PromptScript: walidacja na etapie kompilacji i w pipeline CI/CD. Błędne instrukcje nie przejdą merge'a.

### Onboarding nowego projektu

Ręcznie: ktoś kopiuje instrukcje z innego projektu, modyfikuje na oko, zapomina o połowie standardów zespołu.
PromptScript: prs init, dziedziczenie ze standardów zespołu, dodanie lokalnego kontekstu. Gwarancja, że projekt startuje ze wszystkimi standardami organizacji.

## Analogia

PromptScript jest dla instrukcji AI tym, czym Terraform jest dla infrastruktury chmurowej. Terraform oddziela deklarację infrastruktury od providera. PromptScript oddziela treść instrukcji od formatu narzędzia.

Tak jak w Terraform nie przepisujesz konfiguracji przy zmianie z AWS na GCP, tak w PromptScript nie przepisujesz promptów przy zmianie z GitHub Copilot na Gemini. Deklarujesz CO chcesz, narzędzie zajmuje się JAK.
