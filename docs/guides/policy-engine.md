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

The policy engine is available as a standalone API:

```typescript
import { parsePolicies, evaluatePolicies } from '@promptscript/validator';

// Parse and validate policy definitions
const { policies, errors } = parsePolicies(config.policies);

// Evaluate against resolved AST
const violations = evaluatePolicies(policies, resolvedAst);
```
