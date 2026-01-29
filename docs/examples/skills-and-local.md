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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEV1ZmSxxG1CGiwB6GswBWMRlgFwAOq3UABEjCwZewdb14QAJol6qQJAJ4BaMAFcoUOHsYBrOxjRorR3jgbdgxCCysARgoABhj-VmNWUhhwkABZG14AMWdXdw9eAEFfeONTeDEJLAg2VMLeEmZy6gSnFzcMT14fcghGbBqEgHcIXF4AFRs0GABlSsl4gF91LTNOaqxMwwTLEH89nYBNZkdu6hhuhKJp6ixeNrzOgvKANxgoZhvA6cYIDCgIAAvCCsADmJgSk2mc3EkjoAQASjBOlg6JdTLwAHJNGAUORwCi8Y6nIbiDi8RiwDCsNEkDAgvQgjAAI1gaOpGKG7ygdg4bhgGJY5QoAX2SxWrE0LHYRDu22MUGpoMcGFB8AsyE201EsKwAF0AtRHOwIDpUtjhfjeAAmaIAalKDTYzHOaGYFnlxl4WGYzCg5sIjuMmE8qpgaWpYeoqTQrDQJEdy1YSa0HVYpgw1FMcAMAS1FV1GoCxisMyw4iUTvKvE4LNgpis8J2JZAAFU4BckjoMdcXSJeGwoDZHQaNDsuyDQUXm7sstB1bwPDBmSy7P0OxQRCOJcY+dUwdOvbt2xcXqN4HcMDm9-dqMkhi6PI3i7sIwz6QkAJzRACkFJx-5vHearbmOxigqMh5elYJ68AAwmwbwmmw-zwUIJCjDmYAunSWDPjOVhQguYDIqi9wQIQaKmMwjBwGibg2GyvDnGAKIumie5oowOAujAoEppKyqZtmuY7KCHzMnARYgAAVDJUgyZuaggGiVhyQpSmBipuzqYpcA-EpVijgJmjnG4FbVGwOaenYuyYjAQG8I4HaXJk+a8LZzkXMaHisMwQzDKMODelMFxCVmykBLZVj2Y5Xm8OUrHOHcva3DmtmDpkXYCjWhBumljrRSAsUwNQ-4kBhdwjLgJx3HukU7EVJVlXAHgSDW1CCGVOAcgCYLimOmhwDxtyMI4-aelYUjnGeMBDFYqRIrNQz-tW2FlQAjiqAKbOivDMhevA0CifTwI6U17gtuwAOpkhcLBkOcOCcHAEBvE5rCjN6F4NS2UjUbRV1WAA4pwpXYBcAOODoISWRoByiiA-0wOQzDDkgolHuUOpVIMqQACIox8bnMEdgimI4SiDEGZNCJIFjlo4fEzvyaBSbwyBWAAQo40ANtphEXo2uyE6jJOBHoEH9QLIAIsagSNEu31uMpqkgKLxPeqTsgU1TbBGQESYCXwAC8ZvmxbltW9bNu23blvqHwMxte0Hm8Eizl1hchQAJLwT4LLQKMEBnawpv2xHkdR7bEpDS7riY+VlUei+2PzHDqRwecEO8BBdwPZVWF+h8IxgrTCiVtKSFw79XqmBAcBe2kOJQD7rAvDRAy1N6RrM0e0ocIQWCpOtT4HEeYbsKkaqsODPJoI41Buh2NP-CXArjL6rjSVzV44MLVhIhg-Nq7d54GzOA-rKkYozsY13PQkYikZOSeYYgL7GFEvCwQh7frIMVCCEKqYXuDhbADNQoAApRCfBgAASgsGnXU1M742kJERdmJFsBokgJRBKNE6IS0YjANELE2LUA4heLiI0+5Hl4AAZkJAAaRgCjQIjhmQVzuH1by6ZSq8AAOzWgpD1O8ShSpqDQQAFkJG3SkjhqwITsIUcatDTB2C5m5O884yrrSKH7K8r00yMDoUeAArISZq3QYY9kIA3fc4IC6gONLAOAOZrgAl+FgIc3RWoCk-rwAAbISQoUAhgYBsDmI0CQ+qOP2jAda910KjEcS+MU49eACWMDNEOQwU4zmQbjbuh8HJ5NWvdHqYJ4BgM2ttUYmQOQmHcUzWuxgvLUDbh3forIUg9yZi+K+U9di33obwAACqVdaJBvQjROKCYKQoLi5LmqIxQbUDw7nodwPgCFqwAEV6mbECbZIigQMAkV2k02QXwiIwiqE5RuIE0G2QAKKdRdLwKppg+pOLprADgs93EnN4K80waoKRXmSUBMMWyjw7N4DMRQi8GkgrbgvO4Lx-hmC7mBehtlsSBEUOcfsIIKkgoAPLXUKDMcZWs0C8AiNEXgLxnCzzvMyIO1RQ6BIRVzQ64zxHVFMVIsZtkZgUoADI+3xmTEEvxyA1OPs9c4rBTEgvxgiQ4e1mE+xmDMOVaqJBuJBYKuBZUJxlyrgAqycKvQIsmdQaZ1J1UvJ-qwWeIrG7UEyOcOwqrmg5jJUfJQILMR2giLwLapVMiyF6SQUV+LeBpBgI0H1vAqQeETS2UZWStl7gKVjAsxTWCpDPuSB6NAYCP1eu9Y0X16o0w6V0zuvSGa90GWwQFw8Rl7EyUeB+nBeCkmDmXeqH80Hf1ggANXPG4PxsyLg3hieywJ1pCRZGLv5IohR6iYCwBwFovAoGFE6kqUhRQlBokKO40qWB4GBKYRMQ6zJmBjB6r4WN2BgpNNKl1SFHZs1elkcmmiBRZSlSSFABKKNODlCNaHMZliJiZjVHcAAfN+P8SzALg2eWMkJP8XJFMkG9Jdh1spAYyYbLZ5ClAukLXXYtpGSkgBmI4UEap51NNNIqmG+cAJ0Z9OIaWnaZRD1SCCFVowaZDJ7dRtBg6EhCZdJOCdYzv6vNYHARe5GVZHSMQkpJe0LmHrXYSCMSs4B0hcGieV5x+OoW4ueoDxgn2sPYc4-s2AhB9ECSB-GNFobrH2tnDZTiqlcfSX2xM6hja8GjolpLEdHZFBnv2cVPw-gAkBDlX2iLOGT37FA4GowAASnC0JoGgG+3gAAyeCipFEXD2Qg1LyWOudfNrHIr1kAhLP9WUuapVGNlGYxnXYry8p3oqcxIbXJqCElgrIE6bxfGmYETh5z1SCQ0x9H6dmnNZbIhPrsYGroD4gGBhJS7u9hoXyPI0co-pdhwDYLPPC-bAjx0O1YFZ80QCjn7l26+vaabGGJGcC4+gOyfU+Th-7AiXoorLjgCACyJYcmEjmZgYBZtbWxZsEUeKB2PwhB3Jc5hAnfzlgkPOCUIBgDxz6IlyzFAhe21FtB67shBZxwkJ7jOQ4YkgCatBT7+VSzm8tEwFUBR-A4L45yr9cAXCrR8Y+OV-vfegFAO1xgzVnjWmw0wK4ugulBNSIEOVmSxvEKpzY6mk1Z2Dv0aDDcdM1KgSQZydw8EPrdddTMn0wQ5hgTxZwIuKIB7FQVzjF5Bhh+lK9ZosvZBnjBDH6CMXMnZJg8yDjapoyJzGzjFjpaRbLkL6-fSihssONqR1LqOYmk3lYtAXTu2vv7e3hzUpx9LtgpkzLO7+8ZbnZRpd67zBmQPa9E994knWDSc+y+G4GF3GDGbuUVInRTGSCH1uL7cmb4xbQZDzM0OrjTduPnwvAja+-GxcCMuZLBC1f6PFSMQ5jHE8CUp8nZgSnJ3I8b+OCHwLAXTJvT5HQdxMMPaDoLocsToMxL0HnH2eDaoMAX1FGcmSmOGCWFGVzRhORN7RUckVXe4ekKAKAj4foOGfzORMgWAfjBoEEU0VCPBQJZDadUqRnTIMg8aQYYdR8KRQJTdMafnciexMdZ6D6ZoIcV+D3JmNEPyOqOQoIYQIQXbAiHPGjZMCUcOLrYw6OVLSVTuaDFNNNTIWyQVN6HONucyfAxPY9NQt+A9HKFnPOAPIwkwvwu2WOOg1CSaPQnYBFcwt3XgQmNbT4Vgv+SAZUO8BgvFHZPgQocZP2VhKJKKKIhyd4WIkLdIv2JcTIBuCEfgTgF4CgIIvXRqRFSWV+ODN0BkCwHAA9NmRAKQKQDoKWUEbwarCgIgUgRVCgB6LZVIiZSRFCaDQVRJUqTgEVHIv2KtEiMqICV9FyD4TjV+CmETcEV4fI+MdYHI5bPsRhaIaISNfRSg14IlagRyKBBhC45laUMALxfsaqYKN9FVcuRQEQAPAICY5hPyAKXgH2FpRDN2cYOQjANRKsZwC4HqFvZiFA-8dMYONgN2f4CJKJYdekP3T5dg6oZ-XFHI8YQ6DMPQFcFyMyXQDxICLKdHNo7oO4ERQoNIcYhFck0gLEN9SE2yP+dwO4TQOQZgHAVoT5SklkKFboRgL1HIm9AoIaTMDAH9V9caRdXgWeFaWE1XE0eg4Qt4-yRGW+RYEARYPUBgdYH1fAIY5g3EGgegEAICV6NgfACIc0oAA" target="_blank" rel="noopener noreferrer">
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
