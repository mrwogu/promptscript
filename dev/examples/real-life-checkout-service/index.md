# Real-Life Tutorial: Checkout Service

This tutorial follows a platform team adding PromptScript to an existing TypeScript checkout service. The repository already contains hand-written Claude Code and GitHub Copilot instructions. The team needs one reviewed source of truth without losing payment rules or silently replacing user-owned files.

Open the [Playground](/playground/) and choose **Real-Life Checkout Service** to compile the same three PromptScript files in your browser.

## Scenario

The checkout service owns payment authorization, retries, and webhook handling. Its deployment has four requirements:

1. Organization rules apply to every service.
1. Payment rules remain reusable by other payment services.
1. Checkout-specific policy can replace one inherited standard without duplicating the full organization policy.
1. Claude Code and GitHub Copilot receive native instructions, skills, agents, hooks, and release prompts from the same source.

Acceptance criteria:

- Every `.prs` file uses syntax `1.5.0`.
- `prs validate --strict` succeeds.
- The resolved testing standard is `Minimum 95% coverage for payment flows`.
- Generated output contains the payment security skill and reviewer agent.
- CI fails when committed generated files drift from PromptScript sources.
- Existing instruction files are backed up and reviewed before takeover.

## Repository Layout

Start with this layout:

```text
checkout-service/
├── .github/
│   └── copilot-instructions.md
├── .promptscript/
│   ├── org-base.prs
│   ├── payment-policy.prs
│   └── project.prs
├── src/
│   ├── checkout/
│   └── webhooks/
├── AGENTS.md
├── CLAUDE.md
├── package.json
└── promptscript.yaml
```

`AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` represent existing, user-owned instructions. Do not delete them to make compilation pass.

## Step 1: Add Organization Policy

Create `.promptscript/org-base.prs`:

```
@meta {
  id: "commerce-org-base"
  syntax: "1.5.0"
  tags: ["commerce", "typescript"]
}

@identity {
  """
  You are an engineering assistant for a production commerce platform.
  Prefer safe, observable, reversible changes.
  """
}

@context {
  language: "TypeScript"
  runtime: "Node.js 20"
  packageManager: "pnpm"
}

@standards {
  testing: ["Minimum 80% coverage"]
  git: {
    format: "Conventional Commits"
  }
  review: ["Require one approving review"]
  operations: ["Add structured logs", "Document rollback steps"]
}

@restrictions {
  - "Never commit credentials or production customer data"
  - "Never bypass required checks on protected branches"
}
```

This file provides defaults. Service repositories inherit it and can make explicit, reviewable changes after inheritance.

## Step 2: Add Reusable Payment Policy

Create `.promptscript/payment-policy.prs`:

```
@meta {
  id: "payment-policy"
  syntax: "1.5.0"
  tags: ["payments", "pci"]
  params: {
    provider: enum("Stripe", "Adyen") = "Stripe"
    maxRetries: number = 3
  }
}

@standards {
  testing: ["Test approved, declined, timeout, and retry paths"]
  security: ["Tokenize payment data", "Verify {{provider}} webhook signatures"]
  reliability: [
    "Use idempotency keys",
    "Bound {{provider}} retries to {{maxRetries}} attempts with backoff"
  ]
}

@restrictions {
  - "Never log PAN, CVV, access tokens, or raw webhook secrets"
  - "Never exceed {{maxRetries}} {{provider}} payment retries"
}
```

The payment policy is composed with `@use`, so another payment service can use the same rules without inheriting checkout identity or project metadata. `provider` accepts only `Stripe` or `Adyen`. `maxRetries` defaults to `3`, so services override it only when their provider contract requires another limit.

## Step 3: Compose Checkout Policy

Create `.promptscript/project.prs`:

