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

## See Also

- [Local Skills](local-skills.md) - Managing skills in your project
- [Parameterized Skills](local-skills.md#parameterized-skills) - Making skills configurable with `{{var}}` templates
- [Shared Resources](shared-resources.md) - Share files across all skills
