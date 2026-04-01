# Problem: Chaos w instrukcjach AI w organizacjach

## Realna skala problemu

Narzędzia AI do kodowania, takie jak GitHub Copilot, Claude Code, Factory AI czy Gemini, działają tak dobrze, jak dobre są instrukcje, które im damy. Problem w tym, że w organizacjach z dziesiątkami projektów te instrukcje szybko wymykają się spod kontroli.

Każdy projekt ma swoje prompty. Ktoś napisał instrukcje dla jednego repozytorium, ktoś inny skopiował je do drugiego i trochę zmienił, trzecia osoba wzięła starą wersję i dostosowała po swojemu. Po kilku miesiącach w organizacji krążą dziesiątki wersji instrukcji, każda trochę inna, żadna nieaktualna w stu procentach, żadna w stu procentach aktualna.

## Główne problemy

### Rozjeżdżanie się instrukcji między projektami

Firma ma dwadzieścia, trzydzieści repozytoriów. Każde ma swoje instrukcje dla AI. Ktoś aktualizuje standardy kodowania w jednym projekcie, ale pozostałe dalej używają starych wersji. Ktoś zmienia wymagania testowe, ale tylko w swoim repozytorium. Z czasem instrukcje w różnych projektach opowiadają różne historie. Nie ma jednego źródła prawdy, jest bezrefleksyjny copy-paste z projektu do projektu.

### Instrukcje niedopasowane do wersji narzędzi

Projekt migruje z Jest na Vitest, ale instrukcje AI wciąż każą pisać testy w Jest. Framework zaktualizowano do nowej wersji z innymi API, ale prompty odnoszą się do starego API. Instrukcje nie żyją razem z kodem, więc się od niego oddalają.

### Różne struktury promptów w różnych narzędziach

GitHub Copilot oczekuje promptów w zupełnie innej strukturze niż Claude Code, Factory AI czy Gemini. Każde narzędzie ma swój format, swoją konwencję, swoje możliwości. Prompt napisany pod Copilota nie zadziała optymalnie w Claude Code, bo te narzędzia mają różne sposoby interpretowania instrukcji.

Do tego dochodzą różnice w modelach stojących za tymi narzędziami. Ten sam prompt może być świetnie interpretowany przez jeden model, a słabo przez inny. Instrukcje powinny być dostosowane do specyfiki każdego narzędzia i modelu, ale w praktyce nikt nie ma na to czasu i wszędzie wrzuca ten sam tekst.

### Brak standardów i walidacji

Nie istnieje żaden mechanizm sprawdzania, czy instrukcje AI w projekcie są poprawne, aktualne i spójne z resztą organizacji. Błędy w promptach odkrywane są dopiero gdy AI generuje kod niezgodny z oczekiwaniami, a wtedy programista traci czas na debugowanie problemu, którego źródłem są złe instrukcje.

### Brak hierarchii i dziedziczenia

Organizacja ma standardy bezpieczeństwa, zespół ma swoje konwencje, projekt ma swoją specyfikę. Ale nie ma mechanizmu, który pozwoliłby budować instrukcje warstwowo, z dziedziczeniem z poziomu organizacji przez zespół do projektu. Zamiast tego każdy projekt zaczyna od zera lub kopiuje z innego projektu, tracąc kontekst.

## Dlaczego to się pogarsza

Im więcej projektów w organizacji, tym trudniej utrzymać spójność. Im więcej narzędzi AI na rynku, tym więcej formatów promptów do obsłużenia. A presja na jakość instrukcji rośnie, bo narzędzia AI stają się coraz ważniejszą częścią procesu wytwarzania oprogramowania.