```
@meta {
  id: "checkout-service"
  syntax: "1.5.0"
  tags: ["checkout", "payments", "production"]
}

@inherit ./org-base
@use ./payment-policy(provider: "Adyen", maxRetries: 2)

@context {
  service: "checkout"
  framework: "Fastify"
  database: "PostgreSQL"
  owns: ["payment authorization", "payment retries", "webhook processing"]
}

@standards {
  @header "Checkout Engineering Policy"
  @header git-commits "Checkout Commit Policy"

  observability: [
    "Attach checkoutId and paymentAttemptId to structured logs",
    "Emit latency and failure metrics for each payment provider"
  ]
}

@override standards.testing {
  ["Minimum 95% coverage for payment flows"]
}

@extend restrictions {
  - "Never change retry or idempotency behavior without integration tests"
}

@skills {
  payment-security: {
    description: "Review checkout changes for payment and data-handling risk"
    allowedTools: ["Read", "Grep", "Bash"]
    content: """
      Review changed checkout and webhook code.
      Check authorization boundaries, idempotency, secret handling,
      webhook verification, logs, and failure recovery.
      Report findings by severity with concrete remediation.
    """
  }
}

@agents {
  payment-reviewer: {
    description: "Review checkout changes before merge"
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    skills: ["payment-security"]
    content: """
      Inspect the diff, affected tests, and operational impact.
      Reject changes that weaken idempotency, webhook verification,
      auditability, or rollback safety.
    """
  }
}

@hooks {
  verify-payment-edits: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "test", "--", "src/checkout", "src/webhooks"]
    timeoutMs: 120000
    targets: {
      github: {
        matcher: "edit|create"
      }
    }
  }
}

@shortcuts {
  release-readiness: {
    description: "Prepare a checkout release for human approval"
    prompt: true
    content: """
      1. Review changes to checkout, retries, and webhook processing
      2. Run unit and integration tests for payment flows
      3. Verify dashboards, alerts, feature flags, and rollback steps
      4. Summarize residual risk
      5. Stop before deployment and request human approval
    """
  }
}
```

Declaration order is intentional:

| Declaration                       | Result                                                |
| --------------------------------- | ----------------------------------------------------- |
| `@inherit ./org-base`             | Adds identity, context, standards, and restrictions   |
| Parameterized `@use`              | Adds payment policy for Adyen with two retries        |
| Local `@context` and `@standards` | Adds checkout ownership and observability             |
| `@override standards.testing`     | Replaces inherited and imported testing values        |
| `@extend restrictions`            | Appends one checkout-specific restriction             |
| Capability blocks                 | Adds native skill, reviewer, hook, and release prompt |

The override removes both `Minimum 80% coverage` and the imported payment test list from `standards.testing`. Template parameters resolve before output, so no `{{provider}}` or `{{maxRetries}}` placeholders remain. Other organization and payment standards remain.

## Step 4: Configure Native Targets

Create `promptscript.yaml`:

```yaml
id: checkout-service
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

targets:
  - claude:
      version: full
  - github:
      version: full
```

`version: full` is required for separate native capability files. Simpler target modes may emit only the main instruction file.

## Step 5: Validate Before Writing

Install the CLI and validate source:

```bash
npm install -g @promptscript/cli@1.16.0
prs validate --strict
prs compile --dry-run
prs diff --all --full
```

Stop if validation fails or the full diff omits existing business rules. Resolve source errors first. Do not use `--force` as an error bypass.

## Step 6: Take Over Existing Output Safely

Create a recoverable baseline before PromptScript owns existing files:

```bash
git status --short
git switch -c chore/adopt-promptscript

printf '%s\n' \
  '/.promptscript-migration-backup/' \
  '/.promptscript-rollback-output-*/' >> .git/info/exclude

mkdir .promptscript-migration-backup
for path in AGENTS.md CLAUDE.md .claude .github; do
  if [ -e "$path" ]; then
    cp -R "$path" .promptscript-migration-backup/
  fi
done
```

Copy only paths that exist. Keep this local backup out of the commit. The backup covers user-owned main instructions and any existing native capability directories. Record the pre-adoption commit for a complete rollback after merge:

```bash
git rev-parse HEAD > .promptscript-migration-backup/pre-adoption-commit
```

Review the complete plan:

```bash
prs validate --strict
prs compile --dry-run
prs diff --all --full
```

Approve every conflict path and confirm the PromptScript source preserves all required policy. Then perform one controlled takeover:

```bash
prs compile --force
git status --short
git add --intent-to-add -- \
  .promptscript \
  promptscript.yaml \
  AGENTS.md \
  CLAUDE.md \
  .claude \
  .github
git diff -- .
prs diff --all --full
```

Run this before staging migration content. `--intent-to-add` makes new files visible to `git diff` without staging their content. Expected final `prs diff --all --full` result: no drift. Expected Git status and diff: only approved PromptScript sources, configuration, and generated target files.

## Step 7: Inspect Generated Artifacts

