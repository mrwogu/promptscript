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
    "Strict mode enabled",
    "Use named exports only"
  ]

  naming: [
    "Files: kebab-case.ts"
  ]

  testing: [
    "Use vitest as test framework",
    "Maintain 90% code coverage"
  ]

  git: [
    "Use Conventional Commits format",
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
    prompt: true
    description: "Deploy to production"
    content: """
      Deploy to production:
      1. Build the project
      2. Run tests
      3. Deploy to staging
      4. Run smoke tests
      5. Deploy to production
    """
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEV1ZmSxxG1CGiwB6GswBWMRlgFwAOq3UABEjCwZewdb14QAJol6qQJAJ4BaMAFcoUOHsYBrOxjRorR3jgbdgxCCysARgoABhj-VmNWUhhwkABZG14AMWdXdw9eAEFfeONTeDEJLAg2VMLeEmZy6gSnFzcMT14fcghGbBqEgHcIXF4AFRs0GABlSsl4gF91LTNOaqxMwwTLEH89nYBNZkdu6hhuhKJp6ixeNrzOgvKANxgoZhvA6cYIDCgIAAvCCsADmJgSk2mc3EkjoAQASjBOlg6JdTLwAHJNGAUORwCi8Y6nIbiDi8RiwDCsNEkDAgvQgjAAI1gaOpGKG7ygdg4bhgGJY5QoAX2SxWrE0LHYRDu22MUGpoMcGFB8AsyE201EsKwAF0AtRHOwIDpUtjhfjeAAmaIAalKDTYzHOaGYFnlxl4WGYzCg5sIjuMmE8qpgaWpYeoqTQrDQJEdy1YSa0HVYpgw1FMcAMAS1FV1GoCxisMyw4iUTvKvE4LNgpis8J2JZAAFU4BckjoMdcXSJeGwoDZHQaNDsuyDQUXm7sstB1bwPDBmSy7P0OxQRCOJcY+dUwdOvbt2xcXqN4HcMDm9-dqMkhi6PI3i7sIwz6QkAJzRACkFJx-5vHearbmOxigqMh5elYJ68AAwmwbwmmw-zwUIJCjDmYAunSWDPjOVhQguYDIqi9wQIQaKmMwjBwGibg2GyvDnGAKIumie5oowOAujAoEppKyqZtmuY7KCHzMnARYgAAVDJUgyZuaggGiVhyQpSmBipuzqYpcA-EpVijgJmjnG4FbVGwOaenYuyYjAQG8I4HaXJk+a8LZzkXMaHisMwQzDKMODelMFxCVmykBLZVj2Y5Xm8OUrHOHcva3DmtmDpkXYCjWhBumljrRSAsUwNQ-4kBhdwjLgJx3HukU7EVJVlXAHgSDW1CCGVOAcgCYLimOmhwDxtyMI4-aelYUjnGeMBDFYqRIrNQz-tW2FlQAjiqAKbOivDMhevA0CifTwI6U17gtuwAOpkhcLBkOcOCcHAEBvE5rCjN6F4NS2UjUbRV1WAA4pwpXYBcAOODoISWRoByiiA-0wOQzDDkgolHrIwgWOWjh8TO5Q6lUgypAAIijHxucwR2CKYjhKIMQb-jK7CpGKM7GBTqPU7TTQM3DiAvsYUS8AAQo40AYrgFyyAoSjCzahIIsa31uGonO8AAzIS3NU96NMdBB-WawALMrqtwI0S5q1umsAKy65TaMG3z9OM2wL5igcxhJgJfAALxB8HIeh2H4cR5HUeh+ofAzG17QebwSLOXWFyFAAkvBPgstAowQGdrCB9HJel2XkcSkNCeuJj5WVR6L5E-Mgu7HB5wQ7wEF3A9lVYX6HwjGCfPy93iHrIMv1eqYEBwGnaQ4lAGesC8NEDLU3pGgTR7ShwhBYKk61Pj7Xphmzuxqqw4M8mgjjUG6HbM-8A8CuMvquNJYtXjgja7EiGANtpKwt1zxGRfDvdY7M9jHyPNdZ6CQxCkUnHXTCQtNai1gghZe48UJQDQhVTC9wcLYFxqFAAFKIT4MAACUFgm66iZpra0hIiJSXuKRNEkBKIJRonRQImwmIsTYtQDiF4uIjS3kebWhIADSMAUaBEcMyEevA+reXTKVXgAB2a0FIep3iUKVDWkjeDm14EvSkjhqwITsIUca4jTB2DFm5O884yrrSKFnK8r00yMAkUeR2WIHIaOSOmXKM99zgh7gQ40sA4A5muACX4WAhzdFagKRWAA2QkhQoBDAwDYHMRoEh9QiftGA617roVGBEr2UDEw7mYg5AuQwG6EwLCTdeVglrNNWvdHqYJ4CEM2ttUYmQOQmDifjSexgvLUCXivforIUgb3xmAtgHAz7e0VgABVKutEg3oRonFBMFIUFwZo9O4ooNqB4GlHm4HwBC1YACKIzNiK1skRQIGASK7XGbIL4REYRVCcrPECmtbIAFFOoul4P00wfVIlCHILoMGcSPm8EhaYNUFIryVKAmGO5XoHm8BmIoW+oyMVLxvncF4-wzBrzApI2y2JAiKHOP2EEvSMUAHlrqFBmNsg2aBeARGiLwF4zhL53mZHnaohdFYkrFodbZ+jqi+KMcy0lPKAAyGcya0xBL8FFOZ-7PXOKwXxGKyYIkOHtaRGcZgzENZaiQsSMWqsoWVCcQ9pRIThhrRVfBdnUH2dSK1ELeCtlYJfDVs9qCZHOHYC1zQcxcr-grSNmI7QRF4FtUqmRZBLJIJqo8tk0gwEaAmlRyIPClt2BzX2DS9ytKPHQjprBUjAPJA9GgMA4GvXesaL69VmazPmavJZuNN5rNZvvBtdTNawM4LwUk+ch71VQcY9BLkABq543CpMORcG8RTpWKyYdkfu-kiiFHqJgLAHAWi8FIYUTqSoYBokKEoL9cTSpYCoYrHWExDrMmYGMHqvhC3YGCuM0qXVcUdnrcYUx88uiylKkkXB5RpjqNdYXYxATxiZjVHcAAfN+P8ZzALg3BcYrJUaXLtskG9E9h1sr1q2TsASxhBFKBdK2qe7SWOdJADMRwoI1SHvGaaFFMNR7Vj4z6cQ-VoEs13vOqwIJzWjGZuAzZdS1PGGXQkJTLpJxbskaLSFrA4C3zY+rI6XiykVL2j8p9F7CQRhtlbJ+aIjXnHk6hbiH7kNSN4LI+RUT+zYCEH0RWpiyY0Whusfa7cbmRP6VJ2pjbeB+wlMXcuRXitR1jkUC+-ZbIzB+H8AEgIcqZ1JYo0+-ZSHA1GAACUUWhNA0BwO8AAGTwUVJYi4TzqFlZK1N6bwdK4tesgEM5yamlzVKoJsowmW5WEhXlf9vTGnLVKoSWCsgTpvBSe5jR1GQsDIJMzH0fpWHIC6ciABqkQDA1dD-EGElvsgE-sNUBM5GjlH9LsOAbBL54TU61aA79eDPZABcuaQPt7rIgQu5mxhiRnAuPoDsn1YXUeR1yMqL0KVDxwBAE5fCOTCRzMwMA+2tr0s2CKJlMC4EQhXkucwitRYqwSF3BKEAwBM59Gy85ihUs3ey4wwkWRksM4SCD0XBcMSQHdZrYDyrjYHZ6aabsfwOApOckgmWtN3jMH-jlEngRq5EuMJ6s8a05GmBXF0F0oJqRAhysyQt4hzObEs2W+CZI+ioRnnZwZpCSDOTuJwwDkbrqZk+mCHM5CeLOA1xRJPxiqsSakwGl90pXrNBMI9ZgZ4wR5+goZgIPGErLkL2t2uG3iYic7bsCmzJC9IP0ooWr4ShkdS6qa0JN5WLQHs3dtTD34eI7-m93YWLdOAP+1-P7n2UZb9+yAUcR4QfvFSNp0qa+Xw3AwnEwY89yipE6L4yQq+txqf05p+vmsceZjx1cXbtwm+96SYaID6-D0rAhDxcqCD9b9DxSRhDjeLs6Kwmbc7MC84h5eiixwQ+BYD2aj6wo6BxJhh7QdBdDlidB+JeiXoZzlAmhgCJoox0wCyDB8IoxhbAYZwQ6KjkgW5T5QC4EfD9BwwJaEgZxkCwDyYNAgimioScKKwBK7pn50GBB+jjTMEPjUB1qO5XpjTK7kSEDm7PQfTNBDhIJR74xoh+R1SGFBDCBCB3YEQf5NrJgFa8AzZuHFZlY6qry4IVpVqZC2SqpvQdxLzmRMFWQvqWHIKPo5QS5dxJ6FbuGJGlaDQCGoSTSOG8AkpeH9C4IUznafASGYKQDKh3hCFMoPJ8CFDbJZyyIFJRS8B5FW7xipZVFZxLiZAzwQj8CcAvAUCpFQD1FliqhIKcCmBugMgWA4CPpoBSRSBSBGyTjeC9YUBECkAooUAPQNIVG8AhoQ5YY7EsSlScAar1FZx9okRlRARgYuQfCSZIL0wqbgivBNHyb1EnZ9jazRDRC5ruIW6vBsrUCOSkJaxfHirShgCJL9jVTBTgbmrDyKAiBJ4BDbHSJ+QBRmKTIEZJzjCGEYB2JVjOAXA9SmrMTkEszTxwxJz-B5IFKrr0gJ6wpSHVBgGMr1HjCHQZh6ArguRmS6DxJARZTU5THdB3A6KFBpBbEkrsmkBYjgZYm2SYLuB3CaByDMA4CtCwqcksh4rdCMBxr1GFCtS8BDSZgYCwZgbjTHq8CXwrR4kywmiCHMEQn+SIwcyLAgCLB6gMDrAJr4CrFiG4g0D0AgBASvRsD4ARAelAA" target="_blank" rel="noopener noreferrer">
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
