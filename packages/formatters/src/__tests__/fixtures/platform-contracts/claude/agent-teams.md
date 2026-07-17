# Claude Agent Teams - Out of Scope

Agent Teams are experimental, disabled by default, gated by
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.

## Why out of scope

- Team config lives at `~/.claude/teams/{team-name}/config.json` and is
  generated automatically at session startup.
- The official documentation states: "There is no project-level equivalent of
  the team config. A file like `.claude/teams/teams.json` in your project
  directory is not recognized as configuration; Claude treats it as an ordinary
  file."
- Team topology (lead, teammates, mailboxes, shared task list) is a runtime
  session construct. Teammates are independent Claude Code sessions.
- `/resume` and `/rewind` do not restore in-process teammates.

## What PromptScript must not do

- Add a `team: string` field on `@agents`. A string cannot represent the
  leader/teammate topology.
- Add a project-level team configuration file.
- Emit team mailbox or task list files.

## Reopen condition

Reopen only if Claude ships a versioned project-level team schema that
PromptScript can validate against fixtures.
