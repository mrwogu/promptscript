---
title: Upgrade 1.15 to 1.16
description: Safe upgrade workflow for PromptScript syntax, block shapes, replacement operations, and Factory hooks
---

# Upgrade 1.15 to 1.16

PromptScript 1.16 adds syntax `1.5.0` with section headers, atomic replacement,
declaration-order operations, and unquoted `${VAR}` values, plus canonical block
shape diagnostics, expanded portable hooks, and automatic migration of legacy
Factory hooks.

Upgrade on a dedicated branch. Keep source instructions and generated outputs
under version control before starting.

## 1. Record a Clean 1.15 Baseline

Run the existing 1.15 toolchain before changing dependencies or syntax:

```bash
git status --short
prs --version
prs validate --strict
prs diff --all --full
```

Proceed only when the worktree is clean, strict validation exits successfully,
and the diff contains no unexplained generated-output drift. Commit or back up
any source, configuration, lockfile, and user-owned target output that is not
already recoverable.

## 2. Update CLI

```bash
npm install -g @promptscript/cli@1.16
prs --version
```

For repository-local installations, update lockfile through the project's
package manager instead.

## 3. Audit Declaration Order and Preview

Syntax `1.5.0` applies `@inherit`, `@use`, local blocks, `@extend`, and
`@override` in declaration order. Before changing syntax declarations, locate
composition and modification directives:

```bash
rg -n '^\s*@(inherit|use|extend|override)\b' --glob '*.prs' .
```

For each match, confirm that `@extend` and `@override` follow creation of their
target and that later inheritance, imports, or local blocks intentionally take
precedence. Move declarations while the file still uses its original syntax,
then validate the behavior before upgrading.

```bash
prs upgrade --dry-run
```

Review every file. Then apply:

```bash
prs upgrade
```

`prs upgrade` updates `.prs` syntax declarations. If `promptscript.yaml`
declares `syntax`, align it with project entry syntax after review.

`prs upgrade` pre-parses all discovered files before writing. Each replacement
is atomic, but the multi-file operation is not transactional: a later
write-time failure does not roll back files already updated. Keep the worktree
clean so version control can restore the baseline.

## 4. Resolve Canonical Shape Diagnostics

```bash
prs validate --strict
```

PS038 identifies unsupported or target-dependent legacy block bodies.

Common changes:

