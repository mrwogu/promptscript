# ForgeCode (antinomyhq)

Source: https://forgecode.dev/docs/skills/,
https://github.com/antinomyhq/forgecode
Retrieved: 2026-07-17
Version: ForgeCode (TermBench 2.0 #1, 81.8% accuracy)

## Contract

ForgeCode is an AI pair programmer supporting Claude, GPT, O Series, Grok,
Deepseek, Gemini, and 300+ models.

### Skills

Skills live in three places:

- **Project skills**: `.forge/skills/<skill-name>/SKILL.md` inside your
  project, checked into version control and shared with your team.
- **Agents skills**: `~/.agents/skills/<skill-name>/SKILL.md` on your
  machine, shared with any agent tool that follows the common agents
  convention.
- **Global skills**: `~/forge/skills/<skill-name>/SKILL.md` on your machine,
  available across every project.

Precedence: project > agents > global > built-in.

`SKILL.md` format is fully compatible with Claude Code - no conversion
needed. Copy `.claude/skills` straight into `.forge/skills` and they work.

`:skill` command lists all available skills with descriptions.

### AGENTS.md

ForgeCode reads `AGENTS.md` as the cross-tool standard. The skills page does
not explicitly document the AGENTS.md path, but ForgeCode follows the common
agents convention (it reads `~/.agents/skills/`). Task 27 must capture a
fixture confirming the project-local AGENTS.md path before adding native
agent output.

### Agents

ForgeCode supports custom agents (task management, 300+ models). Agent
persona configurations live in
https://github.com/antinomyhq/awesome-forge-agents. Project-local agent file
contract is not documented on the skills page; Task 27 fixture must confirm
the path before adding native agent output.

## Expected paths (initial)

- `AGENTS.md` (root) - instruction file (pending Task 27 fixture confirmation
  of exact discovery rules)
- `.forge/skills/<name>/SKILL.md` - native project skills (fixture-confirmed)

## Scope classification

`formatter-scope` for `AGENTS.md` and `.forge/skills/`.

## Out of scope

- User-level skill directories (`~/.agents/skills/`, `~/forge/skills/`).
- Global Forge behavior, TermBench scoring (runtime).
- Agent persona runtime selection.
- Forge marketplace publishing.
