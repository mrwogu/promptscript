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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEV1ZmSxxG1CGiwB6GswBWMRlgFwAOq3UABEjCwZewdb14QAJol6qQJAJ4BaMAFcoUOHsYBrOxjRorR3jgbdgxCCysARgoABhj-VmNWUhhwkABZG14AMWdXdw9eAEFfeONTeDEJLAg2VMLeEmZy6gSnFzcMT14fcghGbBqEgHcIXF4AFRs0GABlSsl4gF91LTNOaqxMwwTLEH89nYBNZkdu6hhuhKJp6ixeNrzOgvKANxgoZhvA6cYIDCgIAAvCCsADmJgSk2mc3EkjoAQASjBOlg6JdTLwAHJNGAUORwCi8Y6nIbiDi8RiwDCsNEkDAgvQgjAAI1gaOpGKG7ygdg4bhgGJY5QoAX2SxWrE0LHYRDu22MUGpoMcGFB8AsyE201EsKwAF0AtRHOwIDpUtjhfjeAAmaIAalKDTYzHOaGYFnlxl4WGYzCg5sIjuMmE8qpgaWpYeoqTQrDQJEdy1YSa0HVYpgw1FMcAMAS1FV1GoCxisMyw4iUTvKvE4LNgpiDuwAqnALkkdBjri6RLw2FAbI6DRodu2QaCizsSyAstB1bwPDBmSy7P1WxQRIOJcY+dUwROvc3W7wXqN4HcMDmd-dqMkhi6PI2rBGGfSEgBOaIAUgpOJ-bxvaqbsOxigqM+5elYLYXAAwmwbwmmw-y8LBJAkKMOZgC6dJYI+IBQnOYDIqi9wQIQaKmMwjBwGibg2GyvDnGAKIumiO5oowOAujAQEppKyqZtmuY7KCHzMnARYgAAVJJUiSeuaggGiVjSbJ8mBopuwqXJcA-PJVhDrxmjnG4FbVGwOaenYuyYjA-68I4R7Upk+a8FZDkXMaHisMwQzDKMODelMFz8VmCkBFZVg2XZ7m8OUTHOHcXa3DmVl9pk7YCjWhBusljoRSAUUwNQP6oaMvAjLgJx3DuYU7PlhXFXAHgSDW1CCMVOAcgCYLisOmhwJxtyMI4PaelYUjnCeMBDFYqRIlNQw-tWmHFQAjiqAKbOivDMmevA0CifTwI6407rNuwAOpkhcLBkOcOCcHAEBvPZrBlTVJ0gFIFFUedVgAOKcEV2AXD9jg6CEZkaAcopfeU5DMAOSBCQe5Q6lUgypAAIjACPOcw+2CKYjhKIMjayMIFjlo43GToEHBoOJvDIFYABCjjQA2GlWOMZ5WEpIA43j3oEx0oE9dzIAIsagSNAu3pngpAtCx8+OE00JNQ-pARJrxfAALyG0bxsm6bZvmxblsm+ofAzM17SubwSIOXWFyFAAkshPgstAowQMdrAG1bwch6HFsSv19uuCjJVoVgHrFrFBYY7UuzQecIO8KBdy3XHGF+h8IxgurCiVtK8FQ7VqMQHArtpDiUDu6wLyUQMqfU7TB7ShwhDx7sK0PgcB5huwqRqqwwM8mgjjUG6raNv8hcCuMvquBJrMXjg-O7EiGBcwLV2ntrdPd+sqRinTxgXQ9CRiERY6x+hiCJ8YUS8FByFwesgxIShef3FhbAVMgoAApRCfBgAASgsGjeYWtL42kJPhJmhFsBokgGRWKlFqL0zojANEjFmLUFYmedig1O4Hl4AAZkJAAaRgLjQIjhmSlzuN1Dy6Yiq8AAOzWgpJ1G8SgipqAQQAFkJE3SkjhqywTsIUEa5DTB2FZs5G8s5iorSKJ7C8T00yMAoQeAArISBq3QIadkIDXXc4Jc7oVerAOAOZrgAl+Fgfs3QmoChfrwAAbISQoUAhgYBsDmI0CRurWJ2jAFaN0hBx2sYnMUQ9eC8WMJNf2QwE501gbqTGO9bIZKWjdTqYJ4AALWhtUYmQOQmEcTTKuXp3LUCbi3forIUjeiNAYn8MpR67AvpQ3gAAFIqK0SDekGicUEAUhQXHSdNfhihmp7i3JQ7gfBYLVgAIqVM2N4qy+FAgYEIltGpsgvj4RhFUeytdAIIKsgAUTai6XgJTTDdRsUIcguggaOP2bwB5pg1QUgvLE-8YZVkHnWbwGYigZ5VP+U3aedwXj-DMG3YClCrLYkCIoc4PYQRFP+QAeQuoUGYQyRZoF4BEaIx5nATxvMyX21QA7eOhazPaQzBHVH0SIwZVkZjEoADLuyxoTEEvxvk5j3g9c4rB9H-KxgiQ421aHuxmDMCVCqJAOP+dyiBxVRzF3Lt-cykKvTQpGdQMZ1JFX3PfqwCefLa7UEyOcOw8rmg5kJbvJQ-zMR2giLwdaRVMiyHaSQflWLeBpBgI0N1vAqQeGjVOAZKTVk7iyajZOkg8lWEPuSW6NAYA3yei9Y071FaNiaS01u7SqZdMTqfPpSTvHX04OVMkD8arPwQW-D+AA1U8bgPETIuFeMJjLvHWkJFkAuPkiiFHqJgLAHAWi8BAYUNqSp8FFCUGiQojiipYEgd4mhEw9rMmYGMTqvhw3YACjUoq7UQWtlTV6cRsbKIFFlEVJIUAk7TE4TqgOgzjETEzGqO4AA+D835Zl-mBncwZfj35HhyRjF6V4MofrbTsVJDFolEOzV6TDebU6lkcKCNUo6ammm+RDHOv5CFKBdGORsp9e6pBBHK0YnG2AcFbXsET7ab5EaYmx8QKz+2EgeawOAM8J2K32joqJMTtrHPXTOwkEZ5ZwDpC4NEkrzhMaQhxXdH7jAXvoYw2xPZsBCD6N4r9WNKLg3WDtDOyybElNo4k0TyTdYSiDmHML4XLY2yKOPHsgqfh-ABICTKHsYXMJHj2EB-1RgAAlmGfzQNAG9vAABkyFFTSJgjiM9gdeARbq-Vo2Ed0sWQCLMz1BTppFVI2UXNUNUgPOyieopRGFpFUJB-WQh03juK01wxDFnSkEkbD6P0TMWZS2RPvXY-1XTbwBqJPbIAN4DWPgeRo5R-S7DgGwCeOFknGCatANezMrDzJmiAIcXdBNn36aJhBxIzgXH0K2N6LzENva4Y9eFxccAQGmfTDkAkczMDAMN9aaLNgikxQeDtCQQQtwXOYbxb9pYJGzrFCAYBUc+lxXMxQnmFv+YQbO7I7nkcJHO5T-2GJIB6oQRezl4sRuFNNB2P4HB3EOR7Q9Qm7xmB70ym9wIUcLXGANSeZaDDTBLi6C6UE1IgSZWZOG8Q7HNh9oFchbt-RAM10U2UkBJAHJ3AwdVy3F1MxvTBDmMBnFnA89Im7mNMxqO0crpu6UT1mgmDuswE8YIg9pr+8YQj5RmSh66zHHr6MKOsGxouUPD8dKKAS1Y8prV2oyvTArUdTFoBKaW-dkWq2JK7y21YQF-HJbHa3pLHbuNDv-QOx9xO533g8dYHxu7icbhoUcYMeu5RUidH0ZITvG4m8tr7vhwZAPMxA6uIN24Sd080a4cX34aLgTF0JYIIr-QYqRn7LorHYnO34+YITi3lC37QR8FgJTCvF5HQRxMMbaDoLocsTobpYwFnd2coE0MAd1XGImTWQYemXGKzahCRa7RUckXAC4OvKAQAj4foeBQZL9d2MgWAJjBoEEU0JCDBbxCDQdIqSnTIXAkadAu8agFNVXVnYadnEiSxYuAg16ZofsB+O3GmNEbyaqGXIIYQIQJbOmHfDNZMELWrBrbQsLKLYVVuQDONBNTIKyblZ6TOJuEyNA8yTdOQx+NdTKGnbOarULHQtwyLPqUgpCMaQLAIaFfQm3XgHGabT4Wg2CVgSAZUG8eBPw6FQoIZT2ehEJcKII2yOXeMTzeIz2BcTIGuCEfgTgF4CgLwqAFIssVUB+TgUwN0BkCwHANdRmRAKQKQMWMcbwArCgIgUgb5CgW6VZdZPga1a7ADYZRiIqTgPlFIz2EtQiYqf8a9I8D4GjB+YmaTcEV4dIpjFIibbsahaIaIYNTRMQ14XFagOyEBKhfYulaUMAFxHsCqAKG9OVEuRQEQarWIvgWhbyXyXgd2OpMDR2cYGXDABRKsZwC4TqGVBiaAnpUwP2NgR2f4IJEJcqekF3F5eg6oK-DFFI3mUdDMPQJcI8YyXQJxf8dKOHeo7oO4PhQoNIfo6FXmUgLEG9AEqycI9wO4TQOQZgHAVoF5AklkUFboRgF1FIo9AofqTMDAJ9a9EacdXgCeRaEEggk0Mg9A24nyWGC+RYEARYPUBgdYN1fALo6g3EGgegEAf8J6NgfACIPUoAA" target="_blank" rel="noopener noreferrer">
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
