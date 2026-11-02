---
title: Policy Engine
description: Enforce declarative organization policies on skill extensions and prompts during validation
---

# Policy Engine

The policy engine checks skill extensions and `@prompts` entries against declarative organizational rules.
Policies are evaluated by `prs validate` and `prs check`. `prs compile` does not evaluate them.

## Configuration

Define policies in `promptscript.yaml`:

```yaml
policies:
  - name: adjacent-layers-only
    kind: layer-boundary
    description: 'Only adjacent layers can extend each other'
    severity: error
    layers: ['@core', '@team', '@project']
    maxDistance: 1

  - name: protect-content
    kind: property-protection
    description: 'Content override requires explicit approval'
    severity: warning
    properties: ['content', 'description']

  - name: approved-registries
    kind: registry-allowlist
    description: 'Extensions must come from approved registries'
    severity: error
    allowed: ['@core', '@team']
```

## Policy Kinds

Three kinds check skill extensions: `layer-boundary`, `property-protection` and `registry-allowlist`. Seven more check prompts, see [Prompt Policies](#prompt-policies).

### Layer Boundary

Controls which layers can extend which, based on distance in a defined layer hierarchy.

| Field         | Type       | Required | Description                              |
| ------------- | ---------- | -------- | ---------------------------------------- |
| `layers`      | `string[]` | Yes      | Ordered list of layers from base to leaf |
| `maxDistance` | `number`   | No       | Maximum allowed distance (default: 1)    |

Example: with `layers: ['@core', '@team', '@project']` and `maxDistance: 1`, a `@project` extension cannot directly modify a `@core` skill - it must go through `@team`.

The distance is measured between the registry of the file that defines the skill and the registry of the file that extends it. Sources outside the `layers` list, like the project's own `.prs` files, are not checked.

### Property Protection

Prevents overriding specific properties on skills.

| Field           | Type       | Required | Description                                           |
| --------------- | ---------- | -------- | ----------------------------------------------------- |
| `properties`    | `string[]` | Yes      | Properties that cannot be overridden                  |
| `targetPattern` | `string`   | No       | Glob pattern to match target skills (e.g., `@core/*`) |

When `targetPattern` is specified, the policy only applies to skills that were composed from matching registries.

### Registry Allowlist

Restricts which registries can provide extensions.

| Field     | Type       | Required | Description               |
| --------- | ---------- | -------- | ------------------------- |
| `allowed` | `string[]` | Yes      | Allowed registry prefixes |

Any extension sourced from a registry not in the `allowed` list produces a violation.

## Prompt Policies

Seven kinds read the `@prompts` entries of the resolved program: `required-metadata`, `risk-floor`, `model-allowlist`, `content-rules`, `required-approvals`, `required-evals` and `max-experiment-weight`.

### What a policy sees

For each valid entry a policy sees:

- the id `<@meta.id>/<key>`;
- the effective governance: `risk`, `owner` and `domain` from the entry, else from `@meta`, the `dataClasses` of both joined, and entry `reviewers` instead of the `@meta` ones. These are the values the prompt bundle carries, see [Application Prompts](application-prompts.md#governance);
- `model.ref`, and the inputs with their types;
- the entry's own `system` and `user` text. Composed blocks are not part of it. Only the project's own rules PS005, PS010-PS012 and PS014 scan them, with the project's rule settings.

A finding is a PS030 message at the location of the entry, so `prs validate --format json` gives the file and the line.

The release gates see a prompt version the other way round: the bundle that ships, with its composed messages, model and governance, see [Release gates](releases.md#release-gates).

### Policy risk and `match`

Every prompt kind except `risk-floor` takes an optional `match`:

| Key           | Selects a prompt when                       |
| ------------- | ------------------------------------------- |
| `minRisk`     | its policy risk is at or above this level   |
| `domains`     | its effective domain is one of these        |
| `dataClasses` | any of its effective data classes is listed |

Keys combine with AND. A policy without `match` selects every prompt. Domains and data classes compare lowercased.

When `governance.dataClasses` is set, every data class in a `match` or in a `risk-floor` row must be in it. Another value is a PS030 error that names the closest one, because a typo would make the selector or the floor match nothing. Without `governance.dataClasses` these values are not checked, and a typo matches no prompt.

Policy risk is the higher of the effective `risk` and the floor of every `risk-floor` policy, whatever the severity of that policy. A prompt without `risk` counts as `low`.

Keep in mind who controls what. The author of a prompt writes its `risk` and `domain`, and a child file can lower `risk` or change `domain` of what it inherits. Use them to select prompts, not as the boundary. Data classes in `@meta` are joined through `@inherit`, so a child file cannot drop them. Data classes on an entry are not safe the same way: a child file that replaces the whole entry with `@override` sets its own. So the boundary is a `risk-floor` on data classes set in the `@meta` of the parent, plus `required-metadata`, which makes the fields a floor reads mandatory, plus review of the files that can override entries.

### Required Metadata

Matched prompts must set governance fields.

| Field    | Type       | Required | Description                                                  |
| -------- | ---------- | -------- | ------------------------------------------------------------ |
| `match`  | object     | No       | Prompts the policy applies to                                |
| `fields` | `string[]` | Yes      | Any of `risk`, `owner`, `domain`, `dataClasses`, `reviewers` |

An empty list or an empty string counts as missing.

```yaml
policies:
  - name: governance-fields
    kind: required-metadata
    severity: error
    match: { minRisk: high }
    fields: [owner, reviewers]
```

### Risk Floor

Derives a minimum risk from what a prompt handles. Each row lists conditions and a `minimum`. A row matches when any of its conditions matches, and the floor is the highest `minimum` of the matching rows. The policy reports a prompt whose effective risk is below its floor. It takes no `match`.

| Row key       | Type       | Matches when                                                                     |
| ------------- | ---------- | -------------------------------------------------------------------------------- |
| `dataClasses` | `string[]` | any effective data class is listed                                               |
| `domains`     | `string[]` | the effective domain is listed                                                   |
| `inputTypes`  | `string[]` | any input has one of the types (a `string` input is free text, an `enum` is not) |
| `minimum`     | string     | required: `low`, `medium`, `high` or `critical`                                  |

A row needs at least one condition. A starter table, not built in:

| Condition                        | Minimum  |
| -------------------------------- | -------- |
| `phi` or `credentials`           | critical |
| `pii` or `financial`             | high     |
| `internal`, or a free-text input | medium   |
| `public` or no data class        | low      |

```yaml
policies:
  - name: data-floor
    kind: risk-floor
    severity: error
    floors:
      - { dataClasses: [phi, credentials], minimum: critical }
      - { dataClasses: [pii, financial], minimum: high }
      - { dataClasses: [internal], minimum: medium }
      - { inputTypes: [string], minimum: medium }
```

### Model Allowlist

Matched prompts must run on one of the listed models.

| Field    | Type       | Required | Description                                                                               |
| -------- | ---------- | -------- | ----------------------------------------------------------------------------------------- |
| `match`  | object     | No       | Prompts the policy applies to                                                             |
| `models` | `string[]` | Yes      | Catalog ids or aliases, resolved like [`models.supported`](../reference/config.md#models) |

An entry that is not in the model catalog is a policy error that names the closest id, and so is `inherit`. A prompt without a model, or with `inherit`, fails: the application would pick the model. PS042 still makes a floating alias an error when the effective `risk` is `high` or `critical`. It does not read the policy risk, so a floor that raises a prompt to `high` does not make PS042 stricter; list pinned ids in `models` for that.

```yaml
policies:
  - name: high-risk-models
    kind: model-allowlist
    severity: error
    match: { minRisk: high }
    models: [claude-opus-5-5]
```

### Content Rules

Runs content checks and denied phrases on the text of matched prompts.

| Field    | Type       | Required           | Description                                        |
| -------- | ---------- | ------------------ | -------------------------------------------------- |
| `match`  | object     | No                 | Prompts the policy applies to                      |
| `checks` | `string[]` | `checks` or `deny` | Content rules to run, by name or id                |
| `deny`   | `string[]` | `checks` or `deny` | Phrases the text must not contain                  |
| `allow`  | `string[]` | No                 | Blocked-pattern sources exempt for matched prompts |

`checks` takes `blocked-patterns` (PS005), `suspicious-urls` (PS010), `authority-injection` (PS011), `obfuscated-content` (PS012) and `unicode-security` (PS014). `path-traversal` (PS013) is refused, it checks `@inherit` and `@use` paths, not prompt text. A check runs on the entry's own `system` and `user` text and reports at the policy severity, also when the project turns that rule off with `validation.rules` or `validation.disableRules`. Turning off PS030 itself, with `policy-compliance: off` under `validation.rules` or with `policy-compliance` or `PS030` in `validation.disableRules`, stops every policy, its content checks included. `validation.allowedPatterns` still applies. `allow` removes blocked patterns for the matched prompts by exact source text, like `allowedPatterns`.

`deny` matches after normalization of both the phrase and the text: NFKC, default-ignorable code points (such as zero-width characters) removed, whitespace collapsed, lowercase. It is a tripwire, not a filter. It catches a plain copy of a phrase, but anyone who writes the prompt can phrase around it. It also does not read the sentence, so "Never promise a guaranteed refund" contains "guaranteed refund".

```yaml
policies:
  - name: payments-content
    kind: content-rules
    severity: error
    match: { domains: [payments] }
    checks: [suspicious-urls, obfuscated-content]
    deny: ['guaranteed refund']
```

### Required Approvals and Required Evals

`required-approvals` and `required-evals` describe what a prompt needs before release. `prs validate`, `prs check` and `prs release build` check the definitions only. The release gates evaluate them: `prs release promote`, `prs release split`, `prs release rollback` and `prs release status --base` refuse a prompt version whose `required-approvals` policy finds no committed approval record for that hash and environment, see [Release gates](releases.md#release-gates). `required-evals` is `unavailable` in the gates, because they do not read eval results in this version: at severity `error` it blocks every matching release, at `warning` it only warns. A record binds only through review: [CODEOWNERS from Governance](codeowners.md) gives each approval role directory to its team.

| Kind                 | Field          | Type       | Required | Description                                                        |
| -------------------- | -------------- | ---------- | -------- | ------------------------------------------------------------------ |
| both                 | `match`        | object     | No       | Prompts the policy applies to                                      |
| both                 | `environments` | `string[]` | No       | Names from `releases.environments`. Absent means all               |
| `required-approvals` | `approvals`    | list       | Yes      | `{ role, count }` rows. `role` must be a key of `governance.roles` |

`count` is optional and only `1` is accepted: approval records are unsigned, so two records cannot prove two different approvers under one review.

On an experiment arm, `required-approvals` counts a record that has `maxWeight` too, up to its ceiling. For the entry hash, the control arm, a promote, `prs release split --end --keep` and a plain rollback, only a record without `maxWeight` counts. See [Max Experiment Weight](#max-experiment-weight).

```yaml
governance:
  roles:
    legal: ['@acme/legal']
releases:
  environments: [staging, prod]
policies:
  - name: high-risk-signoff
    kind: required-approvals
    severity: error
    match: { minRisk: high }
    environments: [prod]
    approvals: [{ role: legal }]
```

### Max Experiment Weight

`max-experiment-weight` limits how much traffic a non-control arm of a label experiment may get, see [Experiments](releases.md#split). The gates judge it for every arm with traffic in an environment the policy covers. The entry hash and the control arm are promotions, so the policy never judges them, and neither an arm at weight 0.

| Field          | Type       | Required | Description                                                                                  |
| -------------- | ---------- | -------- | -------------------------------------------------------------------------------------------- |
| `match`        | object     | No       | Prompts the policy applies to                                                                |
| `environments` | `string[]` | No       | Names from `releases.environments`. Absent means all                                         |
| `maxWeight`    | number     | Yes      | Percent of traffic an arm gets without approvals, at most two decimals                       |
| `approvals`    | list       | No       | `{ role }` rows. An arm above `maxWeight` needs one record of each role                      |
| `ceiling`      | number     | No       | Percent above which no arm passes, whoever approved. Needs `approvals`, at least `maxWeight` |

Percents run from 0 to 100 with at most two decimals. `ceiling` needs `approvals`, and it is at least `maxWeight`. `count` is `1`, as in `required-approvals`. Without `approvals` the cap is hard: `maxWeight` is the most an arm may get.

For an arm at weight `w`:

| Case                                                 | Result                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `w` is at most `maxWeight`                           | passed, no record needed                                                          |
| above `maxWeight`, no `approvals`                    | failed: the cap is hard                                                           |
| above `ceiling`                                      | failed, with or without records                                                   |
| above `maxWeight`, at most `ceiling` (or no ceiling) | passed when every role has a record for this hash and environment that covers `w` |

A record covers `w` when it has no `maxWeight`, or its `maxWeight` is at least `w`. Create one with `prs approve ... --env prod --max-weight 10`, see [Release gates](releases.md#release-gates). Several policies stack: each one judges the arm on its own, and every policy that matches must pass. At severity `warning` a failed check only warns.

```yaml
governance:
  roles:
    legal: ['@acme/legal']
releases:
  environments: [staging, prod]
policies:
  - name: high-risk-exposure
    kind: max-experiment-weight
    severity: error
    match: { minRisk: high }
    environments: [prod]
    maxWeight: 5
    approvals: [{ role: legal }]
    ceiling: 25
```

An arm of a high risk prompt may run up to 5 % in prod. Between 5 % and 25 % it needs a legal record that covers its weight. Above 25 % it never passes.

A record without `maxWeight` counts as a full approval, so it covers any arm weight. A record with `maxWeight` never approves the entry hash, even at `10000` (100 %): a capped approval is about traffic, not about a promotion. That holds under `required-approvals` as well. Neither a promote, `prs release split --end --keep` nor a plain rollback counts it.

`prs release status --base <ref>` reads the policies from `<ref>`, and the weights and the records from HEAD. A pull request can add a record with a high `maxWeight` next to the weight it asks for, so the review of `approvals/<role>/` by CODEOWNERS is what stops it.

The limits are the ones of [Required Approvals](#required-approvals-and-required-evals): records are unsigned, `count` is `1`, and two people mean two roles.

### Typos and unknown kinds

Prompt kinds reject unknown keys with the closest key, at every level, because a typo such as `minrisk` would quietly change what a policy selects. An unknown `kind` is a PS030 error, so a policy this version cannot evaluate never passes in silence. A `__proto__` key is refused in every policy. `policies` must be a list: written as a mapping, without the `-` before `name`, it is a PS030 error and not a project without policies.

### Starter configuration

```yaml
governance:
  roles:
    legal: ['@acme/legal']
  dataClasses: [pii, phi, financial, credentials, internal, public]

policies:
  - name: risk-set
    kind: required-metadata
    severity: error
    fields: [risk, dataClasses]

  - name: data-floor
    kind: risk-floor
    severity: error
    floors:
      - { dataClasses: [phi, credentials], minimum: critical }
      - { dataClasses: [pii, financial], minimum: high }
      - { dataClasses: [internal], minimum: medium }
      - { inputTypes: [string], minimum: medium }

  - name: governance-fields
    kind: required-metadata
    severity: error
    match: { minRisk: high }
    fields: [owner, reviewers]
```

`risk-set` makes every prompt state its risk and data classes, so unset risk does not quietly count as `low`.

### Example

A prompt that handles `pii` but says `risk: "medium"`. The project uses `data-floor`, `governance-fields`, `high-risk-models` and `payments-content` from above, and the `governance` section of the starter configuration:

```promptscript
@meta {
  id: "acme"
  syntax: "1.6.0"
  owner: "Support team"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    domain: "payments"
    dataClasses: ["pii"]
    risk: "medium"
    model: { ref: "claude-sonnet-5-5" }
    system: "You answer refund requests. Policy: http://acme.example/refunds"
    user: "Customer wrote: {{input.message}}. Never promise a guaranteed refund."
    inputs: {
      message: { type: "string", description: "Customer message" }
    }
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMjPvLES4AT3YZCs+QEYKANgoAGFeMHMA7qxjVdIAMoBXNGmbUsgjqXMBfMTFuGmYyLDhhVUFqGDBnVikAWhjydVlRCwkpeEZqCDQsCDYHAEFWOCs7QSEYuITomABHZ3gscwks0IwIVgdMdT52OHaOqWwMAGEoDDg4eFlkeTQICHkAXSiJPLgAawc+KQhnEhGJEmZsqHSGsAdGaedsxLg2WyxEgFZP+UEAzMENHAOCQHABNZjOarlSrUG7xKQNZqtOAUQQABWYUAgjDSghwWCwaEQAHpiYo+BQiKRyDBibV4cMQJtBM45vY5CAJqysKEqlZqMwOOlgD00M4sBQ+LMMABzGB+PyogByMAAblUQiQIHNqoIZc4MNQMOwYDAEfSEhRTpJWGLwulmWd4HBZTBrlh1Gg3RygXlWDL5HRBNk4Ll8oVihyuUDebCpS65T8-h1flE-n4QH41gxOFhqOp8FSyJQaPQQOraEVWPg9JmgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

```text
$ prs validate
- Loading configuration...
✖ Validation failed

Errors (5):
  ✗ [data-floor] Prompt "acme/refund-reply" has risk "medium", below "high" required for data class "pii"
    at .promptscript/project.prs:8:3
  ✗ [governance-fields] Prompt "acme/refund-reply" has risk "high" but no reviewers
    at .promptscript/project.prs:8:3
  ✗ [high-risk-models] Prompt "acme/refund-reply" uses "claude-sonnet-5-5", which is not allowed at risk "high"
    at .promptscript/project.prs:8:3
  ✗ [payments-content] Prompt "acme/refund-reply": suspicious-urls: Insecure HTTP URL detected: http://acme.example/refunds in the system message
    at .promptscript/project.prs:8:3
  ✗ [payments-content] Prompt "acme/refund-reply" contains the denied phrase "guaranteed refund" in the user message
    at .promptscript/project.prs:8:3

Warnings (2):
  ⚠ PS047: @meta: owner "Support team" is not a Git host identity
    at .promptscript/project.prs:1:1
    suggestion: Use a user (@jane), a team (@acme/legal) or an email address.
  ⚠ PS010: Insecure HTTP URL detected: http://acme.example/refunds
    at .promptscript/project.prs:7:10
    suggestion: Use HTTPS instead of HTTP for secure communication
```

The floor lifts the policy risk to `high`, so `governance-fields` and `high-risk-models` select the prompt although it says `medium`. Paths are shortened here, the CLI prints absolute paths.

## Governance Values (PS047)

PS047 (`governance-values`) runs when `promptscript.yaml` has a `governance` section and the program has `@prompts` entries. It warns on values authored on an entry or in `@meta`:

- an `owner` or a reviewer that is not a Git host identity: a user (`@jane`), a team (`@acme/legal`, GitLab subgroups allowed) or an email address of at most 254 characters;
- when `governance.dataClasses` is set, a data class outside that list, with the closest match. Values compare lowercased. Without `governance.dataClasses` data classes are not checked.

Owners and reviewers stay free strings in the language, so PS047 is a warning. Prefer teams: they change less often, and governance values are part of the content hash of a prompt bundle, so a changed owner changes the hash. A team also keeps personal data out of the bundle.

A recommended data class vocabulary:

| Data class    | Meaning                                |
| ------------- | -------------------------------------- |
| `pii`         | Data about an identifiable person      |
| `phi`         | Health information                     |
| `financial`   | Payment, account or card data          |
| `credentials` | Passwords, keys and tokens             |
| `internal`    | Company information that is not public |
| `public`      | Information that is already public     |

## Severity

- **`error`**: Validation fails (non-zero exit code)
- **`warning`**: Reported but does not fail validation (unless `--strict`)

## Policies in Extended Configs

When `promptscript.yaml` uses `extends`, the policies of the base file are kept and the project's own policies are appended after them:

```yaml
# shared/org.yaml
policies:
  - name: approved-registries
    kind: registry-allowlist
    severity: error
    allowed: ['@core', '@team']
```

```yaml
# app/promptscript.yaml
id: app
extends: ../shared/org.yaml
policies:
  - name: protect-content
    kind: property-protection
    severity: warning
    properties: ['content']
```

The project is validated against both `approved-registries` and `protect-content`. A base policy cannot be removed or redefined from the extending file: a policy with the same `name` as a base policy is a config error, and so is a `policies` value that is not a list, such as `policies: null` (a bare `policies:` key is accepted only when the base has no policies). See [Extending Configuration](../reference/config.md#extending-configuration) for the other merge rules.

## Skipping Policies

For development, use `--skip-policies`:

```bash
prs validate --skip-policies
```

The flag skips policies for one run of `prs validate`. A `skipPolicies` key under `validation` in `promptscript.yaml` is ignored by both commands. Setting `validation.rules.policy-compliance` to `off` still turns PS030 off, including from an extending file.

> **Note:** Never use `--skip-policies` in CI pipelines.

## Runnable Walkthrough

This scenario is fully self-contained - no Git host, no network. Create the files below in an empty directory, run `prs validate`, and watch PS030 fire.

```text
policy-demo/
├── promptscript.yaml
├── .promptscript/
│   └── project.prs
└── registry/
    ├── @core/
    │   └── skills.prs       # Layer 1: base skill definition
    └── @team/
        └── overlay.prs      # Layer 2: overrides content, not in the allowlist
```

```yaml
# promptscript.yaml
registry:
  path: ./registry

policies:
  - name: protect-content
    kind: property-protection
    description: 'Content override requires explicit approval'
    severity: warning
    properties: ['content', 'description']

  - name: approved-registries
    kind: registry-allowlist
    description: 'Extensions must come from approved registries'
    severity: error
    allowed: ['@core']
```

```promptscript
# registry/@core/skills.prs
@meta {
  id: "@core/skills"
  syntax: "1.5.0"
}

@skills {
  "code-review": {
    description: "Base code review skill"
    content: """
      Review code for quality, correctness, and security.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAE1MAOYQ4WagE8A9AAEWAyXADW0KHCq0AOq2kkYWDL2BbevCABNEvDSFnN5SlXGvHeccewyFL1gIwUArBQADM6sAL5aWtIOUKqGLtYsZjAAtAIAbhAwAO7WlkasJibJcIzUEGhYEGzeIABCGHAwvEnNGVnZrsqxoUUtbBzstc4gLn0ASjCZOf3JvGB2vACOAK4YUBBY4nT91AKMWKzwcDsYrGauMIwr5VsUY1ajTy4R4SBhALoMnGLi+ESkcgwdT0EDpGC0aqsfA+d5AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

```promptscript
# registry/@team/overlay.prs
@meta {
  id: "@team/overlay"
  syntax: "1.5.0"
}

@use @core/skills

@extend skills.code-review {
  content: """
    Team-specific review checklist with banking compliance steps.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAE1MAOYQ4WagE8A9AAEOpScwBuMalAziqtADqtpJGFgy9gO3rwgATRLy0hZMeUpVrxt07zjj2GQtdsBGCgBWCgAGN1YAXx0daQBXOBheaRYBSTgAa2goOBjdIg5WCw8sqByKFgsYAFoBRQgYAHdjdxZ2Tiw-EDdu1jMzABUHEmq4NBhGCEhGfhh6pt5GHAmMqBEsXkaIXF4AIwxWLNZBReYyNYPGJNEYNDgKdx6IyJBIunRsPEQ7VJh00vKNHoTDYhSwPF4AGU4mhyA1inBmLxcEkiKRyElqHFWHBeMsBBReAA5ZgbTDUDbMMDI5a8CzMRhxfTeLAQNh0XgHYqsUmc2YYKC8TCMDIYQQwB66fSGFp9cxWGw-ZhpTLZXK9Myeby+RWBABsYQiZhIEEIEFY1jEcRgOmiulEXIw1AsuJMcsqMGsyFsAAU1FccMwoFVqB5DEUnRZbABddwcUTmwRe33+mCB4MqMOO50x22xASiagQRistiu9zVRV+jABoMh2aF4ul1jPV7RhgdCT4NHnCVAkAMZS0NmsfD+V5AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

```promptscript
# .promptscript/project.prs
@meta {
  id: "demo-project"
  syntax: "1.5.0"
}

@use @team/overlay
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEV1ZmSxxG1CGiwB6GswBWMRlgFwAOqwACJGFgy9g63rwgATRL1UgTMEswC0shUsuHecAJ7sMhc5YCMFACsFAAMLqwAvurqGgCucDC8GhykUswAbjDUUBjuIBF06Nh4iCDJMKkZWTnuKiAMLOycWDy8AMqxaOQQMCZuzLy4iUSk5InUsaxwvDhZMBS8AHLMWLyY1KvMYIOzvCbMjLHaXlgQbHS8GKx9rCuXvNQVUGsYjADWGADm8zHauvquUy+MopEhpTLZXLhIweLw+CwgAIANlC0N4JAghAgrHMWAmMHUUU0cF01ww1BM0wMrCMLGs5mQlgACjlGDAcMwoNZqG5SSZySZLABdVwcEnYz4M5ms9mc7m8q78inCwkxR4k8RKM5TAE03h2BEs16yrlZB7wPEQLVscIRfJChjNah5UojMiUGj0EAQuDa-B+fJAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Run validation from the `policy-demo` directory:

```text
$ prs validate
- Loading configuration...
✖ Validation failed

Errors (1):
  ✗ [approved-registries] Skill 'code-review' was modified by registry '@team' which is not in the allowed list

Warnings (1):
  ⚠ PS030: [protect-content] Skill 'code-review' has a protected property 'content' that was overridden by '/home/you/policy-demo/registry/@team/overlay.prs'
    suggestion: Property 'content' is protected and must not be overridden by downstream layers.

$ echo $?
1
```

Two things to read from this output:

- The registry-allowlist violation is an **error**, so validation fails with exit code 1 - exactly what a CI pipeline needs.
- The property-protection violation is a **warning**, so it is reported (with its suggestion line) but does not fail the run. With `prs validate --strict` it becomes an error.

Fix the violation by allowing the `@team` registry:

```yaml
- name: approved-registries
  kind: registry-allowlist
  description: 'Extensions must come from approved registries'
  severity: error
  allowed: ['@core', '@team']
```

Re-run and the error is gone - validation succeeds with exit code 0, leaving only the `protect-content` warning.

## How It Works

Prompt kinds read the `@prompts` entries as described in [What a policy sees](#what-a-policy-sees). The skill kinds work as follows.

The policy engine operates on the resolved AST after all `@extend` and `@use` declarations have been applied. It inspects the `__layerTrace` metadata that the resolver attaches to each skill during composition. This trace records which property was modified, by which source file, and with which merge strategy. The resolver also records `__baseSource`, the file that first defined the skill, which `layer-boundary` uses as the base layer.

For each configured policy, the engine:

1. Iterates all skills in the `@skills` block
2. Reads the `__layerTrace` entries
3. Extracts the source registry from each trace entry (e.g., `@team` from `@team/overlay.prs`)
4. Evaluates the policy rules against the trace data
5. Produces violations with the policy's configured severity

## Enterprise Example

A three-layer enterprise setup:

```yaml
# promptscript.yaml

# Layer 1: Core platform (managed by platform team)
# Layer 2: Team configurations
# Layer 3: Project-level customizations

policies:
  - name: layer-governance
    kind: layer-boundary
    description: 'Enforce layer hierarchy'
    severity: error
    layers: ['@platform/core', '@teams', '@projects']
    maxDistance: 1

  - name: core-immutability
    kind: property-protection
    description: 'Core skill content cannot be overridden'
    severity: error
    properties: ['content', 'description']
    targetPattern: '@platform/core/*'

  - name: approved-sources
    kind: registry-allowlist
    description: 'Only approved registries can contribute extensions'
    severity: error
    allowed: ['@platform/core', '@teams']
```

This ensures:

- **Layer governance**: Projects can only extend team configs (not core directly)
- **Core immutability**: Core skill content and descriptions cannot be overridden
- **Source control**: Only approved registries can contribute extensions

## Validation Rule

The policy engine is implemented as validation rule **PS030** (`policy-compliance`), for skill and prompt kinds alike. It can be configured like any other rule:

```yaml
validation:
  rules:
    policy-compliance: error # default
```

Set to `off` to disable all policy checks, prompt kinds included:

```yaml
validation:
  rules:
    policy-compliance: off
```

## Programmatic API

The policy engine is available as a standalone API. This snippet runs against the walkthrough project above - `config` and the resolved AST are both loaded here, so it is executable as-is:

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { Resolver } from '@promptscript/resolver';
import { parsePolicies, evaluatePolicies } from '@promptscript/validator';

// Parse and validate policy definitions from promptscript.yaml. The context lets
// the parser check the roles, environments and model ids of prompt policies.
const config = parseYaml(readFileSync('promptscript.yaml', 'utf-8'));
const context = {
  governance: config.governance,
  releases: config.releases,
  models: config.models,
  allowedPatterns: config.validation?.allowedPatterns,
};
const { policies, errors } = parsePolicies(config.policies, context);
if (errors.length > 0) {
  throw new Error(`Policy definition errors:\n${errors.join('\n')}`);
}

// Resolve the project AST (imports and @extend applied)
const resolver = new Resolver({
  registryPath: resolve('./registry'),
  localPath: './.promptscript',
});
const resolved = await resolver.resolve(resolve('./.promptscript/project.prs'));
if (resolved.errors.length > 0 || !resolved.ast) {
  throw new Error(`Resolution failed: ${resolved.errors.map((e) => e.message).join('; ')}`);
}

// Evaluate policies against the resolved AST
const violations = evaluatePolicies(policies, resolved.ast);
for (const violation of violations) {
  console.log(`[${violation.policyName}] ${violation.message}`);
}
```

Prompt kinds have their own evaluator. It takes the same context, for the model catalog and `allowedPatterns`. Give it the canonical AST, so each finding points at its entry and not at the `@prompts` block:

```typescript
import { evaluatePromptPolicies, promptPolicySubjects } from '@promptscript/validator';

const subjects = promptPolicySubjects(resolved.canonicalAst ?? resolved.ast);
for (const violation of evaluatePromptPolicies(policies, subjects, context)) {
  const where = violation.location ? `${violation.location.file}:${violation.location.line}` : '';
  console.log(`${where} [${violation.policyName}] ${violation.message}`);
}
```

`config`, `context`, `policies` and `resolved` are the ones of the snippet above.

`promptPolicyRisk(subject, policies)` returns the policy risk of one subject, and `promptPolicyMatches(match, subject, risk)` whether a `match` selects it. A fourth argument of `evaluatePromptPolicies`, `{ risk, selects }`, replaces the subject's own risk and selection; the release gates use it to judge a bundle with the higher risk of bundle and source.

Requires the workspace packages (`@promptscript/resolver`, `@promptscript/validator`) and `yaml` (v2) as dependencies.
