# Deep Agents Code (LangChain)

Source: https://docs.langchain.com/oss/python/deepagents/overview,
https://docs.langchain.com/oss/python/deepagents/skills
Retrieved: 2026-07-17
Version: `deepagents` PyPI package (current)

## Contract

Deep Agents is an "agent harness" - the same core tool calling loop as other
agent frameworks, but with built-in capabilities for real tasks.

### Memory (AGENTS.md)

"Memory uses `AGENTS.md` files that you pass through the `memory` parameter
when creating the agent. Unlike skills, memory files are always loaded, and
the content is stored in the configured backend (`StateBackend`,
`StoreBackend`, or `FilesystemBackend`)."

The agent can update memory based on interactions and feedback. AGENTS.md is
the memory contract - always-on context loaded at startup.

### Skills

Skills follow the Agent Skills open standard. Each skill is a directory with
a `SKILL.md` file. Skills can include scripts, templates, reference docs,
and supporting resources.

Progressive disclosure: agent reads `SKILL.md` frontmatter at startup, then
reads full skill content only when a task needs it.

### Subagents

Built-in `task` tool creates ephemeral subagents. Default `general-purpose`
subagent enabled; custom subagents configurable. Each invocation creates a
new agent instance with its own context. Single handoff - one final report.
Subagents are stateless.

### Steering (HITL)

`interrupt_on` parameter pauses for approval on sensitive tool calls.
Example: `interrupt_on={"edit_file": True}` pauses before every edit.

### Execution environment

- Tools (custom functions, LangChain tools, MCP servers)
- Virtual filesystem with pluggable backends (in-memory, local disk,
  LangGraph store, composite, custom)
- Filesystem permissions (declarative read/write rules, first-match-wins)
- Code execution (sandbox backends with `execute` tool, QuickJS
  interpreters with `eval` tool)

## Expected paths (initial)

- `AGENTS.md` (root) - memory file, always loaded

Native project-local skill directory contract for the `deepagents` PyPI
package is not documented as a filesystem path; skills live in the virtual
filesystem backend. PromptScript emits `AGENTS.md` only for the `deep-agents`
target until a fixture confirms a project-local skill directory path.

## Scope classification

`formatter-scope` for `AGENTS.md`. Native skill path pending fixture
confirmation in Task 27.

## Out of scope

- `interrupt_on` runtime configuration (runtime steering, not instructions).
- Sandbox backend and interpreter configuration (runtime).
- Virtual filesystem backend selection (runtime).
- LangGraph store and LangSmith observability (runtime/hosted).
- Managed Deep Agents (hosted deployment).
