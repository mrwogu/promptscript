# Migrate Factory Hooks

Goal: move legacy PromptScript-owned hooks without overwriting unrelated Factory settings.

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

PromptScript plans migration only when `.factory/hooks.json` is absent and legacy ownership is unambiguous.

## After

`.factory/settings.json` keeps unrelated settings:

```json
{
  "theme": "dark"
}
```

`.factory/hooks.json` receives canonical hooks:

```json
{
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

See [AI Tool Hooks](https://getpromptscript.dev/v1.18/guides/hooks/index.md) for installer behavior and cleanup.