Exact native paths depend on target capabilities and target mode. This configuration generates main instructions plus supported capability files, including:

```text
AGENTS.md
CLAUDE.md
.claude/agents/payment-reviewer.md
.claude/commands/release-readiness.md
.claude/settings.json
.claude/skills/payment-security/SKILL.md
.github/copilot-instructions.md
.github/agents/payment-reviewer.md
.github/hooks/promptscript.json
.github/prompts/release-readiness.prompt.md
.github/skills/payment-security/SKILL.md
```

`CLAUDE.md` is Claude Code's main instruction file. GitHub full mode also generates top-level `AGENTS.md` as its agent index. PromptScript can emit its built-in skill beside project skills.

Inspect main instructions for these resolved rules:

```text
Minimum 95% coverage for payment flows
Use idempotency keys
Verify Adyen webhook signatures
Bound Adyen retries to 2 attempts with backoff
Don't exceed 2 Adyen payment retries
Don't change retry or idempotency behavior without integration tests
```

GitHub normalizes negative restrictions from `Never` to `Don't`. Also verify:

- `Minimum 80% coverage` is absent.
- `Test approved, declined, timeout, and retry paths` is absent from the replaced testing field.
- `{{provider}}`, `{{maxRetries}}`, and default provider `Stripe` are absent.
- Organization Git and operations standards remain.
- Payment security and reliability standards remain.
- The payment reviewer references the payment security skill where supported.
- Claude hook matcher is `Edit|Write`.
- GitHub hook matcher is `edit|create`.
- Release readiness is a native Claude command and GitHub prompt file.

## Step 8: Add CI Drift Protection

Commit generated output so reviewers can inspect platform-specific changes. Add `.github/workflows/promptscript.yml`:

```yaml
name: PromptScript

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g @promptscript/cli@1.16.0
      - run: prs validate --strict
      - run: prs compile
      - run: test -z "$(git status --porcelain --untracked-files=all)"
```

The final step catches modified, deleted, and untracked generated files. Update the pinned CLI version through the same reviewed dependency process as other build tools.

## Step 9: Roll Out

Use a small rollout before organization-wide adoption:

1. Merge the checkout service first.
1. Ask payment and platform owners to review generated Claude and GitHub files.
1. Track compile failures, drift failures, review defects, and developer feedback for one release cycle.
1. Reuse `payment-policy.prs` in one additional payment service.
1. Promote the organization base only after both services produce equivalent policy and stable CI.

Operational success signals:

- No lost instruction or ownership conflicts.
- No unreviewed generated-file drift.
- Payment reviewer catches violations before merge.
- Developers can trace every generated rule to one `.prs` declaration.
- Rollback remains tested and documented.

## Rollback

Before the adoption commit, preserve current output and restore the complete pre-adoption target set:

```bash
rollback_dir=".promptscript-rollback-output-$(date +%Y%m%d%H%M%S)"
mkdir "$rollback_dir"

for path in AGENTS.md CLAUDE.md .claude .github; do
  if [ -e "$path" ]; then
    mv "$path" "$rollback_dir/"
  fi
  if [ -e ".promptscript-migration-backup/$path" ]; then
    cp -R ".promptscript-migration-backup/$path" "$path"
  fi
done
```

This removes newly generated capability files from active target paths while preserving them in a timestamped local directory. Confirm no user work was added under `.claude/` or `.github/` after the backup before running it.

After the adoption commit, revert that complete commit instead of restoring individual generated paths:

```bash
git log --oneline -- .promptscript/project.prs
git revert <adoption-commit>
git status --short
```

The revert restores modified files and removes generated files introduced by the adoption commit. Verify restored target files against the backup. Compare the adoption commit's parent with the recorded pre-adoption commit if adoption was split across multiple commits.

Then fix PromptScript source, rerun the dry run and full diff, and repeat the controlled takeover. Do not delete target files, disable a target, or keep `output.overwrite: true` merely to hide an ownership or parity problem.

## Production Checklist

- Source files use syntax `1.5.0`.
- Composition order has a written reason.
- Replacement values are asserted by reviewers or tests.
- Existing target files have recoverable backups.
- `prs validate --strict` passes.
- `prs compile --dry-run` shows only expected paths.
- `prs diff --all --full` is empty after compile.
- Git diff contains only approved source and generated changes.
- CI reproduces output and fails on drift.
- Payment and platform owners approve rollout and rollback.
