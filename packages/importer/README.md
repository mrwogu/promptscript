# @promptscript/importer

Import existing AI instruction files into PromptScript format.

Converts `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, and other markdown-based AI instruction files into `.prs` files with heuristic section classification and confidence scoring.

## Architecture

```
                   +-----------+
  Input File  ---> | Detector  | --- format
                   +-----------+
                        |
                   +-----------+
                   |  Parser   | --- MarkdownSection[]
                   +-----------+
                        |
                   +-----------+
                   |  Mapper   | --- ScoredSection[] (with confidence)
                   +-----------+
                        |
                   +-----------+
                   |  Emitter  | --- .prs text output
                   +-----------+
                        |
                   +-----------+
                   | Roundtrip | --- validates output via @promptscript/parser
                   +-----------+
```

## Usage

### CLI

```bash
# Import a CLAUDE.md file
prs import CLAUDE.md

# Preview without writing files
prs import .cursorrules --dry-run

# Specify format explicitly
prs import instructions.md --format generic

# Validate the generated output
prs import CLAUDE.md --validate
```

### Programmatic

```typescript
import { importFile, validateRoundtrip } from '@promptscript/importer';

// Import a file
const result = await importFile('./CLAUDE.md');
console.log(result.prsContent); // Generated .prs content
console.log(result.totalConfidence); // 0.0 - 1.0
console.log(result.warnings); // Low-confidence warnings

// Validate roundtrip
const validation = await validateRoundtrip('./CLAUDE.md');
console.log(validation.valid); // true if output parses cleanly
```

## Supported Formats

| Format    | Files                              | Detection |
| :-------- | :--------------------------------- | :-------- |
| `claude`  | `CLAUDE.md`, `claude.md`           | Filename  |
| `github`  | `copilot-instructions.md`          | Filename  |
| `cursor`  | `.cursorrules`, `.cursor/rules.md` | Filename  |
| `generic` | Any `.md` file                     | Fallback  |

## Section Classification

The mapper uses heuristics to classify sections:

| Pattern                     | Target Block    | Confidence |
| :-------------------------- | :-------------- | :--------- |
| "You are..." in content     | `@identity`     | HIGH       |
| Heading: "Don'ts", "Rules"  | `@restrictions` | HIGH       |
| Heading: "Testing", "Build" | `@knowledge`    | HIGH       |
| List: "Never/Don't/Always"  | `@restrictions` | HIGH       |
| List: "Use/Prefer/Follow"   | `@standards`    | HIGH       |
| Mixed patterns              | Best-fit        | MEDIUM     |
| No match                    | `@context`      | LOW        |

Sections with non-HIGH confidence include `# REVIEW:` comments in the output for manual verification.

## API

### `importFile(filepath, options?)`

Main import orchestrator. Returns `ImportResult`.

### `validateRoundtrip(filepath)`

Imports file then parses the generated `.prs` with `@promptscript/parser` to verify syntactic validity.

### `detectFormat(filepath)`

Auto-detects source format from filename.

### `mapSections(sections)`

Maps `MarkdownSection[]` to `ScoredSection[]` with heuristic classification.

### `getParser(format)`

Returns the format-specific parser for a detected format.

### `classifyConfidence(score)`

Classifies a numeric confidence score into a `ConfidenceLevel` (`HIGH`, `MEDIUM`, or `LOW`).

### `emitPrs(sections, options)`

Generates `.prs` text from scored sections.
