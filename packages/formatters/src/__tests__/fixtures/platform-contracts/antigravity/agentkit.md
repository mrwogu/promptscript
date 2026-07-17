# Antigravity AgentKit 2.0 - Out of Scope (pending fixture)

Source: https://antigravity.google/changelog (I/O 2026 announcement)
Retrieved: 2026-07-17

## Why out of scope

AgentKit 2.0 was announced at I/O 2026 as a multi-agent framework. The
changelog and CLI migration guide do not document a project-local file
contract for AgentKit agents.

## What PromptScript must not do

- Add AgentKit output to the Antigravity formatter until a fixture is captured.

## Reopen condition

Task 23 may add AgentKit output only after Antigravity publishes a stable
project-local AgentKit schema and a fixture is checked in under this
directory.
