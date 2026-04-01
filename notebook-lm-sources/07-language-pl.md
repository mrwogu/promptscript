# Język PromptScript w Pigułce

## Struktura pliku .prs

Każdy plik .prs zaczyna się od bloku @meta z identyfikatorem i wersją składni. Następnie zawiera bloki definiujące różne aspekty instrukcji dla AI.

## Główne bloki

@meta to metadane pliku: identyfikator projektu, wersja składni i opcjonalne parametry do szablonów.

@identity definiuje kim jest AI w kontekście tego projektu. Na przykład "Jesteś ekspertem od backendowej architektury pracującym nad serwisem płatności." Określa rolę i perspektywę AI.

@context to kontekst projektowy: języki programowania, frameworki, architektura, zależności. Daje AI wiedzę o środowisku w którym pracuje.

@standards to standardy kodowania: styl, konwencje nazewnictwa, wzorce architektoniczne, wymagania testowe. Definiuje co AI powinno robić.

@restrictions to ograniczenia: czego AI nie powinno robić. Na przykład: nigdy nie używaj typu any, nie commituj bez testów, nie eksponuj kluczy API.

@shortcuts to komendy które użytkownik może wywoływać. Na przykład /review uruchamia przegląd kodu, /test generuje testy, /deploy wdraża na produkcję.

@skills definiuje reusable umiejętności AI z opisem, dozwolonymi narzędziami i zasobami.

@agents to definicje subagentów AI ze specyficznymi rolami i narzędziami.

@guards to reguły kontekstowe aktywowane dla konkretnych plików lub katalogów.

@knowledge to odniesienia do dokumentacji, API i specyfikacji.

## Kompozycja i dziedziczenie

@inherit pozwala dziedziczyć z innego pliku .prs. Projekt dziedziczy wszystkie bloki z rodzica i może je rozszerzać lub nadpisywać.

@use to import fragmentu. Pozwala składać instrukcje z mniejszych, reusable kawałków. Można importować z lokalnych plików lub z rejestru Git.

@extend modyfikuje odziedziczone wartości bez nadpisywania całości.

## Przykład kompletnego pliku

```
@meta { id: "api-service" syntax: "1.0.0" }

@inherit @company/backend-standards
@use @fragments/testing
@use @fragments/security

@identity {
  """
  You are a senior backend engineer working on the REST API service.
  The service uses Express.js with TypeScript and PostgreSQL.
  """
}

@standards {
  code: {
    languages: ["TypeScript"]
    testing: ["Vitest", ">90% coverage"]
  }
}

@restrictions {
  - "Never use any type"
  - "Never expose database credentials"
  - "Always validate request input"
}

@shortcuts {
  "/review": "Code review focused on security and performance"
  "/test": "Generate unit tests for the current file"
}
```

Ten jeden plik kompiluje się do natywnych formatów wybranych narzędzi. GitHub Copilot dostaje markdown w swoim formacie. Cursor dostaje plik .mdc z metadanymi. Claude Code dostaje CLAUDE.md. Każdy format jest idiomatyczny dla danego narzędzia.
