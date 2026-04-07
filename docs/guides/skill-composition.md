---
title: Skill Composition
description: Compose complex skills from multiple sub-skill files — each phase gets its own context, tools, and security boundaries
---

# Skill Composition

Skill composition lets you build complex skills from multiple sub-skill files. Each sub-skill is a standard `.prs` file that can be independently tested, compiled, and owned by different teams.

!!! tip "Try it interactively"
Open the [PromptScript Playground](https://getpromptscript.dev/playground/) and load the **Skill Composition** example from the gallery (Examples → Advanced) to experiment with the multi-file ops/triage/code-fix layout described below without leaving your browser.

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhmaOPLES4AT3YZCs+QEYKBgAwrWAXzFjucANbQocYasGK4s0eImCp8RtQhoWBBsuiAACtTMUgCujEFsglj+GADmMIJgzNSCjFDM0VKCcDDUAG4QjPCmXjlsHOyhKiDONQCa+YIY1OlCNFGx8eJJEKnpWYw48EnYWRSCAGLMUHkA7omTgmg4GMWOAEYwqy1eEOJZPtRzAMorEFgTggdYKzCcgiQYrNEYUJ2shX4EiQouk9jsYIUEix2EQsBRjk1qoILJ5uNFioIKAB6LbguBYyY-XAAWjgjE+zjRGOxuN2WOGowAFMVSiU7upQn47hUfvIAJSU9HpGnbOksHzEyCETqODDRLDMKViMwgMwAXQYnCS6nwRFI5BgVFoIAYrNowVY+D0qqAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEaODHHgB6HDAxRcAWjiMMrKrQA6rAAIkYWDL2CrevCABNEvZSHGSZchef284AT3YZCp8wEYKXgAx3WAL6qqmpwANbQUHC69pZSOLLyrKZ6rAYGRvCM1BBoWBBs7iAASgCuaQCyAMIACrxxuLyM4oxh0RBpmNSSsFD+6bw9zADuMEYAKszMUabI5iSMaAD6SyRsEFjMOawA5ivNMK1Li6XmdGYgC8ur65vbe8ctYaswa9SO5gC69gYs7JxYIp2EA-dJlNI9eoSeJNJ7tToYbpQXoUXjFGBoLZYBxYailRhYUrUMa8SCsIwdHZwCig4H9XhBQIgAKfBgA974IikcgwJT0EAANxgtAKrHwHmZQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEaODHHgB6LNQgYA5jCq0AOqwACJGFgy9gi3rwgATRL3khxkmce284AT3YZCh4wEYKLgAwXWOzNVJxDWl46VjAAbjASWNaGcKasUrwAvEYgGFBQnjoAvoo5rIpKANaszADusHoympa41PA4zFB6-tVBOoxoAK4A+oyREIxphgCcHm28qiTM1Na9-YNQIwCsljoR1NPdvhxzEFgDQ7xOY9m5igV1sRKM+2xwrToAtCkAcmERvPAL2DC8pXsNTpYT6hfScRi-MAbEi8bC8WBCYEAJl0rD0MDQnHR7F4jBwMEYhTgmV4z2Mb3C1FxUCEcAgYGsIUpe0ZOAgUnxVNwGC8wGAwmZUSyWV4tXqjT0njyBTghWgUHugR0pmkMACq146LgfQgaFurEcIAAwjS4HSGbC0bwpBtOmhePi0rheJA0RB4vcAEaMgURFkk9psDjsQ0WEAanQm2n0xlpKAu916d1SOAUXgAcVt9u9IWooIhdFF+K8Od9kWsFAjvAA8qwoIz3YwoJ10Qm3R7YcDprDPcxwpp+e9y8L4e8oJXxmGSXksiAsgBdBiccTWfBEUjkWQ0eggSl0tj4JxzoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJwDW0KHAAEwADqthw5mjiJREqVIAm8RtQhosENvLEgACtWbKAro21tpaGNWw7WcfRMVKAxMIBKMKPYBuMMKYuK5S3KZwgRQA9Gg4GJFw0TgwGFC4ALRwjBisLpLuwgDqELhBGHYkMBy0ocLhkcIxcQnw0VgaGADmMAAUkQEaWACeekxDEDlQ+nTC2lXMpljyAMwADACU+UrCHiVlaRAJwr2qNSQQrPBB8Y2spDBbBWERUbG3bSyqGZCEwscYJbMX7bQreLoQOAdYblELPXb1V71ODxagwZTvVpJEhsUrMDSsLpSDy9NEQqHUGEZYTKSEYABGsGUwjA+KCvmGXWMplYyieUgAvhIBSABQBdBicaH4IikcgwKi0EAMQZwBz4ACMoqAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhmaOPLES4AT3YZCs+QEYKBgAwrWAXzFjucANbQocYasGK4s0eImCp8RtQhoWBBsuiAACtTMUgCujEFsglj+GADmMIJgzNSCjFDM0VKCcDDUAG4QjPCmXoLRxdQAkqylzIwYAEawsknRMM4SLOycWKEqIP1eAJr5ghjU6UI0UbHx4kkQqelZjDjwSdhZFJaeNQBizFB5AO6Ju4JoOBjFju0w15LiWT7UiBMSBoIAErRcS7DBQXA5XaMGyODB+ZhwOGXIolcqVZQnLwAJgoggAKsk0rNWIVck84BAwOoMhBSXSUpiahIAMx4gCCaHINIw0SwzBI2BghUghHggiuu3mRQwYD6rD+ggAylcIFgdoJXlgrjBOIJBaxouDBAAKOkcajwoKlGAAShJZMi4hNIOwHFJwvtJCi8uZmqewpc4kGHEIWCOWLG1UEFk83Dq6QoAHoHgG4EmwRCcABaOBtBVxhOCZOp55J9abE3FG3+LDqUJ+NUVcHyW3OePFYspx5llg+bOi2ZwvnMUViMwgMwAXQYw2o6nwRFI5BgVFoIAYNcpbHweknQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEDhgYouALRxGGVjMFwAnuwyFJMgIwUTABk0BfKRtbcA1q2YB3WGIDmMYTcHSQMgNZfAAl5RRxBRjlGe0FOMTRmCHY4RB9BJUEAejkFXEEwZmpBYIAVUoAFLRhqADcIRnh0zKzqeTFtAqLBAGkAVwAjGtZ+eEE2jDFk+Dhm7L4saga4LuKK6mYFuT6V1WoMNGT3dID-f1ZrW244e2goFeB03PCVNVZJR6DfQTF4RiW0FgIGxDCAAEp9IIAWQAwlVnvkojAYitkoJMPsoLAoIFvoIFFAXDAxKVmMx7pJkDISIw0AB9OkkNgQLBFI4MpExOm0voyOh+Gn0xnM1lLVjuDnReyMmBM6jaGQAXXSvhY7E4WFBpxV3whQQJggREU59lRQQxBJgUAogjBMES1CwWkWfUYWD6bTEBWSU3Fsy+eOcLIicBq9UaglYpBg-LgAndcH56i9bTgiVYocEQL4FB12vOvkulhAlkVDA18vwRFI5BgVFoIAYtRqcGBrHwRhLQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgs1CBgDmMeWIlwAnuwyFZ8gIwUTABg3jBmaqTizgguDABuMJVm2y4iiKxWCALxyIBhQUPKCAL5iMaxi3NTwvoxYEGxwwpqCALQhAHKu7oLwjGHYMIIA7hC4zACuWCUu0pyMlWDUzCSC2IKwGD6CAEySrFIwaJwT7IKMODCMANZwlhJ58oVu1HNQg3AQYNpORR7HOBAqCzu4GOLAwM7btdpRUYK4SXA4zFBSlnEEnAltAoJlRFZfKoYA5shIJnBGEo0Gk2IYQABhPZwA5HXrjQQqLr1NCCBZhXCCSDjPwqTIAI2OT3cLzWEjmbA47HRGhAcPZWP2h2OYSgVL8UlpcAoggA4sTSYyTtQWu06B8FuIlcyzhR+RIAPKsKDHPyMKD1Cbimn+TJ9Zg7DD05huYSPU4vN79IpQPVWCS8tlxKIgKIAXQYnEU2nwRFI5BgVFoIAY2wObHwRlDQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJszEwAtJEIzBcAJ7sMhSTICMFAwAZVAXymsL3avCzUIjLBDZxhFwYIXSQAORgA3GGpBNABXOBxBMQgbRyh1QSxmQRIMCFZBACNqDFZGHBl3T28-QOCSOQgwBMhYV2ZQrDhxGEScVowwMBhHGDE1IP8HVujYpOp1QtZzS1ZuOABraChXYCKWeSUIHTcMjyj4Rns0JzZdEAAZZkZsVo2YOkEjmFusnLycR4B3ew5BZUez1eAAUAEpTfaCDBQKDML59AAqzGYK0kyBkoJeYhkjxkAFFolgcd4AEIYCLEmQAcRsaBkAF0ih4WOxOFhzoUQEz9gAxZjBF75J6-BzQ-7paKsADmiG5HgMgiuNz+uFaNlg-lyWDUDWojDuchgcsEACYKIIAMI2V5CbrYUI2N65fLGgDM5oAgmhyAlVeKVHtIQAWc2g0IZDhwJrGgCs5qtLz+QjCMMENgAjqFbIIvhBcG1WpBWJKpVDXCyOIQiYHvJyijNTCBTPSGGyJvgiKRyDAqLQQAwys02Pg9E2gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

After `prs compile`, the `/ops` skill is available in all your AI agents with all phases flattened, tools unioned, and restrictions preserved per phase.

## See Also

- [Building Skills](building-skills.md) — skill basics, parameters, and resource files
- [Skill Contracts](skill-contracts.md) — define inputs and outputs for phases
- [Inheritance](inheritance.md) — single inheritance with `@inherit`
- [Multi-File Organization](multi-file.md) — project-level file composition
