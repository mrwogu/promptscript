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

Policies in `promptscript.yaml` act on the entries through PS030, located at the entry: a
missing governance field, a risk below a `risk-floor`, a model outside a `model-allowlist`,
or a content check or denied phrase of `content-rules`. A `policies` value that is not a
list, a policy definition with an unknown kind or key, an unknown role, environment or model, a data class outside `governance.dataClasses`, or an approval `count` above 1 is a
PS030 error too. With a `governance` section, PS047 warns on owners and reviewers that are
not a Git host identity and on data classes outside `governance.dataClasses`. See the
[Policy Engine guide](../../guides/policy-engine.md#prompt-policies).

## Model Versions

`@meta.syntax` does not track AI models. Agent and skill `model` values resolve
against the model catalog configured under [`models`](../config.md#models).
Floating aliases such as `sonnet` follow the newest release in the catalog,
and the [Model Catalog](../models.md) lists every built-in model.
PS041 reports pinned models that are deprecated or retired, together with
their replacement, models outside `models.supported`, and inconsistent
`models.profiles` entries. It also reads the `model.ref` of `@prompts` entries.

## Key Diagnostics

| Diagnostic | Meaning                                                                                         | Action                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| PS018      | Used feature requires newer syntax                                                              | Run `prs validate --fix` or `prs upgrade`                              |
| PS019      | Unknown built-in block name                                                                     | Correct typo or confirm custom block intent                            |
| PS030      | Policy from `promptscript.yaml` not met                                                         | Fix the prompt, skill or policy it names                               |
| PS034      | Invalid hook executable or option                                                               | Fix command, script, or target override                                |
| PS037      | Invalid contextual section header                                                               | Fix owner, key, title, or duplicate                                    |
| PS038      | Unsupported or risky built-in block shape                                                       | Convert to canonical shape                                             |
| PS041      | Unsupported model or invalid model profile                                                      | Switch model or update `models` config                                 |
| PS042      | Invalid `@prompts` entry or governance value                                                    | Fix the entry as the message describes                                 |
| PS043      | Undeclared or malformed runtime slot                                                            | Declare the input or fix the slot                                      |
| PS044      | Declared prompt input is never used                                                             | Use the input or remove it                                             |
| PS045      | `{{name}}` left in text (syntax 1.6.0+)                                                         | Bind it with a parameter or remove it                                  |
| PS046      | Runtime slot in the system message                                                              | Move the slot to the user message                                      |
| PS047      | Owner, reviewer or data class off the config                                                    | Use a Git host identity or a listed class                              |
| PS4002     | Target cannot preserve requested capability                                                     | Use documented target fallback                                         |
| PS4004     | Target cannot run or write the model                                                            | Pick another model or set a target name                                |
| PS5001     | `releases` missing or invalid                                                                   | Add `releases.environments`                                            |
| PS5002     | Environment not in `releases.environments`                                                      | Use a configured environment                                           |
| PS5003     | Release bundle or prompt missing                                                                | Run `prs release build` or restore the file                            |
| PS5004     | Release file does not verify                                                                    | Restore it from Git, or run the build                                  |
| PS5005     | Promotion skips the previous environment                                                        | Promote to the previous environment first                              |
| PS5006     | Git history, base file or ref is not usable                                                     | Commit the label, fetch base, use a full ref                           |
| PS5007     | Another release command holds the lock                                                          | Wait, then run the command again                                       |
| PS5008     | Compile output inside the release directory                                                     | Point the target output elsewhere                                      |
| PS5009     | Invalid split, or a split in the first environment                                              | Fix the arms, or split in a later environment                          |
| PS5010     | Promote on an entry with a running experiment                                                   | End it with `prs release split --end`                                  |
| PS5101     | `governance` missing or invalid, or no role                                                     | Fix the section or add the role                                        |
| PS5102     | Approval reference, prompt id or hash filter malformed                                          | Use `<id>@sha256-<64 hex>`, a hash filter takes 4+ hex digits          |
| PS5103     | Approved hash is not built or released                                                          | Approve the hash `prs approve --list` shows                            |
| PS5104     | Approver is not a user handle                                                                   | Use your handle, like `@jane`                                          |
| PS5105     | Approval record exists                                                                          | Delete it in a commit to withdraw it                                   |
| PS5106     | CODEOWNERS not managed by this project                                                          | Add the marker line the message names                                  |
| PS5107     | CODEOWNERS owner or path refused                                                                | Use Git host identities and plain paths                                |
| PS5108     | Git missing, no repository, shallow history, Git failed or history that does not explain `HEAD` | Run it in a full Git checkout with git on PATH, see the releases guide |
| PS5109     | Approval record invalid or misplaced                                                            | Fix, move or delete it in a commit                                     |

PS5109 is a warning when `prs approve --list` reads such a record, or a modified one (its bytes are
not the ones Git has) or one with a role that is not in `governance.roles`. It is an error, with
exit code 1, when the path `prs approve` writes to has a symbolic link, a file where a directory
goes, or a name that differs only in case from an existing one.

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
