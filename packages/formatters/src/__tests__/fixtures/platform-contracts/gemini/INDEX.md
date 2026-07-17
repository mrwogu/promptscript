# Gemini CLI Contracts

Source: https://geminicli.com/docs/cli/skills/,
https://geminicli.com/docs/cli/gemini-md/

## Fixture index

| File                | Source URL                                | Version    | Retrieved  | Expected path                                                        | Scope           |
| ------------------- | ----------------------------------------- | ---------- | ---------- | -------------------------------------------------------------------- | --------------- |
| skill.md            | https://geminicli.com/docs/cli/skills/    | Gemini CLI | 2026-07-17 | `.agents/skills/<name>/SKILL.md` or `.gemini/skills/<name>/SKILL.md` | formatter-scope |
| gemini-md.md        | https://geminicli.com/docs/cli/gemini-md/ | Gemini CLI | 2026-07-17 | `GEMINI.md` (workspace local)                                        | formatter-scope |
| agents-skills.md    | https://geminicli.com/docs/cli/skills/    | Gemini CLI | 2026-07-17 | alias precedence doc                                                 | formatter-scope |
| runtime-commands.md | https://geminicli.com/docs/cli/skills/    | Gemini CLI | 2026-07-17 | none (runtime)                                                       | out-of-scope    |

## Scope notes

### Skills (formatter-scope)

Discovery tiers (lowest to highest precedence):

1. Built-in skills
2. Extension skills
3. User skills: `~/.gemini/skills/` or `~/.agents/skills/` alias
4. Workspace skills: `.gemini/skills/` or `.agents/skills/` alias

Within the same tier, `.agents/skills/` alias takes precedence over
`.gemini/skills/`. The `.agents/skills/` alias is positioned as the
interoperable cross-tool path.

Skill = folder + `SKILL.md` following the Agent Skills open standard.
Progressive disclosure: metadata at startup, body on activation, resources on
demand.

PromptScript action (Task 10): add target option `skillPath` with allowed
values `agents` (`.agents/skills/`), `gemini` (`.gemini/skills/`), and `both`
(only when explicitly requested). Use fixture-confirmed precedence to choose
default. Command files stay under `.gemini/commands/`. Deduplicate content in
`both` mode.

### GEMINI.md (formatter-scope)

Workspace-local context file. Global developer context at
`~/.gemini/GEMINI.md` is user-level (out of scope).

PromptScript Gemini formatter already emits `GEMINI.md`. Nested `GEMINI.md`
support is planned (matrix `gemini.nested-memory` -> `planned` -> `supported`
after Task 23/Task 19).

### Runtime commands (out-of-scope)

`/skills list`, `/skills link`, `/skills disable`, `/skills enable`,
`/skills reload`, `gemini skills install/uninstall` are runtime commands.
No instructions gap.

### Transition to Antigravity CLI

Announced June 18 2026 for unpaid tier and Google One users. Keep Gemini
target stable. Add an explicit Antigravity compatibility mode only after
Antigravity's project-local CLI file contract is confirmed (see
`antigravity/`).
