---
title: Versions and Diagnostics
description: PromptScript syntax versions, upgrade commands, and release validation
---

# Versions and Diagnostics

`@meta.syntax` declares language syntax, not package, policy, registry, or
organization version.

## Syntax Versions

| Version | Added capability                                                                 |
| ------- | -------------------------------------------------------------------------------- |
| `1.0.0` | Core instruction and composition blocks                                          |
| `1.1.0` | Agents and workflows                                                             |
| `1.2.0` | Few-shot examples                                                                |
| `1.3.0` | Direct regular field replacement with `field!`                                   |
| `1.4.0` | Hooks, MCP servers, and plugins                                                  |
| `1.5.0` | Contextual section headers, atomic `@override`, and declaration-order operations |

Use the minimum required version for reusable published fragments. Use current
syntax for new project entry files.

## Upgrade Commands

```bash
# Preview all .prs version changes.
prs upgrade --dry-run

# Upgrade syntax declarations using per-file atomic replacement.
prs upgrade

# Find compatibility and shape problems.
prs validate --strict

# Preview generated output and hook migration.
prs compile --dry-run
```

`prs upgrade` parses every discovered file before writing, so an initial parse
failure aborts the complete plan. Each file then uses atomic replacement and
preserves permissions. Multi-file upgrade is not transactional: a write-time
failure in a later file does not roll back files already replaced. Symlinks are
skipped. Run upgrades on a clean version-control branch.

## Key Diagnostics

| Diagnostic | Meaning                                     | Action                                      |
| ---------- | ------------------------------------------- | ------------------------------------------- |
| PS018      | Used feature requires newer syntax          | Run `prs validate --fix` or `prs upgrade`   |
| PS019      | Unknown built-in block name                 | Correct typo or confirm custom block intent |
| PS034      | Invalid hook executable or option           | Fix command, script, or target override     |
| PS037      | Invalid contextual section header           | Fix owner, key, title, or duplicate         |
| PS038      | Unsupported or risky built-in block shape   | Convert to canonical shape                  |
| PS4002     | Target cannot preserve requested capability | Use documented target fallback              |

## Release Gate

```bash
prs validate --strict
prs compile --dry-run
prs diff --all
```

Commit syntax upgrades, lockfile changes, source changes, and reviewed generated
outputs together according to repository policy.

See [Upgrade 1.15 to 1.16](../../guides/upgrade-1-15-to-1-16.md) for release-specific
migration steps.
