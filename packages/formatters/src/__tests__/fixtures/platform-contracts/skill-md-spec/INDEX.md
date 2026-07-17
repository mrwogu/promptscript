# SKILL.md Open Standard (agentskills.io)

Source: https://agentskills.io/specification, https://agentskills.io/
Retrieved: 2026-07-17
Version: spec page last updated 2026-05-20

## Directory structure

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

## Frontmatter

| Field           | Required | Constraints                                                                                                                            |
| --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `name`          | yes      | Max 64 chars. Lowercase letters, numbers, hyphens only. No start/end hyphen. No consecutive hyphens. Must match parent directory name. |
| `description`   | yes      | Max 1024 chars. Non-empty. What the skill does and when to use it.                                                                     |
| `license`       | no       | License name or reference to a bundled license file.                                                                                   |
| `compatibility` | no       | Max 500 chars. Environment requirements (product, system packages, network).                                                           |
| `metadata`      | no       | Arbitrary key-value mapping (string -> string).                                                                                        |
| `allowed-tools` | no       | Space-separated string of pre-approved tools. Experimental.                                                                            |

## Name rules

- 1-64 characters
- unicode lowercase alphanumeric (`a-z`, `0-9`) and hyphens (`-`)
- must not start or end with a hyphen
- must not contain consecutive hyphens (`--`)
- must match the parent directory name

Invalid: `PDF-Processing` (uppercase), `-pdf` (leading hyphen),
`pdf--processing` (consecutive hyphens).

## Description rules

- 1-1024 characters
- describe both what the skill does and when to use it
- include specific keywords that help agents identify relevant tasks

Good: "Extracts text and tables from PDF files, fills PDF forms, and merges
multiple PDFs. Use when working with PDF documents or when the user mentions
PDFs, forms, or document extraction."

Poor: "Helps with PDFs."

## Body content

No format restrictions. Recommended sections: step-by-step instructions,
examples of inputs and outputs, common edge cases. Keep `SKILL.md` under 500
lines. Move detailed reference material to separate files.

## Optional directories

- `scripts/` - executable code. Self-contained or clearly document dependencies.
- `references/` - additional documentation loaded on demand.
- `assets/` - static resources (templates, images, data files).

## Progressive disclosure

1. Metadata (~100 tokens): `name` and `description` loaded at startup.
2. Instructions (< 5000 tokens recommended): full `SKILL.md` body loaded on activation.
3. Resources (as needed): files in `scripts/`, `references/`, `assets/` loaded on demand.

## File references

Use relative paths from the skill root. Keep file references one level deep
from `SKILL.md`.

## Validation

Use the `skills-ref` reference library: `skills-ref validate ./my-skill`.

## PromptScript action (Task 9)

- Add `license?: string` to inline skill extraction and SKILL.md frontmatter
  where target schemas allow it.
- Add `scripts?: string[]` and `references?: string[]` for inline PRS skills.
- Resolve script and reference paths relative to the file declaring each
  skill.
- Load script content under `scripts/<basename>` and references under
  `references/<basename>`.
- Record source executable bits in `SkillResource` and propagate mode into
  generated `FormatterOutput`.
- Add `license` to skill replace semantics; add `scripts` and `references`
  to append and deduplicate semantics.
- Keep Factory filtering behavior until its contract fixture allows
  `license`.
- Preserve raw external frontmatter unchanged for permissive targets.

## Adoption

Adopted beyond Claude: Gemini CLI (`.gemini/skills/` + `.agents/skills/`
alias), Cursor (via plugins and Customize), Codex (`.agents/skills/`,
`skills.config`), Factory, OpenCode, Kimi CLI, ForgeCode, Deep Agents,
Zed, and growing.
