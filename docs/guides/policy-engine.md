---
title: Policy Engine
description: Enforce declarative organization policies on skill extensions during validation
---

# Policy Engine

The policy engine validates skill extensions against declarative organizational rules.
Policies are evaluated during `prs validate` and optionally during `prs compile`.

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

### Layer Boundary

Controls which layers can extend which, based on distance in a defined layer hierarchy.

| Field         | Type       | Required | Description                              |
| ------------- | ---------- | -------- | ---------------------------------------- |
| `layers`      | `string[]` | Yes      | Ordered list of layers from base to leaf |
| `maxDistance` | `number`   | No       | Maximum allowed distance (default: 1)    |

Example: with `layers: ['@core', '@team', '@project']` and `maxDistance: 1`, a `@project` extension cannot directly modify a `@core` skill — it must go through `@team`.

!!! warning "Currently schematic"

    Layer-boundary distance is measured against the skill's base-definition
    provenance (`__baseSource`), which the resolver does not attach to plain
    `@use` + `@extend` chains yet. On a normal `prs validate` run today this
    policy kind does not produce violations - the scenario above is schematic.
    Property-protection and registry-allowlist do fire end to end (see
    [Runnable Walkthrough](#runnable-walkthrough)).

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

## Severity

- **`error`**: Validation fails (non-zero exit code)
- **`warning`**: Reported but does not fail validation (unless `--strict`)

## Skipping Policies

For development, use `--skip-policies`:

```bash
prs validate --skip-policies
```

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAE1MAOYQ4WagE8A9AAEOpScwBuMalAziqtADqtpJGFgy9gO3rwgATRLy0hZMeUpVrxt07zjj2GQtdsBGCgBWCgAGN1YAXx0dPmkAVzgYXmkWAUk4AGtoKDgzPgAKAWFRCV4AWl4LEQwAI1gLXjBmal5ydUFqZnjWCwBKGN0iDl6PbKhcihYLGHKBRQgYAHdjdxZ2Tiw-EDcd1jMzABUHEnK4NBhGCEhGfhgF5d5GHEvMqBEsXiWIXF5ajFY2VYgiezDI7wBjGSohgaDgFHcuwikRAkQAugxNhJ8ERSOQYJp6CBlLQIGx8P5UUA" target="_blank" rel="noopener noreferrer">
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

The policy engine operates on the resolved AST after all `@extend` and `@use` declarations have been applied. It inspects the `__layerTrace` metadata that the resolver attaches to each skill during composition. This trace records which property was modified, by which source file, and with which merge strategy.

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

The policy engine is implemented as validation rule **PS030** (`policy-compliance`). It can be configured like any other rule:

```yaml
validation:
  rules:
    policy-compliance: error # default
```

Set to `off` to disable all policy checks:

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

// Parse and validate policy definitions from promptscript.yaml
const config = parseYaml(readFileSync('promptscript.yaml', 'utf-8'));
const { policies, errors } = parsePolicies(config.policies);
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

Requires the workspace packages (`@promptscript/resolver`, `@promptscript/validator`) and `yaml` (v2) as dependencies.
