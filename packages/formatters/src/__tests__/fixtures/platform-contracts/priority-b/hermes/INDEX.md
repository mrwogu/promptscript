# Hermes Agent

Source: https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files,
https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
Retrieved: 2026-08-14
Version: Current Hermes Agent user-guide documentation

## Contract

Hermes Agent identifies project-local `AGENTS.md` as a workspace context file.
PromptScript therefore emits one root `AGENTS.md` file.

The official skills documentation does not verify a project-local Hermes skill
directory or another project-local skill artifact. PromptScript does not invent
`.hermes.md`, skill directories, agent files, command files, hook files, MCP
configuration, or plugin manifests.

## Expected path

- `AGENTS.md` (root) - project workspace instructions

## Supported mapping

- `@identity`, `@context`, `@standards`, `@knowledge`, `@restrictions`, and
  `@examples` render into `AGENTS.md`.
- `simple`, `multifile`, and `full` are aliases for the same single-file output.
- Unsupported blocks produce non-fatal `PS4002` warnings with source locations.

## Limitations

- Skills, agents, shortcuts/commands, workflows, prompts, hooks, MCP servers,
  and plugins have no verified project-local Hermes contract.
- Do not emit `.hermes.md` or target-specific native files without a verified
  official contract.

## Scope classification

`formatter-scope` for root `AGENTS.md`.
