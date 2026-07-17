# Kimi CLI (Moonshot AI)

Source: https://moonshotai.github.io/kimi-cli/en/customization/skills.html,
https://github.com/MoonshotAI/kimi-cli
Retrieved: 2026-07-17
Version: Kimi Code CLI (current; rebuilt & upgraded version released)

## Contract

Kimi Code CLI supports Agent Skills (open standard) and AGENTS.md.

### Skills

Skill discovery (priority order, more specific scope wins):

**Project > User > Extra > Built-in**

User-level (candidate directories, two groups merged independently; brand
group has higher specificity):

- Brand group (mutually exclusive): `~/.kimi/skills/`, `~/.claude/skills/`,
  `~/.codex/skills/`
- Generic group (mutually exclusive): `~/.config/agents/skills/`
  (recommended), `~/.agents/skills/`

Project-level (relative to project root - nearest `.git` ancestor):

- Brand group: `.kimi/skills/`, `.claude/skills/`, `.codex/skills/`
- Generic group: `.agents/skills/`

`merge_all_available_skills = true` (default) merges every brand directory
that exists; same-name skills resolved by priority kimi > claude > codex.
Set to `false` for first-match-only behaviour.

`extra_skill_dirs` in config adds directories on top of discovery. `~` is
expanded to `$HOME`; relative entries resolve against the project root.

Flat `.md` skills: a single `.md` file placed directly in a skills directory
is recognised as a skill. `name` defaults to the filename without `.md`. If a
flat `.md` and a subdirectory share the same name in the same directory, the
subdirectory wins.

`SKILL.md` frontmatter:

| Field           | Required | Notes                                                               |
| --------------- | -------- | ------------------------------------------------------------------- |
| `name`          | no       | 1-64 chars, lowercase letters/numbers/hyphens; defaults to dir name |
| `description`   | no       | 1-1024 chars; "No description provided." if omitted                 |
| `license`       | no       | License name or file reference                                      |
| `compatibility` | no       | Up to 500 chars                                                     |
| `metadata`      | no       | Additional key-value attributes                                     |

Description resolution chain: frontmatter `description:` -> first non-empty
body line (truncated at 240 chars) -> `"No description provided."`.

`/skill:<name>` slash command loads a skill. `--skills-dir` flag adds skill
directories. Flow skills use `type: flow` frontmatter with Mermaid or D2
diagrams; invoked via `/flow:<name>`.

Built-in skills: `kimi-cli-help`, `skill-creator`.

### AGENTS.md

Kimi CLI reads `AGENTS.md` as the cross-tool standard (the repo has its own
`AGENTS.md` at https://github.com/MoonshotAI/kimi-cli/blob/main/AGENTS.md).

## Expected paths (initial)

- `AGENTS.md` (root) - instruction file
- `.kimi/skills/<name>/SKILL.md` - native project skills (Task 27 fixture
  confirmation)

## Scope classification

`formatter-scope` for `AGENTS.md`. Native skill path pending fixture
confirmation in Task 27.

## Out of scope

- User-level skill directories (`~/.kimi/skills/`, `~/.claude/skills/`,
  `~/.codex/skills/`, `~/.config/agents/skills/`, `~/.agents/skills/`).
- Flow skill execution runtime (`/flow:<name>`).
- `--skills-dir` flag and `extra_skill_dirs` config (runtime).
- Plugin execution runtime.
