# Priority B Targets

These platforms read `AGENTS.md` and have additional skills/MCP/subagent
capabilities. PromptScript starts each with root `AGENTS.md` and adds native
skill/agent paths only from a confirmed fixture (Task 27).

## Family index

| Target      | Source URL                                                         | Retrieved  | Expected path (initial) | Scope           |
| ----------- | ------------------------------------------------------------------ | ---------- | ----------------------- | --------------- |
| kimi        | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | 2026-07-17 | `AGENTS.md`             | formatter-scope |
| mimo        | https://github.com/XiaomiMiMo/MiMo-Code                            | 2026-07-17 | `AGENTS.md`             | formatter-scope |
| deep-agents | https://docs.langchain.com/oss/python/deepagents/overview          | 2026-07-17 | `AGENTS.md` (memory)    | formatter-scope |
| forgecode   | https://forgecode.dev/docs/skills/                                 | 2026-07-17 | `AGENTS.md`             | formatter-scope |

## Per-target notes

- **Kimi CLI** (Moonshot AI): AGENTS.md in repo. Skills via Agent Skills
  open standard at `.kimi/skills/`, `.claude/skills/`, `.codex/skills/`
  (brand group) and `.agents/skills/` (generic group). Flat `.md` skills
  also recognized. Flow skills via `type: flow` frontmatter with Mermaid/D2
  diagrams. MCP via plugins. `/skill:<name>` slash command. Built-in skills:
  `kimi-cli-help`, `skill-creator`.
- **MiMo Code** (Xiaomi): AGENTS.md in repo (confirmed - the MiMo-Code repo
  itself has `AGENTS.md` and `CLAUDE.md` at root). Fork of OpenCode. Adds
  persistent memory, intelligent context management, subagent orchestration,
  goal-driven autonomous loops, compose workflows, self-improvement via
  dream/distill. Skills via OpenCode/Antigravity `.agents/skills/` layout.
  Config at `~/.config/mimocode/mimocode.jsonc` (user-level). MIT license.
- **Deep Agents Code** (LangChain): AGENTS.md is the memory file format
  (always loaded). Skills via Agent Skills open standard at
  `<skill>/SKILL.md` with progressive disclosure. Subagents via `task` tool.
  HITL via `interrupt_on`. Virtual filesystem with permission rules.
  `deepagents` PyPI package. Project-local AGENTS.md is the memory contract;
  skills live in the virtual filesystem.
- **ForgeCode** (antinomyhq): Skills via `SKILL.md` at
  `.forge/skills/<name>/SKILL.md` (project), `~/.agents/skills/<name>/SKILL.md`
  (agents-shared), `~/forge/skills/<name>/SKILL.md` (global user).
  Precedence: project > agents > global > built-in. Fully compatible with
  Claude Code skills - `SKILL.md` format identical. `:skill` command lists
  skills. AGENTS.md contract not explicitly documented on the skills page but
  ForgeCode reads AGENTS.md as the cross-tool standard (confirm in Task 27
  fixture).

## PromptScript action (Task 27)

For each verified target:

- Start with root `AGENTS.md`.
- Add native skill path only from a confirmed fixture.
- Add native agent path only from a confirmed fixture.
- Add hooks only through shared structured merge infrastructure (Task 15).
- Expose headless, worktree, session, and HITL controls only when they are
  stable project configuration, not runtime flags.
- Keep unsupported capabilities as `planned` or `not-supported`.

## Out of scope for Priority B

- Runtime features: Kimi flow skill execution, MiMo dream/distill and Max
  Mode, Deep Agents runtime steering, ForgeCode TermBench behavior.
- Hosted/cloud features.
- User-level configuration (`~/.config/mimocode/`, `~/forge/`, `~/.kimi/`).
