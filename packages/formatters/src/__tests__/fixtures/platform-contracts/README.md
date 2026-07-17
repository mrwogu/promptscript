# Agent Platform Contract Fixtures

Captured upstream contracts for every formatter target this plan touches.
Each fixture records the minimal valid file shape, the source URL, the
observed upstream version, the retrieval date, and the expected project-local
path PromptScript should emit. Formatters MUST NOT add a path or feature that
is not backed by a fixture in this tree.

## Fixture record format

Every fixture directory contains an `INDEX.md` with one row per captured file:

| Field         | Purpose                                                     |
| ------------- | ----------------------------------------------------------- |
| File          | Fixture filename in this directory                          |
| Source URL    | Official documentation page used to capture the contract    |
| Version       | Upstream version observed on the retrieval date             |
| Retrieved     | ISO date the source was fetched and verified                |
| Expected path | Project-local path PromptScript must emit for this artifact |
| Notes         | Contract constraints, scope, or out-of-scope classification |

## Directory layout

```
platform-contracts/
├── README.md            # This file
├── claude/              # Claude Code workflows, hooks, settings, routines OOS
├── github/              # GitHub Copilot custom agents
├── cursor/              # Cursor skills, subagents, hooks, automations
├── antigravity/         # Antigravity AGENTS.md, AgentKit, workflows
├── codex/               # Codex skills, agent TOML, hooks, plugins, nesting
├── gemini/              # Gemini CLI skills alias, nested GEMINI.md
├── grok/                # Grok Build AGENTS.md + Claude compatibility
├── agents-md-spec/      # AGENTS.md open spec + v1.1 proposal status
├── skill-md-spec/       # SKILL.md open standard (agentskills.io)
├── factory/             # Factory AGENTS.md discovery hierarchy
├── agents-md-only/      # AGENTS.md-only targets family
│   ├── amazon-q/
│   ├── warp/
│   ├── zed/
│   ├── aider/
│   ├── jules/
│   └── devin/
└── priority-b/
    ├── kimi/
    ├── mimo/
    ├── deep-agents/
    └── forgecode/
```

## Scope classification

Each INDEX.md marks every target as one of:

- `formatter-scope` - project-local instruction or skill file emitted by a formatter
- `out-of-scope` - runtime/hosted/user-level feature with no project-local contract
- `rejected` - no stable project-local contract exists; no formatter will be added

Runtime-only features (Claude hosted routines, Cursor automations, Codex Goal
mode, etc.) are recorded as out-of-scope so future tasks do not re-investigate
them without an upstream versioned project-local schema.

## Verification policy

- Sources are official vendor documentation or canonical spec repositories.
- Retrieval dates use ISO 8601 (`YYYY-MM-DD`).
- Versions come from the source page's "Last updated" stamp, changelog entry,
  or release tag visible on the retrieval date.
- When the source has no version stamp, `Version` records `unversioned` plus
  the changelog entry or release that the contract reflects.
- A fixture is the contract. Implementation tasks reference fixtures by
  relative path so changes to upstream docs surface as fixture diffs.
