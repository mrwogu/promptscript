---
title: PromptScript vs Manual Configuration
description: Compare managing AI instructions manually vs with PromptScript
---

# PromptScript vs Manual Configuration

## The Manual Approach

Without PromptScript, teams maintain separate configuration files for each AI tool in every repository:

=== "Files to maintain (per repo)"

    ```
    .github/copilot-instructions.md   # GitHub Copilot
    CLAUDE.md                          # Claude Code
    .cursor/rules/project.mdc         # Cursor
    .windsurf/rules/project.md        # Windsurf
    .clinerules                        # Cline
    AGENTS.md                          # Codex / Factory AI
    GEMINI.md                          # Gemini CLI
    ... and 30 more files
    ```

=== "Problems"

    | Problem | Impact |
    |---------|--------|
    | **No single source of truth** | Instructions drift between tools |
    | **No validation** | Errors go undetected until runtime |
    | **No inheritance** | Copy-paste across 100+ repos |
    | **No audit trail** | Who changed what and when? |
    | **Manual updates** | One policy change = 100 PRs |
    | **Vendor lock-in** | Switching tools means rewriting everything |

## The PromptScript Approach

With PromptScript, you write one `.prs` file and compile to all 37 agents:

=== "Single source file"

    ```promptscript
    @meta { id: "my-project" syntax: "1.0.0" }

    @inherit @company/backend-standards

    @identity {
      """
      You are an expert developer working on the API service.
      """
    }

    @standards {
      code: { languages: ["TypeScript"], testing: ["Vitest"] }
    }

    @restrictions {
      - "Never expose API keys"
      - "Always validate input"
    }
    ```

=== "One command"

    ```bash
    prs compile
    ```

    Generates all output files automatically:

    ```
    .github/copilot-instructions.md
    CLAUDE.md
    .cursor/rules/project.mdc
    .windsurf/rules/project.md
    .clinerules
    AGENTS.md
    GEMINI.md
    ... all 37 targets
    ```

=== "Benefits"

    | Benefit | How |
    |---------|-----|
    | **Single source of truth** | One `.prs` file, 37 outputs |
    | **Compile-time validation** | Errors caught before deployment |
    | **Hierarchical inheritance** | Org → Team → Project |
    | **Full audit trail** | Git history on `.prs` files |
    | **Automated updates** | Change registry, all repos update |
    | **Tool-agnostic** | Switch tools without rewriting |

## Side-by-Side Comparison

| Aspect          | Manual                | PromptScript         |
| --------------- | --------------------- | -------------------- |
| Files per repo  | 5-37                  | 1                    |
| Update a policy | 100+ PRs              | 1 registry update    |
| Add new tool    | Write new file format | `prs compile`        |
| Validation      | None                  | Compile-time + CI/CD |
| Inheritance     | Copy-paste            | `@inherit` / `@use`  |
| Consistency     | Hope for the best     | Guaranteed           |
| Onboarding time | Hours per tool        | Minutes              |

## Getting Started

Ready to switch? See the [Migration Guide](migration.md) to convert existing configs, or start fresh with the [Getting Started guide](../getting-started.md).
