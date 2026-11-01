---
title: CODEOWNERS from Governance
description: Generate the CODEOWNERS lines that make prompt owners, approval roles and config files need the right reviewers
---

# CODEOWNERS from Governance

The `governance` section of `promptscript.yaml` names who owns the setup and which teams review each approval role. On its own it is only data. `prs governance codeowners` writes it into the CODEOWNERS file of the repository, so the Git host asks the right team for a review before a pull request merges.

The command reads the config and the project, makes no network call and writes one section of the CODEOWNERS file. Everything above that section stays as you wrote it.

## Configuration

```yaml
governance:
  admins: ['@acme/prompt-platform']
  roles:
    legal: ['@acme/legal']
    security: ['@acme/appsec']
  codeowners:
    output: .github/CODEOWNERS # default
    protect: [.github/workflows]
    prompts: true # default
```

| Field                | Type     | Required | Description                                                                             |
| -------------------- | -------- | -------- | --------------------------------------------------------------------------------------- |
| `admins`             | string[] | Yes      | Owners of the config, the approvals root, the releases and the CODEOWNERS files         |
| `roles`              | object   | No       | Approval roles, each with the owners that review it. At most 32 roles                   |
| `codeowners.output`  | string   | No       | `.github/CODEOWNERS` (default), `CODEOWNERS`, `docs/CODEOWNERS` or `.gitlab/CODEOWNERS` |
| `codeowners.protect` | string[] | No       | More paths the admins own, relative to the repository root (`tools` or `./tools`)       |
| `codeowners.prompts` | boolean  | No       | Write a line for each `.prs` file that defines prompts. Default `true`                  |

Owners are Git host identities: a user (`@jane`; `.`, `_` and `-` allowed between letters or digits, like `@jane.doe`), a team (`@acme/legal`, GitLab subgroups allowed) or an email address of at most 254 characters. Prefer teams, they change less often. Role names are lowercase letters, digits and `-`, starting with a letter, at most 32 characters, and no Windows device name such as `con`.

Under `extends`, `admins`, each role's owners and `codeowners.protect` are joined with the base file, so a project can add owners but not remove them. `codeowners.prompts` and `codeowners.output` can be set by the extending file. See [Extending Configuration](../reference/config.md#extending-configuration).

## Generate the file

With the config above and this prompt:

```promptscript
@meta {
  id: "acme-support"
  syntax: "1.6.0"
  owner: "@acme/support"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    reviewers: ["@acme/payments"]
    system: "You answer refund requests."
    user: "Customer wrote: {{input.message}}"
    inputs: {
      message: { type: "string", description: "Customer message" }
    }
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMjPgFo4AVzRpm1LPLES4AT3YZCs+QEYKANgoAGPeMHMA7qxjVzIbor4B6dU1tXRAxAF8xMW4aZjIsOGF9QWoYMDVWKWUU8kNZUScJKXhGagg0LAg2LwBBVjgXD0EhFLSM5JgARzV4EKSJFIA3CBgG2llkeR8lGD9MQz52OHkAXT7BIzgOEi8ATWY1JrrR9tapdq6euApHCQk1OA8vAGF7rFjGl2pmDjzgCFY0GosBQ+HA4BgAOYwMIRUIFSQAoFwPJrCSg8FQvKCLCGNAwLybUqsCHyOiCIpwEplCpVOQgF6bd7UQToyEweSCCLwrkSLlhEBhZYMThYaiGfBEUjkGBUWggBgDDxwSqsfAWAVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

```text
$ prs governance codeowners
  ✓ .github/CODEOWNERS: created
