# MiMo Code (Xiaomi)

Source: https://github.com/XiaomiMiMo/MiMo-Code
Retrieved: 2026-07-17
Version: MiMo Code v0.1.6 (July 15 2026)

## Contract

MiMo Code is a fork of OpenCode. The MiMo-Code repository itself has both
`AGENTS.md` and `CLAUDE.md` at the root, confirming AGENTS.md is read.

MiMo Code keeps all core OpenCode capabilities (multiple providers, TUI, LSP,
MCP, plugins) and adds persistent memory, intelligent context management,
subagent orchestration, goal-driven autonomous loops, compose workflows, and
self-improvement via dream/distill.

### Configuration

- Config: `~/.config/mimocode/mimocode.jsonc` or `mimocode.json`
  (user-level, out of scope). Schema auto-injected at
  `https://mimo.xiaomi.com/mimocode/config.json`.
- TUI: `tui.json` (schema `https://mimo.xiaomi.com/mimocode/tui.json`).
- Data directories (XDG, out of scope): `~/.local/share/mimocode/`,
  `~/.local/state/mimocode/`, `~/.cache/mimocode/`.
- `MIMOCODE_HOME` overrides all paths.

### Skills

MiMo Code (via OpenCode/Antigravity lineage) uses the `.agents/skills/`
workspace project path (see `antigravity/skills-path.md`). Skills follow the
Agent Skills open standard.

### Permissions

- `external_directory` permission prompts for paths outside the project
  working directory. `/tmp/**` can be allowlisted in config.
- `--dangerously-skip-permissions` (or `MIMOCODE_DANGEROUSLY_SKIP_PERMISSIONS=1`)
  auto-approves everything in trusted/disposable environments.

### Experimental

- `experimental.maxMode` - parallel best-of-N reasoning with judge selection.

## Expected paths (initial)

- `AGENTS.md` (root) - instruction file
- `.agents/skills/<name>/SKILL.md` - native project skills (Task 27 fixture
  confirmation)

## Scope classification

`formatter-scope` for `AGENTS.md`. Native skill path pending fixture
confirmation in Task 27. OpenCode compatibility means existing OpenCode
formatter behavior is a useful reference.

## Out of scope

- User-level config (`~/.config/mimocode/`).
- TUI preferences, runtime data, cache.
- Max Mode, dream/distill, compose workflows (runtime).
- Git worktree session features (runtime).
- Permission rule configuration (runtime config, not instructions).
