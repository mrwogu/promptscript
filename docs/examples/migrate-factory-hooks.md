---
title: Migrate Factory Hooks
description: Safely move PromptScript-owned Factory hooks from legacy settings to the canonical hook file
---

# Migrate Factory Hooks

Goal: move legacy PromptScript-owned hooks without overwriting unrelated
Factory settings.

## Before

`.factory/settings.json`:

```json
{
  "theme": "dark",
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "prs hook pre-edit # promptscript-generated:pre-edit"
          }
        ]
      }
    ]
  }
}
```

## Preview

```bash
prs compile --dry-run
```

PromptScript plans migration only when `.factory/hooks.json` is absent and
legacy ownership is unambiguous.

## After

`.factory/settings.json` keeps unrelated settings:

```json
{
  "theme": "dark"
}
```

`.factory/hooks.json` receives canonical hooks. The file is keyed directly by
event name, without the `hooks` wrapper that `settings.json` uses:

```json
{
  "PreToolUse": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "prs hook pre-edit # promptscript-generated:pre-edit"
        }
      ]
    }
  ]
}
```

PromptScript 1.27 and earlier wrapped `hooks.json` in a `hooks` key, which
droid does not read. The next `prs compile` or `prs hooks install factory`
rewrites such a file in the bare shape.

## Safety Rules

- Unknown events abort migration.
- Malformed entries abort migration.
- Mixed PromptScript and user ownership aborts migration.
- No partial write occurs after failed preflight.
- `--no-migrate-factory-hooks` leaves legacy file unchanged and reports PS4002.

Apply only after reviewing dry-run:

```bash
prs compile
```

See [AI Tool Hooks](../guides/hooks.md) for installer behavior and cleanup.
