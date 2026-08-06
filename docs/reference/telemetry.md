---
title: Anonymous Usage Telemetry
description: Fields, delivery behavior, and controls for PromptScript telemetry
---

# Anonymous Usage Telemetry

PromptScript sends anonymous aggregate usage telemetry by default. Telemetry
helps maintainers understand command reliability and target adoption without
collecting project content or identifying installations.

## Collected Data

Each event contains:

- PromptScript version
- Node.js major version
- operating system family: `darwin`, `linux`, `windows`, or `other`
- CPU architecture: `arm64`, `x86_64`, or `other`
- allowlisted command name
- outcome: `success`, `error`, or `cancelled`
- aggregate command duration
- allowlisted target and option features

Supported option features:

- `dry_run`
- `watch`
- `strict`
- `ci`
- `build_profile`

Target features use `target:<target>`. Every target must exist in the
versioned telemetry schema bundled with PromptScript.

## Data Never Collected

Telemetry never includes:

- PromptScript source or compiled output
- prompts, instructions, skills, agents, or resources
- project names or identifiers
- file paths
- registry URLs
- branch names or commit hashes
- error messages or stack traces
- environment variable names or values
- credentials or API keys
- IP addresses in the analytics dataset
- persistent installation or user identifiers

The collector uses source IP only for transient rate limiting. Cloudflare
processes connection metadata while serving the request.

## Delivery

Commands append small NDJSON records under:

```text
~/.promptscript/.cache/telemetry.ndjson
```

No command waits for telemetry network traffic. A detached process sends queued
records during a later CLI invocation. Flushes happen at most every four hours,
or earlier when at least 50 records are queued.

The spool keeps at most 200 records and 64 KiB. Writes use file locks, atomic
renames, and sidecar files so concurrent CLI processes do not overwrite each
other. Collector-rejected records move to a bounded local quarantine file.

Delivery uses:

```text
https://telemetry.guziak.net/v1/events
```

Requests use HTTPS, reject redirects, send at most 25 unique aggregate events
per batch, and stop after a five-second total budget. Records are removed from
the spool before each request. If a request fails without a definitive HTTP
response, PromptScript does not retry it because the collector may already have
accepted it. This is at-most-once delivery.

## Disable Telemetry

Project-level opt-out:

```yaml
telemetry: false
```

User-level opt-out in `~/.promptscript/config.yaml`:

```yaml
version: '1'
telemetry: false
```

Environment opt-out:

```bash
export PROMPTSCRIPT_TELEMETRY=false
# or
export DO_NOT_TRACK=1
```

Any opt-out is a hard veto. `PROMPTSCRIPT_TELEMETRY=true` cannot override
`DO_NOT_TRACK`, project config, or user config.

Manage user-level configuration:

```bash
prs telemetry status
prs telemetry enable
prs telemetry disable
```

`status` reports the effective setting, active vetoes, endpoint, spool size,
and latest delivery status. These telemetry management commands do not create
telemetry events.

## Collector Contract

Payload envelope:

```json
{
  "schema": 1,
  "app": "promptscript",
  "event_schema": 1,
  "app_version": "1.16.0",
  "runtime": "node",
  "runtime_version": "24",
  "os": "darwin",
  "arch": "arm64",
  "events": [
    {
      "name": "command",
      "command": "compile",
      "outcome": "success",
      "count": 4,
      "duration_ms_sum": 820
    },
    {
      "name": "feature",
      "feature": "target:claude",
      "count": 4
    }
  ]
}
```

Collector validates every key and dimension against fixed allowlists before
writing to the `promptscript_usage` Analytics Engine dataset.
