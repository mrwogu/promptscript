# Cursor Automations - Out of Scope

Source: https://cursor.com/docs/cloud-agent/automations
Retrieved: 2026-07-17

## Why out of scope

- Automations run cloud agents in the background on Cursor-owned VMs.
- Triggers: schedule (cron), source control (GitHub/GitLab/Bitbucket push, PR,
  review, label, CI completed, workflow run), Slack (message, reaction,
  channel), webhook (private HTTP endpoint), Linear (issue, status, cycle),
  Sentry (issue events), PagerDuty (incident events).
- Configuration lives at https://cursor.com/automations or in the Agents
  Window; no project-local instruction file.
- `/automate` skill creates cloud automations from a local session.
- Always runs in Max Mode; usage billed to team pool or creating user.

## What PromptScript must not do

- Add an `@automations` block.
- Emit an automations configuration file into the project.
- Add a Cursor automation adapter.

## Reopen condition

Reopen only if Cursor ships a versioned project-local automation schema.
