---
title: Versions and Diagnostics
description: PromptScript syntax versions, upgrade commands, and release validation
---

# Versions and Diagnostics

`@meta.syntax` declares language syntax, not package, policy, registry, or
organization version.

## Syntax Versions

| Version | Added capability                                                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.0.0` | Core instruction and composition blocks                                                                                                                       |
| `1.1.0` | Agents and workflows                                                                                                                                          |
| `1.2.0` | Few-shot examples                                                                                                                                             |
| `1.3.0` | Direct regular field replacement with `field!`                                                                                                                |
| `1.4.0` | Hooks, MCP servers, and plugins                                                                                                                               |
| `1.5.0` | Contextual section headers, atomic `@override`, declaration-order operations, unquoted `${VAR}` values                                                        |
| `1.6.0` | Prompt definitions: validated `@prompts` entries with typed inputs and runtime slots; coding agent targets skip them, `bundle` and `prompt-text` compile them |

Use the minimum required version for reusable published fragments. Use current
syntax for new project entry files.

Operation semantics follow the complete reachable composition graph. An
inherited, imported, inline-composed, or extension-carried source declaring
`1.5.0` enables declaration order for the graph even when the entry file
declares an older version. Inline `@use` declarations inside `@extend` bodies
are included. PS018 reports that mixed-version requirement; it does not reject
the composition.

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

## Prompt Definitions

`@prompts` entries need syntax `1.6.0`. A file that declares an older version
and has entries gets a PS018 warning, and `prs validate --fix` raises the
version. PS042 to PS046 check the entries and their `{{input.name}}` slots,
see [`@prompts`](../language.md#prompts). The parser rejects a `__proto__` field
name in every block, and PS042 rejects the other prototype names. PS045 only runs from `1.6.0`, because
from that version a `{{name}}` that nothing bound is reported instead of being
printed silently. Fenced code blocks, inline code spans and escaped `\{{` are
skipped, so documentation of template syntax stays quiet. No target emits prompt definitions.

## Model Versions

`@meta.syntax` does not track AI models. Agent and skill `model` values resolve
against the model catalog configured under [`models`](../config.md#models).
Floating aliases such as `sonnet` follow the newest release in the catalog,
and the [Model Catalog](../models.md) lists every built-in model.
PS041 reports pinned models that are deprecated or retired, together with
their replacement, models outside `models.supported`, and inconsistent
`models.profiles` entries. It also reads the `model.ref` of `@prompts` entries.

## Key Diagnostics

| Diagnostic | Meaning                                      | Action                                      |
| ---------- | -------------------------------------------- | ------------------------------------------- |
| PS018      | Used feature requires newer syntax           | Run `prs validate --fix` or `prs upgrade`   |
| PS019      | Unknown built-in block name                  | Correct typo or confirm custom block intent |
| PS034      | Invalid hook executable or option            | Fix command, script, or target override     |
| PS037      | Invalid contextual section header            | Fix owner, key, title, or duplicate         |
| PS038      | Unsupported or risky built-in block shape    | Convert to canonical shape                  |
| PS041      | Unsupported model or invalid model profile   | Switch model or update `models` config      |
| PS042      | Invalid `@prompts` entry or governance value | Fix the entry as the message describes      |
| PS043      | Undeclared or malformed runtime slot         | Declare the input or fix the slot           |
| PS044      | Declared prompt input is never used          | Use the input or remove it                  |
| PS045      | `{{name}}` left in text (syntax 1.6.0+)      | Bind it with a parameter or remove it       |
| PS046      | Runtime slot in the system message           | Move the slot to the user message           |
| PS4002     | Target cannot preserve requested capability  | Use documented target fallback              |
| PS4004     | Target cannot run or write the model         | Pick another model or set a target name     |

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
