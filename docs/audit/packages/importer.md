# Audyt: @promptscript/importer

Data audytu: 2026-03-20
Glebokosc: SREDNIA (publiczne eksporty z index.ts)

## Ocena zbiorcza: PASS

Pakiet jest w dobrym stanie: brak bledow typecheck, wszystkie testy przechodza, kazdy publiczny eksport ma testy pokrywajace happy path. Drobne braki w dokumentacji README (2 eksporty nieudokumentowane w sekcji API).

---

## 1. Publiczne eksporty z index.ts

| #   | Eksport              | Typ      | Zrodlo        |
| --- | -------------------- | -------- | ------------- |
| 1   | `importFile`         | function | importer.ts   |
| 2   | `ImportOptions`      | type     | importer.ts   |
| 3   | `ImportResult`       | type     | importer.ts   |
| 4   | `detectFormat`       | function | detector.ts   |
| 5   | `getParser`          | function | detector.ts   |
| 6   | `DetectedFormat`     | type     | detector.ts   |
| 7   | `classifyConfidence` | function | confidence.ts |
| 8   | `ConfidenceLevel`    | enum     | confidence.ts |
| 9   | `ScoredSection`      | type     | confidence.ts |
| 10  | `mapSections`        | function | mapper.ts     |
| 11  | `emitPrs`            | function | emitter.ts    |
| 12  | `EmitOptions`        | type     | emitter.ts    |
| 13  | `validateRoundtrip`  | function | roundtrip.ts  |
| 14  | `RoundtripResult`    | type     | roundtrip.ts  |

Uwaga: automated-results.md (sekcja 7) wymienia 7 named exports, ale pomija `validateRoundtrip` i `EmitOptions`. Faktycznie jest 8 eksportow funkcji/enum + 6 typow = 14 pozycji.

## 2. Dokumentacja w README

| Eksport              | Udokumentowany w README?                          | Ocena |
| -------------------- | ------------------------------------------------- | ----- |
| `importFile`         | Tak (sekcja API + przyklad programmatic)          | PASS  |
| `detectFormat`       | Tak (sekcja API)                                  | PASS  |
| `getParser`          | Nie                                               | WARN  |
| `classifyConfidence` | Nie                                               | WARN  |
| `ConfidenceLevel`    | Nie (ale opisany w tabeli Section Classification) | WARN  |
| `mapSections`        | Tak (sekcja API)                                  | PASS  |
| `emitPrs`            | Tak (sekcja API)                                  | PASS  |
| `validateRoundtrip`  | Tak (sekcja API + przyklad)                       | PASS  |

Ocena: **WARN** -- `getParser` i `classifyConfidence` sa eksportowane publicznie, ale nie maja wpisow w sekcji API README. Sa to pomocnicze funkcje publicznego API; brak dokumentacji moze utrudnic uzycie przez zewnetrznych konsumentow.

## 3. Zgodnosc implementacji z deklaracja typow

| Eksport              | Sygnatura zgodna?                                                                                           | Ocena |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| `importFile`         | `(filepath: string, options?: ImportOptions) => Promise<ImportResult>` -- zgodna                            | PASS  |
| `detectFormat`       | `(filepath: string) => DetectedFormat` -- zgodna                                                            | PASS  |
| `getParser`          | `(format: string) => FormatParser` -- zgodna (uwaga: FormatParser nie jest eksportowany)                    | PASS  |
| `classifyConfidence` | `(score: number) => ConfidenceLevel` -- zgodna                                                              | PASS  |
| `mapSections`        | `(sections: MarkdownSection[]) => ScoredSection[]` -- zgodna (uwaga: MarkdownSection nie jest eksportowany) | WARN  |
| `emitPrs`            | `(sections: ScoredSection[], options: EmitOptions) => string` -- zgodna                                     | PASS  |
| `validateRoundtrip`  | `(filepath: string) => Promise<RoundtripResult>` -- zgodna                                                  | PASS  |

Ocena: **WARN** -- typy `FormatParser` i `MarkdownSection` sa uzywane w sygnaturach publicznych funkcji, ale nie sa eksportowane z index.ts. Zewnetrzny konsument nie moze skonstruowac poprawnych argumentow dla `getParser` (zwraca nieeksportowany typ) ani `mapSections` (przyjmuje nieeksportowany typ).

## 4. Pokrycie testami (happy path)

