---
title: Skills & Local Memory
description: Advanced features for AI tool skills and private instructions
---

# Skills & Local Memory

This example demonstrates how to use `@skills` for reusable AI capabilities and `@local` for private development instructions.

## Use Cases

- **Skills**: Define reusable workflows that AI assistants can invoke (commit, review, deploy)
- **Local Memory**: Store private instructions not committed to version control

## Complete Example

### Project Structure

```
my-project/
├── .promptscript/
│   └── project.prs          # Main PromptScript file
├── promptscript.yaml         # Configuration
├── .gitignore               # Include CLAUDE.local.md
└── ...
```

### PromptScript File

```promptscript
# .promptscript/project.prs

@meta {
  id: "my-fullstack-app"
  syntax: "1.0.0"
  name: "My Fullstack App"
  description: "A modern fullstack application with TypeScript"
}

@identity {
  """
  You are an expert fullstack developer specializing in TypeScript,
  React, and Node.js. You write clean, maintainable, and well-tested code.
  """
}

@context {
  languages: [typescript]
  runtime: "Node.js 20+"
  monorepo: {
    tool: "Nx"
    packageManager: "pnpm"
  }
}

@standards {
  typescript: [
    "Strict mode enabled"
    "Use named exports only"
  ]

  naming: [
    "Files: kebab-case.ts"
  ]

  testing: [
    "Use vitest as test framework"
    "Maintain 90% code coverage"
  ]

  git: [
    "Use Conventional Commits format"
    "Types: feat, fix, docs, style, refactor, test, chore"
  ]
}

@guards {
  globs: ["**/*.ts", "**/*.tsx", "**/*.spec.ts"]
}

@restrictions {
  - "Never use any type - use unknown with type guards"
  - "Never use default exports - only named exports"
  - "Never commit without tests"
  - "Never skip error handling"
}

@shortcuts {
  "/review": "Review code for quality and best practices"
  "/test": "Write comprehensive unit tests"
  "/docs": "Generate documentation"

  "/deploy": {
    description: "Deploy to production"
    prompt: true
    steps: ["Build", "Test", "Deploy to staging", "Run smoke tests", "Deploy to production"]
  }
}

# ============================================================
# Skills - Reusable AI Capabilities
# ============================================================

@skills {
  commit: {
    description: "Create git commits following project conventions"
    disableModelInvocation: true
    context: "fork"
    agent: "general-purpose"
    allowedTools: ["Bash", "Read", "Write"]
    content: """
      When creating commits:
      1. Use Conventional Commits format: type(scope): description
      2. Types: feat, fix, docs, style, refactor, test, chore
      3. Keep subject line under 72 characters
      4. Include Co-Authored-By trailer for AI assistance
      5. Never amend existing commits unless explicitly asked
      6. Always run linting before committing
    """
  }

  review: {
    description: "Review code changes for quality and issues"
    userInvocable: true
    content: """
      Perform thorough code review checking:

      ## Code Quality
      - Type safety and proper TypeScript usage
      - Error handling completeness
      - Edge case coverage

      ## Security
      - Input validation
      - No secrets in code
      - OWASP top 10 vulnerabilities

      ## Best Practices
      - SOLID principles adherence
      - DRY and KISS principles
      - Proper naming conventions

      ## Performance
      - Unnecessary re-renders in React
      - N+1 query problems
      - Memory leaks
    """
  }

  test: {
    description: "Write comprehensive unit tests"
    userInvocable: true
    content: """
      When writing tests:
      1. Use Vitest as the test runner
      2. Follow AAA pattern (Arrange, Act, Assert)
      3. Test both happy path and error cases
      4. Mock external dependencies
      5. Target >90% code coverage
      6. Use descriptive test names
    """
  }

  refactor: {
    description: "Suggest and implement code refactoring"
    context: "inherit"
    content: """
      When refactoring:
      1. Ensure tests pass before and after
      2. Make small, incremental changes
      3. Keep commits atomic
      4. Document breaking changes
    """
  }
}

# ============================================================
# Agents - Specialized AI Subagents (GitHub Copilot & Claude Code)
# ============================================================

@agents {
  code-reviewer: {
    description: "Expert code reviewer. Use proactively after code changes."
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    skills: ["review"]
    content: """
      You are a senior code reviewer ensuring high standards of code quality.

      When invoked:
      1. Run git diff to see recent changes
      2. Focus on modified files
      3. Begin review immediately using the preloaded review skill

      Provide feedback organized by priority:
      - Critical issues (must fix)
      - Warnings (should fix)
      - Suggestions (consider improving)
    """
  }

  debugger: {
    description: "Debugging specialist for errors and test failures."
    tools: ["Read", "Edit", "Bash", "Grep", "Glob"]
    model: "inherit"
    permissionMode: "acceptEdits"
    content: """
      You are an expert debugger specializing in root cause analysis.

      When invoked:
      1. Capture error message and stack trace
      2. Identify reproduction steps
      3. Isolate the failure location
      4. Implement minimal fix
      5. Verify solution works

      Focus on fixing the underlying issue, not the symptoms.
    """
  }
}

# ============================================================
# Local Memory - Private Instructions (not committed to git)
# ============================================================

@local {
  """
  ## Local Development Configuration

  ### API Keys
  - Development API key is in .env.local
  - Staging endpoint: https://staging-api.example.com

  ### Personal Preferences
  - I prefer verbose logging during development
  - Use port 3001 for the dev server (3000 conflicts with other projects)

  ### Known Issues
  - The auth module has a race condition - always wait for initialization
  - Test database resets every night at 2 AM

  ### Team Notes
  - Contact @john for database access
  - Ask @sarah about the new authentication flow
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0YAK5QocAYwDWyjGjTyxEuIvYZCs+QEYKABkcnxg1qRg2QAWUWCAYhpaOrqCAIJGLhJS8IzUEGhYEGxeYYIkzDHU4uqa2hh6gobkEIzYyeIA7hC4ggAqimgwAMpxCVguAL5iYtzSnElYfqKuJiBRggCazGpF1DBF4kRN1FiCucEFoTEAbjBQzCuCcE2MEBhQEABeEKwA5pLiDU2t8Yl0poIASjAFWHSLKSCABymRgFAAVnAKFMZoJKvEOIJGLAMKwASQMLcBLcMAAjWAAtFAyr7KDKDjaGBAlgxCifMZdHqsbgsdhENYjCRQNF3NQYO7wWTIIZNOBtRIAXU+1DU7AgfC8oLpUMEACYHABqCYZVjMeZoZiyLkSQRYZjMKBKwgTCSYPQCmDeNGO6heNCsNAkCbdVi+3r5VhSDDUKRwYSfUWxN5YYWfCTyZpYeKMNYZGKCTj42BSW1yEAAVTgC3cfCBy31WHDbCgigm0tYn1LtzucdcCZA-mgQsEuhgePxyjKxYoVfrzIklKS9zbpvzRYWOxq8DWGHDU-W1A8lX1ujz8md2Kx4gAnA4AKTIsFXvZbwXjxuuO41Wem+QLwQAYTYe3lbAuX7MCQJA1OGYD6piHTjO2+bPD2YC-P86wQIQAJSMwjBwAC2iKISgjzGAfz6gCU4AowOD6jAD7+iyfIhmGEZPgceJwHGIAAFTsQA9Oxo5wPIALyJxPF8TaICCRx3G8ScMCMHx8gNjR3DzNoKZJGw4Ymso+bAjAt6CGoxaLH4UaCNphkLHKuh6pUVQ1DgZqNAsdGhvx0ESNp8i6fpFmCDEhEaGsFarOG2k1n4pbUpmhCGiFEyeSA3kwNQV7ATU8L2TMaxTm5nwJUlKVwLoCSZtQ1D6oIODEpc9xMo+3BwBRqyMGoVaMR2XHzEuMCVPIXg-N1lRXhm4EpQAjvylxDICgh4iugg0H8pTwBM8hcVOfX5gA6oiCwsGQ8w4JwcAQHsBmsOlOWrSAXHoZhm3yAA4pwyXYAsd1qHwljqY20EMjdMTkMwdZIO1poxOKMYVF4AAiMBAyZzALeVUhqKmFR5jQQGJLIyZqFRMFUmgrGCMg8gAEJqNAubibBK4CfmcMI2aSP5M+tW0-IXxyscGR9maK5uRJTMHIjyOZGjP0KZ8vo0QAxIIAC8ysq6ravqxrmta9ratiArzTFXkZnfDAhnZgsYQAJJfoY+LQDUEArawCs667bvu9rzINYbWhg-tIGxmD0TRu00P5p+8xvYIz5rP7oHrJaBzVPc4sQrJsc-gMFS5TBUgQHA5veGCUCW6wOwYeUKRmrKBNzmyHCEIH8ijXu7mmo67BeIKrCveSaBqNQhrFnmFxJ9SdQWlobHk2uOAM1zvw0xJO3LtLMH1wMXiMjBEhbUd4hxIhLapQHrHxqa9iCB+35l1n-5QIBaVtaNkG405AAU4qHDAACUsgQxKKWO91QwjgiTBC2AASQFQn5DCWFjhDDwgRIi1ASIrjIk1Wuc5BAAGYYQAGkYDw2OGoPEadUyCBqpZIMyVBAAHY1TIiqluVMyV+LAIACwwlLiiNQGZvzKDCK1TBUhlDkxMlubsKVRrhGtmuE6gZGBYLnAAVhhAVIoX1yyEHztOB4cc2pylgHAcMyxLhnCwLWIoRVqTnwkAANhhGEKAlQMCKHDLKcQNU9GzRgKNPaQEA56PPoyNuNEJBdUdpUY058AFQyrgvQaw09pVXuPABO41Jo1D8MSSQJj8Y5znBZagpdy5lAJJ4au+Nz4b07vmbe2DBAAAVkovzNE1GYdwHK0gWJEnqTDZLFRnBObBcsFbfgzAARSyUMOxxs4LHAwAhaauSsZHDgq8doBkC73mAdpAAomVCqqSpA1X0djWAHAe4mLmQcqQgpkRrgCbeR0Iy5xjMEM0WSA9sm3MEKXfuawdgXGkJXR8jTtKgmOLJeYbVbjJL+QAeS2mEZoTSWZoEELYBwggdgaB7luPE9skhOzmR88m80mksKSEo9hELPmIoADKWxhsjW4ZxyDpIwFII68xWBKL+TDL4kwZr4Mts0ZobL+UJGMX8ql38UrNhTmyX8P12FkoVi06gL80QCr2VfVgPdaUF2oH4eYyg+VZHDPCn4fw-nAk1LYQQE1kp+CxhUkgdLsHaW8DADIprKG-F0F6jsDTBDhIFtoGJucQ6JDDvIFeSJ9o0BgPvE6Z05SXUFnmYppSK4VNxjXGpbArlN3GOWuZe9ODwkRMfHKiA5mXw-AANWXNoax7SFgbk8QSuZaoYT+ETswIaYRR0LWwBwbIgh35hDKryGAAIwipkXSY5KWAf5zLwfUeaeJmC1CqkYN12AHK5OSuVFKw4naNK4YIIuhQOTJXcA-QGnAYjSqvdgtR9QQyCjWAAPjPJeHpN5Xq7MaY4q+Rk4mhzOhuSKIb6kVtcBG5BqZ9TRrnNBuNCSQDNDUHcQU7bckKk5V9DOGZUPmniBzYt7JG5eFuLymoeZallrDXOKt4hKP6hbA24Bl99msDgAPLtgtx0mN8f4maSzJ19phM6fmcBMSaABOy+YZGALkXnQhiQW7CHEIMeGbAQFShzJvTDDCn0BizUjkM-RqTCMhIrWEsQ8slYew855nWetwjdzatpZopxziXCuFFK2nzSEdzau-R6NQAASpDAJoGgHuwQAAyL8PI+ELAmb-HzXmCuFZVl7KLmlPg9ItXpKJyUMPg1jT9Lw+yYpruSfhKrPVkowg-FjJaewrEydocBrTaToR5nNJaEmZMQC2qXvmR6Bp54gEesxRbM9GprznOmfYXg4BsB7lBc+RVoBT1JvIPpvUQANjriWzeiG8wSGmLMEMCwhDFguhVYD53aHHR+SnHAEAukIOJPRasYBWsTRBUMek4LsGcceOXPsMhG0wm5uIGOfkIBgDB+aaFvTZLWeG454B-aAiWerOIdMmPHZAkgLK4BW6KXsza0khUZZzgcCsYZOtR1kb7GYNyqK53jg+zeaaeVS4RpEKkAOQo+o7homuFFPEbr4g8aGHx+lEcHZlAfvnYT6T34kEMmsaBG79VbRDBde44ZP4UQ0DTlCZv6V4YIyubO062QnSyJIA6zAlz3Cd2+ZzMsRkxDxPhwUbog5+Xq-GkAcNw8EePjJM4IL20yLPfqIzQZI0m6xFAETo226TknpNhe3LFv7LzlBCSa256cyWwthvy3mB4g26aLbVp8yMeSsx4vC1kogRMRUIuMQvAFCUYkKvoEWM3bqaEuZj25gvaWM11YMfE+R+OEFkFNwU7wvKqlsovkXS1gUdDyt+94fMERxr7Bl9PyGCwCJ0q570jwB2SvoE+RCjJgKMo00EnS2N9JIMAM1eGFGSWCoBBeGHTXBbhXbHkJEXABYQiaAF-A4MoIBa9bhMgWAMjdIW4BUACaBOZL9ZtXvMA44S0VqaAncagYNUXCQQdFqcnZCHRFOFA86LIWsY+PXfGAEPUbKHncwMgc0T1aHOcBfZDVzZkF2IrBQjzHzRlCuB+X1f1PwbSKlU6KOUuVSKAjSadIQk+GoDgIEHHGOM3eQxQmw7zeqTAgCE0aQiQD5FQnXQQOGPrQ4Agm+SAPkLcIBT4MZBWMIJpa2QhdxPKDwvSPnL0azUI62PsPwfOR4QQCgTgHYCgBwqAKIpMAUY+V9Q0bEWQHALALAYmRALiLiNmFsAwZLdI4gPA8EfaEZYI5pNhe+ZpAiZKTgWlKI62FNBCFKW8XdIyA4JPFOVGajB4XYWIsjKI7rSsXBBwBwJ1GRLg3YaFagfSd+HBFYnFNkMAcxNqaoWoPdXlVOdOOAM3IIj5fBGycQS2fJD9bSOoHnDAYRdICWWASqNcIofCf-K8IMB2NgY2C4VxdxeELEE3CqIgpIXfMFKIuoeaYMAQAcIyFSfgUxW8CKAHUoooNYRhMIbwVoj5ZE0gEEPdF4wCSwChbgCEZgHAHICqVE-EJ5IoRgY1KIsIIqQQBqEMDAE9XdVqTtNwfpD4lA+ULA6Ao44df6beToEAToSUBgAYU1fAIgUgTlKgWgcSEAW8E6NgfAWwJUoAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Configuration File

```yaml
# promptscript.yaml
version: '1'

