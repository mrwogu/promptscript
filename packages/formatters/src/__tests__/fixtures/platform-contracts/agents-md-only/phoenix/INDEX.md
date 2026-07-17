# Phoenix - Rejected

Source: web search 2026-07-17
Retrieved: 2026-07-17
Scope: rejected

## Why rejected

The "Phoenix" entry in the research doc (Section 2, Priority A) refers to a
platform listed as AGENTS.md-native with "AI development platform" as the
note. Search results on 2026-07-17 return two distinct products named
"Phoenix", neither of which is an AGENTS.md-reading coding agent:

1. **Arize Phoenix** (https://github.com/Arize-ai/phoenix) - AI Observability
   & Evaluation tool. Integrates with coding agents via CLI, MCP, and skills
   (https://arize.com/docs/phoenix/integrations/developer-tools/coding-agents)
   but is itself an observability product, not a coding agent that reads
   project-level instructions.
2. **Phoenix (Elixir web framework)** - the web framework, not a coding agent.

No stable project-local instruction file contract for an AGENTS.md-reading
"Phoenix" coding agent can be confirmed.

## What PromptScript must not do

- Do NOT add a `phoenix` target to `KnownTarget`.
- Do NOT add a Phoenix formatter.
- Do NOT add Phoenix to the AGENTS.md-only family.

## Reopen condition

Reopen only if a verified Phoenix coding agent with a stable project-local
AGENTS.md contract is identified and a fixture is captured under this
directory. The research doc's Priority C already lists niche/emerging
candidates that require discovery before implementation; Phoenix belongs in
that backlog until verified.