| Eksport              | Plik testowy                 | Happy path? | Ocena |
| -------------------- | ---------------------------- | ----------- | ----- |
| `importFile`         | importer.spec.ts (8 testow)  | Tak         | PASS  |
| `detectFormat`       | detector.spec.ts (6 testow)  | Tak         | PASS  |
| `getParser`          | detector.spec.ts (5 testow)  | Tak         | PASS  |
| `classifyConfidence` | confidence.spec.ts (3 testy) | Tak         | PASS  |
| `ConfidenceLevel`    | confidence.spec.ts           | Tak         | PASS  |
| `mapSections`        | mapper.spec.ts (13 testow)   | Tak         | PASS  |
| `emitPrs`            | emitter.spec.ts (11 testow)  | Tak         | PASS  |
| `validateRoundtrip`  | roundtrip.spec.ts (6 testow) | Tak         | PASS  |

Ocena: **PASS** -- kazdy publiczny eksport ma testy pokrywajace happy path. Testy obejmuja rowniez edge cases (pusty plik, nieznany format, puste tablice sekcji).

## 5. Uzycie przez inne pakiety

| Eksport              | Uzywany w monorepo?                                        | Ocena |
| -------------------- | ---------------------------------------------------------- | ----- |
| `importFile`         | Tak -- `packages/cli/src/commands/import.ts`               | PASS  |
| `validateRoundtrip`  | Tak -- `packages/cli/src/commands/import.ts`               | PASS  |
| `DetectedFormat`     | Tak -- `packages/cli/src/commands/import.ts` (import type) | PASS  |
| `detectFormat`       | Nie (UNUSED w monorepo)                                    | PASS  |
| `getParser`          | Nie (UNUSED w monorepo)                                    | PASS  |
| `classifyConfidence` | Nie (UNUSED w monorepo)                                    | PASS  |
| `ConfidenceLevel`    | Nie (UNUSED w monorepo)                                    | PASS  |
| `mapSections`        | Nie (UNUSED w monorepo)                                    | PASS  |
| `emitPrs`            | Nie (UNUSED w monorepo)                                    | PASS  |

Ocena: **PASS** -- 6 eksportow oznaczonych jako UNUSED w dead exports to zamierzone public API dla zewnetrznych konsumentow (potwierdzenie w automated-results.md). Kazdy krok pipeline'u (detect -> parse -> map -> emit) jest eksportowany, aby umozliwic selektywne uzycie.

## 6. Poprawnosc przykladow w README

Przyklad programmatic (linie 52-63 README):

```typescript
import { importFile, validateRoundtrip } from '@promptscript/importer';
const result = await importFile('./CLAUDE.md');
console.log(result.prsContent);
console.log(result.totalConfidence);
console.log(result.warnings);
const validation = await validateRoundtrip('./CLAUDE.md');
console.log(validation.valid);
```

Weryfikacja:

- `importFile` zwraca `ImportResult` z polami `prsContent`, `totalConfidence`, `warnings` -- **poprawne**
- `validateRoundtrip` zwraca `RoundtripResult` z polem `valid` -- **poprawne**
- Przyklady CLI (`prs import CLAUDE.md`, `--dry-run`, `--format generic`, `--validate`) -- zgodne z logika importera

Ocena: **PASS**

## 7. Coverage gaps

Automated-results.md (sekcja 10) nie wymienia zadnego pliku z pakietu importer jako majacego fn% < 80%. Pakiet nie jest flagowany.

Ocena: **PASS**

---

## Podsumowanie znalezisk

| Kryterium                       | Ocena |
| ------------------------------- | ----- |
| Dokumentacja w README           | WARN  |
| Zgodnosc implementacji z typami | WARN  |
| Testy happy path                | PASS  |
| Uzycie przez inne pakiety       | PASS  |
| Poprawnosc przykladow README    | PASS  |
| Coverage gaps                   | PASS  |
| Typecheck                       | PASS  |
| Testy (passing)                 | PASS  |

## Rekomendacje

1. **WARN** -- Dodac `getParser` i `classifyConfidence` do sekcji API w README z opisem parametrow i zwracanych typow.
2. **WARN** -- Rozwazyc eksport typow `FormatParser` i `MarkdownSection` z index.ts, poniewaz sa uzywane w sygnaturach publicznych funkcji (`getParser` zwraca `FormatParser`, `mapSections` przyjmuje `MarkdownSection[]`). Bez tych typow zewnetrzny konsument nie ma pelnego type safety.
3. **INFO** -- automated-results.md (sekcja 7) pomija `validateRoundtrip` i `EmitOptions` na liscie eksportow -- nalezy zaktualizowac.
4. **INFO** -- Wszystkie UNUSED eksporty sa zamierzone jako public API -- potwierdzone, nie wymagaja akcji.
