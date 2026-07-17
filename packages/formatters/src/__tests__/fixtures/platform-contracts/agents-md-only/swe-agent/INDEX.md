# SWE-agent - Rejected

Source: https://swe-agent.com/latest/config/config/,
https://swe-agent.com/latest/reference/agent_config/
Retrieved: 2026-07-17
Version: SWE-agent (maintenance-only, superseded by mini-swe-agent)
Scope: rejected

## Why rejected

SWE-agent does NOT read `AGENTS.md`. It uses `.yaml` configuration files
passed via the `--config` flag on the command line:

```
sweagent run --config config/your_config.yaml
sweagent run-batch --config config/your_config.yaml
```

Config files define tools, prompts, demonstrations, model behavior, and the
I/O interface between agent and environment. Relative paths resolve to
`SWE_AGENT_CONFIG_ROOT` or the SWE-agent repository root. The default config
is `config/default.yaml`.

SWE-agent is now in maintenance-only mode and has been superseded by
mini-swe-agent (https://mini-swe-agent.com/). The docs explicitly redirect
users to mini-swe-agent.

No project-local AGENTS.md instruction file contract exists.

## What PromptScript must not do

- Do NOT add a `swe-agent` target to `KnownTarget`.
- Do NOT add an SWE-agent formatter.
- Do NOT add SWE-agent to the AGENTS.md-only family.

## Reopen condition

Reopen only if SWE-agent or mini-swe-agent ships a stable project-local
AGENTS.md instruction file contract and a fixture is captured. The
maintenance-only status makes this unlikely.
