---
title: Skill Composition
description: Compose complex skills from multiple sub-skill files — each phase gets its own context, tools, and security boundaries
---

# Skill Composition

Skill composition lets you build complex skills from multiple sub-skill files. Each sub-skill is a standard `.prs` file that can be independently tested, compiled, and owned by different teams.

Use `@use` directives inside a `@skills` block to import sub-skills as ordered phases:

```promptscript
@meta {
  id: "ops"
  syntax: "1.1.0"
}

@skills {
  ops: {
    description: "Production triage for cloud services"
    content: """
      You are a production triage orchestrator. Follow the phases below
      in order. Switch between manual and cron mode based on context.
    """
  }
  @use ./phases/health-scan
  @use ./phases/triage(severity: "critical")
  @use ./phases/code-fix as autofix
}
```

The resolver flattens all sub-skills into a single skill with labeled phase sections, unioned `allowedTools`, concatenated references, and `composedFrom` metadata tracking provenance.

## Why Composition?

Without composition, complex enterprise skills live in a single file that grows unwieldy. Composition solves this:

- **Modular phases** — each phase has its own instructions, context, restrictions, and tools
- **Independent testing** — compile and validate each sub-skill on its own
- **Team ownership** — different teams own different phases
- **Reuse** — share phases across multiple parent skills
- **Security boundaries** — each phase declares only the tools it needs

## Writing Sub-Skills

A sub-skill is a standard `.prs` file with a `@skills` block. It can also include context blocks (`@knowledge`, `@restrictions`, `@standards`) that get composed into the parent.

### Minimal Sub-Skill

```promptscript
# phases/health-scan.prs
@meta {
  id: "health-scan"
  syntax: "1.1.0"
}

@skills {
  health-scan: {
    description: "Run MCP health checks in parallel"
    allowedTools: ["mcp__monitoring__check_cpu", "mcp__monitoring__check_memory"]
    content: """
      Run all health checks in parallel. Report structured findings.
    """
  }
}
```

### Sub-Skill with Context Blocks

```promptscript
# phases/triage.prs
@meta {
  id: "triage"
  syntax: "1.1.0"
  params: {
    severity: string = "all"
  }
}

@knowledge {
  thresholds: {
    cpu_critical: 90
    memory_critical: 95
    error_rate_critical: 10
  }
}

@restrictions {
  - "Never escalate without evidence from at least 2 independent checks"
  - "Never classify severity higher than {{severity}} threshold"
}

@skills {
  triage: {
    description: "Classify and group health findings by severity"
    content: """
      Classify all findings. Group by service, then by severity.
      Only include findings at or above {{severity}} level.
    """
  }
}
```

When this sub-skill is composed, its `@knowledge` and `@restrictions` appear under the phase's section header in the flattened output.

## `@use` Syntax Inside Skills

All existing `@use` features work inside skill blocks:

```promptscript
@skills {
  ops: {
    description: "Production operations"

    # Relative path
    @use ./phases/health-scan

    # With parameters
    @use ./phases/triage(severity: "critical", timeout: 30)

    # With alias (determines phase name)
    @use ./phases/code-fix as autofix

    # Registry path
    @use @shared/phases/monitoring
  }
}
```

## How Composition Works

### Phase Ordering

Phases are resolved in declaration order (top to bottom). This order is deterministic and reflected in both the flattened content and the `composedFrom` metadata.

### Content Flattening

The resolver produces a single skill by concatenating:

```
[Parent content - orchestration instructions]

---

## Phase 1: health-scan

### Knowledge
[content from @knowledge block]

### Restrictions
[items from @restrictions block]

### Instructions
[content from skill definition]

---

## Phase 2: triage
...

---

## Phase 3: autofix
...
```

Phase names come from the alias (if `@use ... as alias`) or the skill name from the sub-skill file.

### Property Merging

| Property       | Strategy    | Details                                           |
| -------------- | ----------- | ------------------------------------------------- |
| `content`      | Append      | Each phase becomes a labeled section              |
| `description`  | Parent wins | Parent description is authoritative               |
| `allowedTools` | Union       | Tools from all phases combined, deduplicated      |
| `references`   | Concat      | All phase references concatenated with parent's   |
| `requires`     | Concat      | All phase requirements concatenated, deduplicated |
| `inputs`       | First phase | Phase 1 inputs become parent inputs (entry point) |
| `outputs`      | Last phase  | Last phase outputs become parent outputs (exit)   |
| `trigger`      | Parent wins | Only parent defines trigger                       |

