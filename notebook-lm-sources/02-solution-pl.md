# PromptScript: Jedno Źródło Instrukcji, Każde Narzędzie AI

## Czym jest PromptScript

PromptScript to język i zestaw narzędzi do standaryzacji instrukcji AI w organizacjach. Działa jak Terraform, ale zamiast infrastruktury zarządza promptami i instrukcjami dla narzędzi AI do kodowania.

Zasada jest prosta: piszesz instrukcje raz w formacie .prs, opisując CO chcesz powiedzieć narzędziu AI. PromptScript kompiluje to do natywnych promptów dostosowanych do specyfiki każdego narzędzia, takiego jak GitHub Copilot, Claude Code, Factory AI czy Gemini. Każde narzędzie dostaje instrukcje w swoim formacie, w swojej strukturze, zoptymalizowane pod swój model.

## Jak to działa

Zamiast kopiować te same instrukcje z projektu do projektu i ręcznie dostosowywać do każdego narzędzia, tworzysz jeden plik źródłowy:

```
@meta { id: "checkout-service" syntax: "1.0.0" }

@inherit @company/backend-security

@identity {
  """
  You are an expert Backend Engineer working on the Checkout Service.
  This service handles payments using hexagonal architecture.
  """
}

@standards {
  code: {
    languages: ["TypeScript"]
    testing: ["Vitest", ">90% coverage"]
  }
}

@shortcuts {
  "/review": "Security-focused code review"
  "/test": "Write unit tests with Vitest"
}
```

Komenda prs compile generuje natywne prompty dla każdego skonfigurowanego narzędzia. Claude Code dostaje CLAUDE.md w strukturze, jakiej oczekuje. GitHub Copilot dostaje copilot-instructions.md w swoim formacie. Factory AI dostaje AGENTS.md z definicjami droidów. Gemini dostaje GEMINI.md. Każde narzędzie dostaje instrukcje zoptymalizowane pod siebie, nie generyczny tekst wklejony wszędzie tak samo.

## Kluczowe scenariusze

### Spójność w organizacji

Firma ma trzydzieści repozytoriów. Zamiast kopiować instrukcje między nimi, każdy projekt dziedziczy ze wspólnych standardów organizacji i zespołu, dodając tylko swój lokalny kontekst. Zmiana standardu w jednym miejscu propaguje się do wszystkich projektów.

### Zmiana narzędzia

Firma przechodzi z GitHub Copilot na Gemini. Zamiast przepisywać prompty w każdym repozytorium, zmieniasz target w konfiguracji i przebudowujesz. PromptScript wygeneruje prompty w strukturze, jakiej oczekuje Gemini. Minuty zamiast tygodni.

### Instrukcje zsynchronizowane z kodem

Projekt migruje z Jest na Vitest. Aktualizujesz to w pliku .prs, kompilacja generuje nowe instrukcje, AI od razu wie o nowym frameworku. Instrukcje żyją razem z kodem, bo są kodem.

## Kluczowa wartość

PromptScript rozdziela treść instrukcji od formatu docelowego i specyfiki narzędzia. Piszesz CO AI powinno wiedzieć o twoim projekcie. PromptScript zajmuje się JAK to zakomunikować w sposób optymalny dla GitHub Copilot, Claude Code, Factory AI, Gemini i 33 pozostałych narzędzi. Każde narzędzie i model za nim stojący dostaje instrukcje w formie, którą najlepiej rozumie.
