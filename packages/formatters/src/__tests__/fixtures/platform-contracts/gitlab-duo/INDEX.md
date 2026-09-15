# GitLab Duo

Source: https://docs.gitlab.com/user/duo_agent_platform/customize/agents_md/
Retrieved: 2026-09-15
Version: GitLab 18.8 (AGENTS.md GA), 18.10 (Agent Skills)

## Contract

GitLab Duo Agent Platform reads the `AGENTS.md` file at the repository root,
following the agents.md specification. Chat support landed in 18.7, agentic
flows in 18.8, and the GitLab UI in 18.11. Subdirectory `AGENTS.md` files
apply when Duo edits files in that directory.

Agent Skills follow the agentskills.io specification: a `SKILL.md` file with
required `name` and `description` YAML front matter inside
`skills/<skill-name>/` at the repository root (project-level, 18.10+). The
skills directory has no dot prefix, unlike most other targets.

Duo also reads `.gitlab/duo/chat-rules.md` custom rules, but `AGENTS.md`
covers the same surface and Duo combines both, so PromptScript emits
`AGENTS.md` only. The Code Review Flow ignores `AGENTS.md` and uses separate
review instructions, which are out of scope. Duo requires a Premium or
Ultimate subscription.

## Expected path

`AGENTS.md` (root) and `skills/<name>/SKILL.md` for skills.

## Scope classification

`formatter-scope`.