```promptscript
# Before: target-dependent multiline shortcut.
@shortcuts {
  "/review": """
    Review current changes.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AIRgwZmoYMJFqdWEAWik0TiltEjcoLGgIVjs4HEqsRjcsCh9+AaGR015Aq3CQAHoqgDcIGHMIlJBY3YXggCUYdc2dN2oq7UYcDFZ6uHGFvbz8kHyAXQZOLGpHfCIpHIMCotBADFWMFoEDY+FS7yAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

```promptscript
# After: explicit portable command shape.
@shortcuts {
  "/review": {
    description: "Review current changes"
    content: """
      Review correctness, security, and tests.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AQTAOajCicghGE3tmahEAI1gdZhISDE9ZHAw0GAoffjgcRqxGN1NeQKtwkAB6ahgANwgYcwiw2eDgqThGagg0LAg2FJAAJVX18x03amXtRj7WdXg83fb2TiwL2JAcS+1zWG3ajxgjCwrHgcDoskhDxMjnh3RkHDgpiGc2CAM+vEKBRA+QAugxftRHPgiKRyIMaPQQCsYLQzqx8KliUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

See [Values and Block Bodies](../reference/language/values-and-block-bodies.md)
for remediation patterns.

## 5. Review Replacement Intent

Existing `field!` remains supported. Migrate only where atomic target
replacement makes intent clearer.

```promptscript
@meta { id: "service" syntax: "1.5.0" }

@standards {
  testing: ["Use Jest", "Use Mocha"]
}

@override standards.testing {
  ["Use Vitest"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHBjUAbhEYwZguAE92GQpJkBGCgFYKABjUBfKa2vc4A1mIzUxcYdcGCO9iKwDmksgyAKpyggBS8FgydNIgoTCCALLMjDgYMgC61lY2rNzMCvLU4on2GI7OrhTeWL5+7qyeQfFhAGoQtVk5IBaZDJxY1Br4RKTkMFS0IAxFtBBs+Pq9QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Use `@extend` for additive changes, `field!` for compatible direct field
replacement, and `@override` for complete existing targets.

## 6. Add Section Headers Only When Needed

`@header` changes human-readable output titles, not native schemas:

```promptscript
@standards {
  @header "Engineering Standards"
  @header git-commits "Commit Policy"

  code: ["Use strict TypeScript"]
  git: { format: "conventional" }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKsBHBgJGGpwkABRVnUIVhgmrvVeAGUy8QqqvOD+esbmzqwAWl0SE2UIgGFmEiWsXgAFZigIRkc8uJYpMOQIgFU4O1LqQ+2AFUc0GAHGB7QsCIBdONmYWAKmY1BI2BSTDYADdOFgIGwMFAIrxCgUQPlfgw4dRHPgiKRyDAqLQQAxYbQEax8KkMUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

No migration required when default target headings are acceptable.

## 7. Preview Factory Hook Migration

Projects that previously emitted Factory hooks into
`.factory/settings.json` should run:

```bash
prs compile --dry-run
```

When `.factory/hooks.json` is absent, PromptScript plans an all-or-nothing
migration:

- PromptScript-owned legacy hooks move to `.factory/hooks.json`.
- Unrelated settings remain in `.factory/settings.json`.
- Unknown events, malformed entries, or mixed ownership abort migration.
- `--no-migrate-factory-hooks` keeps warning-only PS4002 behavior.

Apply after reviewing both files:

```bash
prs compile
```

## 8. Clean Up Codex Hook Configuration

Through 1.15, Codex hooks were emitted as inline `[[hooks.*]]` tables in
`.codex/config.toml`. From 1.16 they are written to `.codex/hooks.json`, which
matches the schema Codex documents for project hooks.

Codex reads both locations, so a stale `config.toml` group would run alongside
the new `hooks.json` and every hook would fire twice. `prs compile` prunes the
stale groups for you:

```bash
prs compile --dry-run
```

- Hook groups written by 1.15 or earlier are removed from `.codex/config.toml`.
- Unrelated keys such as `max_threads` and `model` stay in `config.toml`.
- Hand-written groups in the native Codex schema are preserved untouched.
- `.codex/config.toml` is deleted when nothing but stale groups remained.

Confirm the result after applying:

```bash
prs compile
cat .codex/hooks.json
```

Hooks that were customized directly in `.codex/config.toml` rather than in
`@hooks` are not migrated. Declare them in the source and recompile:

```promptscript
@hooks {
  format-on-edit: {
    event: "post-tool-use"
    matcher: "Edit"
    command: ["pnpm", "format"]
    targets: {
      codex: { enabled: true }
    }
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34cZmYAa2VAqxVmahJsAFo2RukTMOrg4JgAN04sFJA0ZjgsRqwyqEa3OBg8rt4GrEYcGGpBgFFxE3mu3QbPMOQItFY0Egi6cPA6pYiAXTjgkWp1YTgOp73mKWTeYF4nAwACNYKEFNQ3HZCjVgjC4T58iB8vcGP1qI58ERSOQYFRaCAGH1aBA2PhUsigA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## 9. Review Portable Hooks

Repository-local programs should use `script` and explicit project cwd:

```promptscript
@hooks {
  terminal-policy: {
    event: "pre-terminal-command"
    script: {
      path: ".promptscript/scripts/check-terminal.mjs"
      interpreter: "node"
    }
    cwd: "project"
    targets: {
      github: { enabled: false }
    }
  }
}
```

Project-root wrappers fail closed when required root discovery fails. Review
PS4002 warnings for best-effort and unsupported terminal interception.

## 10. Release Validation

```bash
prs validate --strict
prs compile --dry-run
prs diff --all --full
prs compile
git diff -- .
prs diff --all --full
```

Review:

- `.prs` syntax changes.
- PS038 remediation.
- Factory hook file movement.
- Generated target output.
- Lockfile or vendor changes.
- Target-specific PS4002 warnings.

The upgrade passes only when:

- Strict validation exits successfully with no unresolved warning promoted by
  project policy.
- Dry-run reports only approved paths and no ownership conflict.
- The pre-compile PromptScript diff contains only intended generated changes.
- The Git diff contains only reviewed source, configuration, lockfile, hook,
  and generated-output changes.
- The final PromptScript diff is empty after compilation.
- Every configured hook executes successfully in a representative target
  runtime, or its documented unsupported-target warning is accepted.

Commit the upgrade as a dedicated change after all gates pass. Do not publish
partially reviewed generated output.

## Enterprise Rollback

Prepare rollback before rollout:

1. Pin the previously approved 1.15 CLI version and retain its package lock.
2. Keep the upgrade source, configuration, lockfile, and generated outputs in
   one revertible commit or pull request.
3. Record backups for any user-owned output approved for takeover.
4. Assign an owner, rollback approver, and maximum recovery time.

If a production issue appears, pause rollout and preserve diagnostics. Revert
the upgrade commit with `git revert`, restore any backed-up user-owned output,
install the pinned 1.15 toolchain, and rerun strict validation and compilation.
Review the complete Git diff before redeploying. Do not use a destructive
working-tree reset as an operational rollback.
