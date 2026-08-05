---
title: Portable Hooks
description: Repository-local lifecycle policy with scripts, project cwd, terminal events, and target overrides
---

# Portable Hooks

Goal: fail terminal commands while the current Git diff contains whitespace
errors. The policy is deterministic and does not depend on target-specific
hook payload fields.

## Project Layout

```text
.promptscript/
|-- project.prs
`-- scripts/
    `-- check-terminal.mjs
```

## Hook Source

```promptscript
@meta {
  id: "portable-hooks-example"
  syntax: "1.5.0"
}

@hooks {
  terminal-policy: {
    event: "pre-terminal-command"
    script: {
      path: ".promptscript/scripts/check-terminal.mjs"
      interpreter: "node"
      args: ["--strict"]
    }
    cwd: "project"
    timeoutMs: 30000
    continueOnFailure: false
    targets: {
      factory: {
        statusMessage: "Checking terminal policy"
      }
      vscode: {
        matcher: "run_in_terminal"
      }
      github: {
        enabled: false
      }
    }
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEg0zagIBGsALQ5mzANZx1RUuRjyxEuAE92GQrPkBGCgDYKABlOsAvmLHctuuGEzQQ5qEghWDCh1RSgIRgtZUXEJQRgAN04sOwVqGHVQ8MjolhISDFYpD1TBOEZqCDRsoJSazFwcqmpmMiw6hqaAen7GvsHGHBhGHQKYMIioihIAKzhqmsl2OZp+OZzWZikTEGCajGoAczhZZHl1dTgsBsYseQBdU8FvVsFGAHcZHJcsxllNXicflgIHxmABXLAAWWuggAzK50e4fix2BFYTAAPKsABiGGgsLysjAUTgJkh5wu-GRyQ2gipLyUiRaLPMAiwsLgCPgcAwDJyAGFJtMIhcQnMilFBLF4hZ1jVviz0nVDjAkp8auUsBM9kDqLDWAB9CLmwoLKCq1LqjYXCC4WEqXU-GqcDBqGCAqlQGl6r6fR3fTwgTxvBhZagWfCGMiUGj0ECZWgQNj4eyRoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Target Configuration

```yaml
# promptscript.yaml
id: portable-hooks-example
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

targets:
  - factory:
      version: full
  - github:
      version: full
```

## Script

```javascript
import { spawnSync } from 'node:child_process';

const strict = process.argv.includes('--strict');
const result = spawnSync('git', ['diff', '--check'], {
  encoding: 'utf8',
  shell: false,
});

if (result.error) {
  console.error(`Unable to run git diff --check: ${result.error.message}`);
  process.exit(strict ? 1 : 0);
}

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status ?? (strict ? 1 : 0));
```

Save this file as `.promptscript/scripts/check-terminal.mjs`. The `--strict`
argument belongs to this script. Native hook payloads continue through standard
input and are intentionally ignored because the policy checks repository state,
not command text.

## Behavior

- `script` path must remain under `.promptscript/scripts/`.
- `cwd: "project"` requires verified project-root execution.
- Missing project root fails closed before script starts.
- Factory runs the hook for its terminal tool using a native default matcher.
- VS Code uses the explicit `run_in_terminal` matcher.
- Disabled GitHub override emits no hook.
- Best-effort or unsupported terminal coverage reports PS4002.

## Expected Outputs

| Configured target | Expected hook output                            |
| ----------------- | ----------------------------------------------- |
| Factory           | `.factory/hooks.json` with a `PreToolUse` entry |
| GitHub            | No Copilot CLI or cloud hook for this policy    |
| VS Code override  | `.github/hooks/promptscript-vscode.json` entry  |

The GitHub target also emits its normal instruction output. The `vscode`
override requests the separate VS Code Agent hook file, while
`github.enabled: false` omits this unsupported terminal policy from GitHub
Copilot hooks.

## Verify the Script

Run the script from the repository root:

```bash
node .promptscript/scripts/check-terminal.mjs --strict
```

Exit code `0` means `git diff --check` found no whitespace error. Introduce a
temporary trailing-whitespace change in a throwaway branch to confirm a
nonzero exit, then remove that test change.

## Verify Compilation

```bash
prs validate --strict
prs compile --dry-run
prs compile
git diff -- .factory/hooks.json .github/hooks/
```

Confirm the expected output paths and run the generated hook once in Factory
and VS Code before rollout. Never commit executable policy without code review
and least-privilege analysis.

See [Hooks and Workflows](../features/automation.md) for capability matrix and
root strategy.
