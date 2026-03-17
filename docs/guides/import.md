# Importing Existing AI Instructions

The `prs import` command converts existing AI instruction files into PromptScript format. This allows teams to adopt PromptScript without losing their existing configurations.

## Supported Formats

| Source Format    | File                               |
| :--------------- | :--------------------------------- |
| Claude Code      | `CLAUDE.md`                        |
| GitHub Copilot   | `.github/copilot-instructions.md`  |
| Cursor           | `.cursorrules`, `.cursor/rules.md` |
| Generic Markdown | Any `.md` file                     |

## Quick Start

```bash
# Import a single file
prs import CLAUDE.md

# Preview the conversion
prs import CLAUDE.md --dry-run

# Import with roundtrip validation
prs import CLAUDE.md --validate

# Specify output directory
prs import CLAUDE.md --output ./my-project
```

## How It Works

1. **Detect Format** — Automatically identifies the source format from the filename
2. **Parse Sections** — Extracts markdown headings and content blocks
3. **Classify** — Heuristically maps sections to PromptScript blocks (`@identity`, `@standards`, `@restrictions`, `@knowledge`, `@context`)
4. **Score** — Assigns a confidence score (0-100%) to each classification
5. **Emit** — Generates `.prs` output with `# REVIEW:` comments on low-confidence sections

## Confidence Scoring

Each section receives a confidence score:

- **HIGH (>80%)** — Strong pattern match (e.g., "You are..." maps to `@identity`)
- **MEDIUM (50-80%)** — Ambiguous patterns requiring review
- **LOW (<50%)** — No clear match, classified as `@context`

Sections below HIGH confidence include `# REVIEW:` comments in the generated output. Always review the imported file before using it in production.

## CLI Options

```
prs import <file> [options]

Options:
  -f, --format <format>   Force source format (claude, github, cursor, generic)
  -o, --output <dir>      Output directory (default: .promptscript)
  --dry-run               Preview output without writing files
  --validate              Run roundtrip validation after import
```

## Roundtrip Validation

The `--validate` flag parses the generated `.prs` output with the PromptScript parser to verify it is syntactically valid. This catches any edge cases where the import produces invalid PromptScript syntax.

## After Import

1. Review the generated `imported.prs` file
2. Check `# REVIEW:` comments and adjust block classifications
3. Add `@meta` fields (team, description) as needed
4. Set up `promptscript.yaml` with your compilation targets
5. Run `prs compile` to generate output for your AI tools

## Programmatic Usage

```typescript
import { importFile } from '@promptscript/importer';

const result = await importFile('./CLAUDE.md');
console.log(result.prsContent); // Generated .prs content
console.log(result.totalConfidence); // Average confidence (0-1)
console.log(result.warnings); // Low-confidence warnings
console.log(result.sections); // Classified sections
```
