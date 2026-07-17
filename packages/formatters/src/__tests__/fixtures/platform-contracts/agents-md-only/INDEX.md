# AGENTS.md-Only Target Family

These platforms read `AGENTS.md` natively and have no target-specific
instruction file contract beyond it. PromptScript emits a single `AGENTS.md`
per target with `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
(Task 6).

## Family index

| Target    | Source URL                                                | Retrieved  | Expected path | Scope           |
| --------- | --------------------------------------------------------- | ---------- | ------------- | --------------- |
| amazon-q  | https://github.com/aws/amazon-q-developer-cli/issues/2712 | 2026-07-17 | `AGENTS.md`   | formatter-scope |
| warp      | https://docs.warp.dev/agent-platform/capabilities/rules/  | 2026-07-17 | `AGENTS.md`   | formatter-scope |
| zed       | https://zed.dev/docs/ai/instructions                      | 2026-07-17 | `AGENTS.md`   | formatter-scope |
| aider     | https://aider.chat/docs/usage/conventions.html            | 2026-07-17 | `AGENTS.md`   | formatter-scope |
| jules     | https://jules.google/docs/                                | 2026-07-17 | `AGENTS.md`   | formatter-scope |
| devin     | https://docs.devin.ai/cli/extensibility/rules             | 2026-07-17 | `AGENTS.md`   | formatter-scope |
| phoenix   | (rejected - see phoenix/INDEX.md)                         | 2026-07-17 | n/a           | rejected        |
| swe-agent | (rejected - see swe-agent/INDEX.md)                       | 2026-07-17 | n/a           | rejected        |

## Shared contract

- Output path: `AGENTS.md` (root) or `<package>/AGENTS.md` (nested, via build
  profiles in Task 19).
- Plain Markdown, no frontmatter (AGENTS.md v1.1 frontmatter is experimental
  and opt-in - Task 20).
- Target-neutral Markdown content; no target branding inside the instruction
  body.
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`.
- `simple`, `multifile`, and `full` versions emit the same single file
  (compatibility aliases).

## Per-target notes

- **Warp** also reads `WARP.md` for backwards compatibility; if both exist in
  the same directory, `WARP.md` takes priority. Filename must be all caps.
  Warp links `CLAUDE.md`, `.cursorrules`, `AGENT.md`, `GEMINI.md`,
  `.clinerules`, `.windsurfrules`, `.github/copilot-instructions.md` as
  external rules files. PromptScript emits `AGENTS.md` only; `WARP.md` is a
  legacy alias and not generated.
- **Zed** uses `AGENTS.md` as the primary instruction file. Zed also reads
  `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`,
  `.github/copilot-instructions.md`, `AGENT.md`, `CLAUDE.md`, `GEMINI.md` as
  fallbacks (first match wins). Project instructions override personal
  `~/.config/zed/AGENTS.md`. Skills live at `.agents/skills/` (project) and
  `~/.agents/skills/` (user) - separate from the AGENTS.md instruction file.
- **Aider** loads conventions via `--read CONVENTIONS.md` or always-load via
  `.aider.conf.yml` `read:`. AGENTS.md is loaded as project-level
  conventions. No frontmatter, no skill directory.
- **Jules** automatically looks for `AGENTS.md` in the root of the repo.
  Cloud coding agent; no project-local skill or agent file contract.
- **Devin CLI** reads `AGENTS.md` (recommended), `AGENTS.local.md`
  (gitignored personal), `AGENT.md`, `.windsurfrules`, `CLAUDE.md`. Also reads
  `.cursor/rules/*.md{,c}`, `.windsurf/rules/*.md`, `.claude/`. AGENTS.md is
  always-on. Personal `~/.config/devin/AGENTS.md` is user-level (out of
  scope). Skills are recommended over rules where possible, but no
  project-local skill directory contract is documented for the CLI; skills
  belong to Devin Desktop / Cascade.
- **Amazon Q Developer CLI** has an open feature request to read AGENTS.md
  (issue #2712). Custom agents exist but use Amazon Q's own agent
  configuration, not AGENTS.md. Treat as AGENTS.md-only with the caveat that
  upstream AGENTS.md support is tracked but not yet GA in the CLI. If a
  fixture confirms AGENTS.md is not read, move to `rejected`.

## Collision handling (Task 6)

- If two AGENTS.md-only targets in one build generate identical content,
  coalesce output owners and report an informational diagnostic instead of an
  overwrite warning.
- If generated content differs, retain collision warning behavior.
- Identical shared output is deterministic regardless of target order.

## Rejected targets

- **Phoenix**: The "Phoenix" name in the research doc refers to a platform
  listed as AGENTS.md-native. Search results show "Phoenix" is Arize Phoenix
  (AI observability) and "Phoenix" the Elixir web framework - neither is an
  AGENTS.md-reading coding agent. No stable project-local instruction file
  contract can be confirmed. Rejected until a verified Phoenix coding agent
  fixture is captured.
- **SWE-agent**: Uses `.yaml` config files passed via `--config`, not
  AGENTS.md. SWE-agent is now in maintenance-only mode, superseded by
  mini-swe-agent. No AGENTS.md contract. Rejected.