### Context Block Extraction

| Block           | Behavior                                       |
| --------------- | ---------------------------------------------- |
| `@knowledge`    | Appended under phase section header            |
| `@restrictions` | Appended under phase section header            |
| `@standards`    | Appended under phase section header            |
| `@context`      | Merged into parent `@context`                  |
| `@identity`     | Ignored — parent defines identity              |
| `@guards`       | Ignored — guards operate at project level      |
| `@shortcuts`    | Ignored — shortcuts are UI-level               |
| `@agents`       | Ignored — agents are separate from composition |

## Sub-Skill Selection

When a sub-skill file contains multiple skill definitions, the resolver picks:

1. **Exact name match** — filename (without extension) matches a skill name
2. **First skill** — no name match, use the first defined skill
3. **Error** — empty or missing `@skills` block

## Limits

- **Nesting depth:** maximum 3 levels of composition
- **Content size:** maximum 256 KB per composed skill
- **Circular imports:** detected and reported as errors

## Validation

The validator rule **PS027** checks composed skills for:

- Sub-skill references that can't be resolved
- Missing `@skills` blocks in referenced files
- Nesting depth violations

Run validation with:

```bash
prs validate --strict
```

## Full Example

### Project Structure

```
.promptscript/
  project.prs
  skills/
    ops.prs
    phases/
      health-scan.prs
      triage.prs
      code-fix.prs
```

### Parent Skill (`ops.prs`)

```promptscript
@meta {
  id: "ops"
  syntax: "1.1.0"
}

@skills {
  ops: {
    description: "Production triage for cloud services"
    userInvocable: true
    content: """
      You are a production triage orchestrator.

      Follow the phases below in order:
      1. Run health checks across all services
      2. Triage and classify findings
      3. Apply automated fixes where safe

      Switch between manual (interactive) and cron (unattended) mode
      based on context.
    """
  }
  @use ./phases/health-scan
  @use ./phases/triage(severity: "critical")
  @use ./phases/code-fix as autofix
}
```

### Sub-Skills

**`phases/health-scan.prs`** — runs health checks with dedicated MCP tools:

```promptscript
@meta { id: "health-scan" syntax: "1.1.0" }

@knowledge {
  """
  Health check endpoints:
  - /health for HTTP services
  - /ready for Kubernetes readiness
  - /metrics for Prometheus scraping
  """
}

@skills {
  health-scan: {
    description: "Run MCP health checks in parallel"
    allowedTools: ["mcp__monitoring__check_cpu", "mcp__monitoring__check_memory"]
    content: """
      Run all health checks in parallel. Report structured findings
      with service name, status, and response time.
    """
  }
}
```

**`phases/triage.prs`** — classifies findings with parameterized severity:

```promptscript
@meta {
  id: "triage"
  syntax: "1.1.0"
  params: { severity: string = "all" }
}

@restrictions {
  - "Never escalate without evidence from at least 2 independent checks"
  - "Never classify severity higher than {{severity}} threshold"
}

@skills {
  triage: {
    description: "Classify and group health findings by severity"
    content: """
      Classify all findings. Group by service, then by severity.
      Only include findings at or above {{severity}} level.
    """
  }
}
```

**`phases/code-fix.prs`** — applies automated fixes with restricted tools:

```promptscript
@meta { id: "code-fix" syntax: "1.1.0" }

@restrictions {
  - "Never push directly to main branch"
  - "Never modify files outside the affected service directory"
}

@skills {
  code-fix: {
    description: "Locate code, create branch, write fix, create PR"
    allowedTools: ["Read", "Edit", "Bash", "Grep"]
    content: """
      For each critical finding:
      1. Locate the relevant source code
      2. Create a feature branch
      3. Apply the fix
      4. Run tests
      5. Create a pull request with the finding as context
    """
  }
}
```

After `prs compile`, the `/ops` skill is available in all your AI agents with all phases flattened, tools unioned, and restrictions preserved per phase.

## See Also

- [Building Skills](building-skills.md) — skill basics, parameters, and resource files
- [Skill Contracts](skill-contracts.md) — define inputs and outputs for phases
- [Inheritance](inheritance.md) — single inheritance with `@inherit`
- [Multi-File Organization](multi-file.md) — project-level file composition
