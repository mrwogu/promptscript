# Amazon Q Developer CLI

Source: https://github.com/aws/amazon-q-developer-cli (repo),
https://github.com/aws/amazon-q-developer-cli/issues/2712 (AGENTS.md feature
request),
https://aws.amazon.com/blogs/devops/overcome-development-disarray-with-amazon-q-developer-cli/
Retrieved: 2026-07-17
Version: amazon-q-developer-cli (current)

## Contract

Amazon Q Developer CLI is an agentic terminal chat experience. Custom agents
exist but use Amazon Q's own agent configuration format, not AGENTS.md.

An open feature request (issue #2712, Aug 28 2025) asks Amazon Q to read
`AGENTS.md` on project start, noting that "most of these seem to be
converging to using AGENTS.md in the project folder for agent instructions
and project specific tools, conventions and hints." The issue is not confirmed
merged as of the retrieval date.

## Expected path

`AGENTS.md` (root) - contingent on issue #2712 landing.

## Scope classification

`formatter-scope` with a caveat: upstream AGENTS.md support is tracked but
not yet GA in the CLI. PromptScript emits `AGENTS.md` for the `amazon-q`
target. If a later fixture confirms AGENTS.md is not read by Amazon Q, move
this target to `rejected`.

## PromptScript action (Task 6)

- `outputPath: 'AGENTS.md'`
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
- Target-neutral Markdown content; no AWS branding inside the body.
- `simple`, `multifile`, `full` versions emit the same single file.
