# Metodyka audytu

## Data audytu

2026-03-20

## Zakres

Wszystkie 11 pakietow monorepo PromptScript, cala dokumentacja w docs/, root-level docs.

## Podejscie

Hybrydowe: automatyczne zbieranie danych + manualna analiza przez subagenty AI.

## Skala oceny

| Ocena | Znaczenie                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| PASS  | Dokumentacja aktualna, funkcje dzialaja zgodnie z kontraktem, testy pokrywaja publiczne API                         |
| WARN  | Drobne rozbieznosci (nieaktualne opisy, brak edge-case testow), ale nic krytycznego                                 |
| FAIL  | Dokumentacja opisuje cos co nie istnieje, funkcja nie dziala zgodnie z deklaracja, brak testow na krytyczne sciezki |

## Priorytetyzacja findings

| Priorytet     | Znaczenie                        | Kryterium                                                        |
| ------------- | -------------------------------- | ---------------------------------------------------------------- |
| P0 - Critical | Blokuje release / bezpieczenstwo | Funkcja nie dziala, security issue, crash path                   |
| P1 - High     | Wplyw na uzytkownikow            | Bledna dokumentacja user-facing, brakujacy eksport, zlamany flow |
| P2 - Medium   | Dlug techniczny                  | Dead code, brakujace testy edge-case, nieaktualne README         |
| P3 - Low      | Kosmetyczne                      | Literowki, drobne niespojnosci stylu                             |

## Glebokosc audytu per pakiet

| Pakiet           | Glebokosc |
| ---------------- | --------- |
| core             | Srednia   |
| parser           | Srednia   |
| resolver         | Srednia   |
| validator        | Srednia   |
| compiler         | Pelna     |
| formatters       | Pelna     |
| cli              | Pelna     |
| importer         | Srednia   |
| browser-compiler | Lekka     |
| playground       | Lekka     |
| server           | Lekka     |

## Narzedzia automatyczne

- pnpm run test (Vitest + coverage)
- pnpm run typecheck (TypeScript strict)
- pnpm run lint (ESLint)
- pnpm prs validate --strict
- pnpm schema:check
- pnpm skill:check
- pnpm docs:formatters:check
- Skrypty bash: eksporty, dead code, broken links
- Skrypt Node.js: coverage gaps per function
