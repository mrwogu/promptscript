---
title: PromptScript vs Manual Configuration
description: Compare managing AI instructions manually vs with PromptScript
---

# PromptScript vs Manual Configuration

## The Manual Approach

Without PromptScript, teams maintain separate configuration files for each AI tool in every repository. Even with just 2-3 tools, this quickly becomes unmanageable across many repos:

=== "Files to maintain (per repo)"

    ```
    .github/copilot-instructions.md   # GitHub Copilot
    CLAUDE.md                          # Claude Code
    .cursor/rules/project.mdc         # Cursor
    AGENTS.md                          # Codex / Factory AI
    GEMINI.md                          # Gemini CLI
    ... one file per tool
    ```

=== "Problems"

    | Problem | Impact |
    |---------|--------|
    | **No single source of truth** | Instructions drift between tools |
    | **No validation** | Errors go undetected until runtime |
    | **No inheritance** | Copy-paste across repos |
    | **No audit trail** | Who changed what and when? |
    | **Manual updates** | One policy change = PRs in every repo, for every tool |
    | **Vendor lock-in** | Switching tools means rewriting instructions, READMEs, and docs |

## The PromptScript Approach

With PromptScript, you write one `.prs` file and compile to all 50 targets:

=== "Single source file"

    ```promptscript
    @meta { id: "my-project" syntax: "1.5.0" }

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdECQCeAWhrMAVjEZYZguHPYZCkmQEYKAVgoAGLQF8prOwGJB3CKxwxqELM5ZkMrOQB6ACMMRgBrTjEFOAFWMQxqMThBQScACmoYAHMIWOo5QQVBMTyMYNgxQTBmakFyDDls6mYAV3iASjsXMU4sL0LgO1SZUZBhwQBNNsFEmFnWQSI0D29egDcYKGYVuoB3WvDXbME2QVx5gEEABQBJbQ91iEYYCgmx0dZbe1ZuWP8EkkUkNFoIWL1JCIoP5sq0MNl4JJkDIACpyFYAZUYnjQmhAAF06Od4P1WNkkTIAGpeEkyfGCb7fbpZfLPfpsYETYoyAByME2dWWzDgVzugkicjgn1S3JAlyge0aKXWGCg4mw81caFaeLs1hA1kJBHYBXwRFI5FeNHoIAFcAgbHwRgNQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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
    ... all configured targets
    ```

=== "Benefits"

    | Benefit | How |
    |---------|-----|
    | **Single source of truth** | One `.prs` file, up to 50 target outputs |
    | **Compile-time validation** | Errors caught before deployment |
    | **Hierarchical inheritance** | Org → Team → Project |
    | **Full audit trail** | Git history on `.prs` files |
    | **Controlled updates** | Change registry, then run `prs update` and recompile in each repo |
    | **Tool-agnostic** | Switch tools without rewriting |

## Side-by-Side Comparison

| Aspect          | Manual                | PromptScript                                  |
| --------------- | --------------------- | --------------------------------------------- |
| Files per repo  | 5-50                  | 2 source files plus generated outputs         |
| Update a policy | 100+ manual edits     | Registry update, dependency update, recompile |
| Add new tool    | Write new file format | `prs compile`                                 |
| Validation      | None                  | Compile-time + CI/CD                          |
| Inheritance     | Copy-paste            | `@inherit` / `@use`                           |
| Consistency     | Hope for the best     | Validated in CI                               |
| Onboarding time | Hours per tool        | Minutes                                       |

## Getting Started

Ready to switch? See the [Migration Guide](migration.md) to convert existing configs, or start fresh with the [Getting Started guide](../getting-started.md).

Evaluating for a team or organization? Also see:

- [Target Platform Matrix](../reference/formatters/index.md) - exact output paths per tool
- [CI/CD Integration](ci.md) - validation and drift detection in your pipeline
- [Enterprise Setup](enterprise.md) - registry, policies, and governance across repositories
