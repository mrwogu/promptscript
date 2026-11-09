---
title: Skill Contracts
description: Define inputs and outputs for skills to create clear interfaces
---

# Skill Contracts

Skills can declare their expected inputs and produced outputs, creating a clear contract for how they interact with the environment.

## Defining Contracts in SKILL.md

Add `inputs` and `outputs` sections to the YAML frontmatter:

```text
---
name: security-scan
description: Scan for vulnerabilities
inputs:
  files:
    description: List of file paths to scan
    type: string
  severity:
    description: Minimum severity level
    type: enum
    options: [low, medium, high]
    default: medium
outputs:
  report:
    description: Scan report in markdown
    type: string
  passed:
    description: Whether scan passed
    type: boolean
---

Scan the provided files for security issues.
Report findings with at least {{severity}} severity.
```

## Field Properties

Each input or output field supports:

| Property      | Required  | Description                           |
| ------------- | --------- | ------------------------------------- |
| `description` | Yes       | What the field represents             |
| `type`        | Yes       | `string`, `number`, `boolean`, `enum` |
| `options`     | Enum only | Valid values for enum type            |
| `default`     | No        | Default value if not provided         |

## Combining with Parameters

A skill can have `params`, `inputs`, and `outputs` together:

- **params** - Template variables interpolated at compile time (`{{var}}` syntax)
- **inputs** - Runtime data the skill expects to receive
- **outputs** - Runtime data the skill produces

```text
---
name: code-review
description: Review {{language}} code
params:
  language:
    type: string
    default: typescript
inputs:
  files:
    description: Files to review
    type: string
outputs:
  issues:
    description: List of issues found
    type: string
  score:
    description: Quality score
    type: number
---

Review the provided {{language}} files.
```

## Validation

The PS017 validation rule checks contract definitions:

- Field types must be `string`, `number`, `boolean`, or `enum`
- Enum fields must include an `options` array
- Name collisions between `params` and `inputs` are flagged

## Target Support

The contract is part of the skill's SKILL.md frontmatter. A target writes it only when it copies that frontmatter as it is, which is the case for a skill that comes from a SKILL.md file on most targets, for example Claude Code.

| Case                                              | Contract in the output |
| ------------------------------------------------- | ---------------------- |
| Skill from a SKILL.md file, most targets          | Kept                   |
| Skill from a SKILL.md file, Factory AI            | Dropped                |
| Skill defined in a `.prs` file (no SKILL.md), any | Dropped                |

**Factory AI does not carry the contract.** Factory fails to load a skill whose frontmatter has keys it does not know, so PromptScript keeps only `name`, `description`, `user-invocable` and `disable-model-invocation` there. `inputs` and `outputs` are removed from the generated `.factory/skills/<name>/SKILL.md`. If Factory agents need to know what a skill expects and returns, say so in the skill body.

A skill defined in a `.prs` file has no frontmatter to copy, so its skill file holds only the fields the target generates.

When a target drops a contract, compilation reports a `PS4005` warning that names the skill, the target and the dropped keys. The output is not changed. Targets that write no skill files at all are reported with `PS4002` instead.

## See Also

- [Local Skills](local-skills.md) - Managing skills in your project
- [Parameterized Skills](local-skills.md#parameterized-skills) - Making skills configurable with `{{var}}` templates
- [Shared Resources](shared-resources.md) - Share files across all skills