input:
  entry: .promptscript/project.prs

targets:
  # GitHub Copilot with full features (skills + custom agents)
  - github:
      version: full
      convention: markdown

  # Claude Code with full features (skills + agents + local memory)
  - claude:
      version: full
      convention: markdown

  # Cursor with multifile rules
  - cursor:
      version: multifile
```

### .gitignore Addition

```gitignore
# PromptScript local memory (contains private instructions)
CLAUDE.local.md
```

## Generated Output

With `version: full`, formatters generate separate files for skills, agents, and local memory:

=== "GitHub Copilot"

    Generated files:

    - `.github/copilot-instructions.md` (main file)
    - `.github/instructions/typescript.instructions.md` (path-specific rules)
    - `.github/skills/commit/SKILL.md` (commit skill)
    - `.github/skills/review/SKILL.md` (review skill)
    - `.github/agents/code-reviewer.md` (code reviewer agent)
    - `.github/agents/debugger.md` (debugger agent)
    - `AGENTS.md` (agent instructions)

    Example skill file (`.github/skills/commit/SKILL.md`):

    ```markdown
    ---
    name: "commit"
    description: "Create git commits following project conventions"
    disable-model-invocation: true
    ---

    When creating commits:

    1. Use Conventional Commits format: type(scope): description
    2. Types: feat, fix, docs, style, refactor, test, chore
       ...
    ```

=== "Claude Code"

    Generated files:

    - `CLAUDE.md` (main file)
    - `.claude/rules/code-style.md` (path-specific rules)
    - `.claude/skills/commit/SKILL.md` (commit skill)
    - `.claude/skills/review/SKILL.md` (review skill)
    - `.claude/agents/code-reviewer.md` (code reviewer subagent)
    - `.claude/agents/debugger.md` (debugger subagent)
    - `CLAUDE.local.md` (private instructions)

    Example agent file (`.claude/agents/code-reviewer.md`):

    ```markdown
    ---
    name: code-reviewer
    description: Expert code reviewer. Use proactively after code changes.
    tools: Read, Grep, Glob, Bash
    model: sonnet
    skills:
      - review
    ---

    You are a senior code reviewer ensuring high standards of code quality.

    When invoked:

    1. Run git diff to see recent changes
       ...
    ```

    Example local file (`CLAUDE.local.md`):

    ```markdown
    # CLAUDE.local.md

    > Private instructions (not committed to git)

    ## Local Development Configuration

    ### API Keys

    - Development API key is in .env.local
      ...
    ```

## Skill Properties Reference

| Property                 | Type     | GitHub | Claude | Description                              |
| ------------------------ | -------- | :----: | :----: | ---------------------------------------- |
| `description`            | string   |  Yes   |  Yes   | Human-readable description               |
| `content`                | string   |  Yes   |  Yes   | Detailed skill instructions              |
| `disableModelInvocation` | boolean  |  Yes   |   No   | Prevent model from auto-invoking         |
| `userInvocable`          | boolean  |   No   |  Yes   | Allow user to manually invoke            |
| `context`                | string   |   No   |  Yes   | Context mode: `"fork"` or `"inherit"`    |
| `agent`                  | string   |   No   |  Yes   | Agent type for execution                 |
| `allowedTools`           | string[] |   No   |  Yes   | Tools the skill can use                  |
| `steps`                  | string[] |  Yes   |   No   | Workflow steps (generates workflow file) |
| `prompt`                 | boolean  |  Yes   |   No   | Generate as prompt file instead          |

## Best Practices

### Skills

1. **Keep skills focused** - Each skill should do one thing well
2. **Use descriptive names** - `/commit`, `/review`, `/deploy` are clear
3. **Document prerequisites** - What tools or access does the skill need?
4. **Include examples** - Show expected input/output in the content
5. **Set appropriate flags** - Use `disableModelInvocation` for destructive operations

### Local Memory

1. **Never commit secrets** - Use environment variables instead
2. **Document temporary workarounds** - Include issue links
3. **Keep team contacts current** - Update when people change roles
4. **Add to .gitignore** - Ensure `CLAUDE.local.md` is not tracked

## See Also

- [Language Reference: @skills](../reference/language.md#skills)
- [Language Reference: @local](../reference/language.md#local)
- [Formatters API: GitHub](../api-reference/formatters/src/classes/GitHubFormatter.md)
- [Formatters API: Claude](../api-reference/formatters/src/classes/ClaudeFormatter.md)