```

`.github/CODEOWNERS` then holds:

```text
# promptscript-generated: prs governance codeowners | project: . | do not edit below
/.promptscript/project.prs @acme/payments @acme/support
/.github/workflows @acme/prompt-platform
/.promptscript/approvals @acme/prompt-platform
/.promptscript/approvals/legal @acme/legal
/.promptscript/approvals/security @acme/appsec
/.promptscript/releases @acme/prompt-platform
/.promptscript/vendor @acme/prompt-platform
/.promptscriptrc.yaml @acme/prompt-platform
/.promptscriptrc.yml @acme/prompt-platform
/promptscript.lock @acme/prompt-platform
/promptscript.yaml @acme/prompt-platform
/promptscript.yml @acme/prompt-platform
/.github/CODEOWNERS @acme/prompt-platform
/CODEOWNERS @acme/prompt-platform
/docs/CODEOWNERS @acme/prompt-platform
/.gitlab/CODEOWNERS @acme/prompt-platform
```

Commit the file. A second run changes nothing.

## The lines

Paths start at the repository root, so a project in a subdirectory gets lines like `/services/support/.promptscript/approvals`. The lines come in this order, sorted inside each group:

| Path                                                                                   | Owners                                                                                                                             |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| each `.prs` file of the repository that defines a prompt                               | the effective `owner` and `reviewers` of its prompts; the admins when they differ, or when the file feeds a prompt of other owners |
| every other `.prs` file of the repository the prompts are built from                   | admins                                                                                                                             |
| `codeowners.protect`                                                                   | admins                                                                                                                             |
| `.promptscript/approvals`                                                              | admins                                                                                                                             |
| `.promptscript/approvals/<role>`, for each configured role                             | the owners of the role                                                                                                             |
| `.promptscript/releases` and `.promptscript/vendor`                                    | admins                                                                                                                             |
| every config file name the loader tries, `promptscript.lock`, and every `extends` file | admins                                                                                                                             |
| the four CODEOWNERS locations                                                          | admins                                                                                                                             |

On GitHub the last line that matches a path wins. So the lines that pick the authority come last: approvals, roles, releases, config and the CODEOWNERS files. A `protect` path can take over a prompt file, but not a role directory or the config. The generated section also wins over the lines you wrote above it. The config names, `promptscript.lock` and the four CODEOWNERS locations are listed whether the files exist or not, so nobody can add a file there that picks other owners.

A `.prs` line takes `owner` and `reviewers` the way the prompt bundle does: from the entry, else from `@meta`. A prompt without either gets a warning, and the admins review its file.

The files a prompt is built from without defining it, an `@inherit` parent, a `@use` import or a file of a composed block, belong to the admins. They change the prompt as much as its own file, and their `@meta` can change its owners. Files outside the repository, like the registry cache, get no line; vendored registry files are under `.promptscript/vendor`. With `codeowners.prompts: false` the command writes no `.prs` lines and does not resolve the project.

A file can define prompts and also feed other prompts. The command follows where every value of a prompt comes from: its entry, the blocks it composes, and the `@meta` of the entry file and its `@inherit` parents, which reach every prompt. When a file feeds a prompt whose owners differ from the owners of the file's own prompts, the admins review that file, with a warning. Any one owner on a line can approve a change, so adding the admins next to the owners would not protect the other prompt. The same goes for a file with prompts of different owners. Keep shared blocks and `@meta` defaults in files without prompts, and give prompts of different owners their own files, so each file keeps its owners.

Approval directories belong to the role teams, not to the prompt owners. Otherwise the owners of a prompt could merge a legal sign-off without legal.

Only the project the command runs in gets lines. Other projects in the same repository get none, and one CODEOWNERS file has one managed project.

### GitLab

For `.gitlab/CODEOWNERS` the section starts with a `[PromptScript]` section header right after the marker. GitLab reads a pattern without a glob or a trailing slash as one exact file, so every directory line is written twice, as `/.promptscript/approvals/legal` and `/.promptscript/approvals/legal/`, and so is every `protect` path. GitLab applies every section, so a line you wrote above the marker that matches a prompt file applies next to the generated one: its owners are asked to review too.

## Rules for the file

- The command owns the file from its marker line to the end and keeps every byte above it, a byte order mark and non-UTF-8 bytes included. The marker must be a full line of its own, with nothing after it.
- When the file does not exist, the command creates it.
- When the file has no marker, the marker of another project, a marker with trailing spaces, or two marker lines, the command changes nothing and exits with code 2 (`PS5106`), or 1 with `--check`. The message names the marker line to use.
- A file with a NUL byte is refused with `PS5106` too: GitLab reads it as binary and ignores all of it.
- In `.gitlab/CODEOWNERS` a `[PromptScript]` section above the marker is refused with `PS5106` too, in any case and with or without `^`. GitLab merges sections of the same name, so its lines, an exception like `!/.promptscript/approvals/**` included, would change the generated ones.
- On GitHub, when a line you wrote above the marker matches a `.prs` file that a generated line covers, the command warns: your line no longer applies to that file. A pattern with more than three wildcards (`*` or `?`) gets no such warning: checking it against long file names would take too long.
- A host reads only one CODEOWNERS file. GitHub looks in `.github/`, the root, then `docs/`. GitLab looks in the root, `docs/`, then `.gitlab/`. When a file exists at a location read before the output, the command warns.
- A file that differs only in CRLF line ends, as a checkout with `core.autocrlf` writes it, counts as current.
- Every owner must be a Git host identity. A bad value in `governance` is `PS5101`. A bad owner or reviewer on a prompt is `PS5107` and lists every bad value.
- Paths may hold only letters, digits, `.`, `_`, `-`, `/`, `@` and `+`. A space or anything else is `PS5107`, since hosts read it differently: some take `\ ` as an escaped space, others end the path there and read the rest as owners.
- CODEOWNERS matches the path Git has, byte for byte, never the target of a link. A prompt file, a source file, a config file, the lockfile, the approvals, releases or vendor directory, or the output that goes through a symbolic link is `PS5107`, and so is a file whose case differs from the path Git has. A file Git does not track, like an `extends` file under `node_modules/`, gets a warning: CODEOWNERS cannot own it. Put its directory and the files that install it, like `package.json` and the lockfile, in `protect`. `--check` fails on such a file unless a `protect` path covers it. A `protect` path on the untracked directory, like `node_modules/@acme`, only silences that check: `package.json` and the lockfile that install it still need their own `protect` lines.
- In every refused case nothing is written.

## Check it in CI

`--check` writes nothing. It exits with code 1 when the file does not exist, differs from what the command would write, when a file at an earlier location would make the host ignore it, or when a file the prompts or the config need is not tracked by Git and no `protect` path covers it.

```text
$ prs governance codeowners --check
  ✗ .github/CODEOWNERS is out of date. Run prs governance codeowners and commit the result.
```

```yaml
# .github/workflows/codeowners.yml
name: CODEOWNERS

on:
  pull_request:
    branches: [main]

jobs:
  codeowners:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install the CLI version the lockfile pins
        run: npm ci

      - name: CODEOWNERS is generated from governance
        run: npx --no-install prs governance codeowners --check

      - name: GitHub reads every line
        run: test "$(gh api "repos/${{ github.repository }}/codeowners/errors?ref=${{ github.event.pull_request.head.sha }}" --jq '.errors | length')" = 0
        env:
          GH_TOKEN: ${{ github.token }}
```

The recipe expects `@promptscript/cli` in the `devDependencies` of `package.json`, so the check runs the version your lockfile pins. The last step asks GitHub about the CODEOWNERS file of the pull request head and fails when GitHub cannot read one of its lines. GitHub skips such lines and does not fail on them.

The command resolves the project read-only and fetches nothing. A project with a Git registry needs it in `.promptscript/vendor` (`prs vendor sync`, then commit it) or in the cache of the runner, else the check fails.

## Host settings

The file binds only when the host enforces it. On GitHub, protect the default branch and turn on:

- require a pull request before merging, with review from code owners;
- require approval of the most recent reviewable push;
- dismiss stale pull request approvals when new commits are pushed;
- do not allow bypassing the settings, for administrators too;
- block force pushes;
- require the `--check` job as a status check.

The last one matters. A change to an `@inherit` parent, a `@use` import or an `extends` file can change who owns a prompt file or which files are listed. CODEOWNERS sees only the file names in a pull request, so such a change is caught only when the `--check` job must pass before merge.

A file in `.github/workflows` can change what CI checks. The `protect` line gives those files to the admins. A ruleset with a required workflow protects the check itself.

## What CODEOWNERS does not give you

- GitHub matches CODEOWNERS paths byte for byte and case-sensitively. The role lines cover exactly `.promptscript/approvals/<role>`, in lowercase. A file at `.promptscript/approvals/Legal/...` or under a look-alike Unicode name is not matched by the `legal` line, even on a disk that ignores case. The same holds for the releases, the vendor directory and the config names.
- Any one listed owner can approve a line. A line does not ask for two teams. So adding an owner is the dangerous direction: every owner you add to a prompt, a role or the admins can approve alone.
- GitLab sections with approval counts and optional sections are not generated.
- The lines decide who must review an approval record. The [release gates](releases.md#release-gates) then count the committed records, so a `required-approvals` policy only binds when the role directories have their owners and code owner review is required.

## Options

| Option                | Description                                           | Default                                        |
| --------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `--output <path>`     | CODEOWNERS file, one of the four locations            | `codeowners.output`, else `.github/CODEOWNERS` |
| `--check`             | Write nothing, exit 1 when the file is not up to date | -                                              |
| `--format <format>`   | `text` or `json`                                      | `text`                                         |
| `-c, --config <path>` | Path to a custom config file                          | -                                              |
| `--cwd <dir>`         | Working directory (project root)                      | -                                              |

Exit codes: 0 written or current, 1 error or outdated with `--check`, 2 the file is not managed by prs (`PS5106`). With `--check` every failure exits with 1, `PS5106` included.
