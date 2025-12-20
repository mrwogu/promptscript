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
  typescript: {
    strictMode: true
    exports: "named only"
  }

  naming: {
    files: "kebab-case.ts"
  }

  testing: {
    framework: "vitest"
    coverage: 90
  }

  git: {
    format: "Conventional Commits"
    types: [feat, fix, docs, style, refactor, test, chore]
  }
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

### GitHub Copilot Output

With `version: full`, the formatter generates:

**`.github/copilot-instructions.md`** (main file)
**`.github/instructions/typescript.instructions.md`** (path-specific rules)
**`.github/skills/commit/SKILL.md`** (commit skill)
**`.github/skills/review/SKILL.md`** (review skill)
**`.github/agents/code-reviewer.md`** (code reviewer agent)
**`.github/agents/debugger.md`** (debugger agent)
**`AGENTS.md`** (agent instructions)

Example skill file:

```markdown
## <!-- .github/skills/commit/SKILL.md -->

name: "commit"
description: "Create git commits following project conventions"
disable-model-invocation: true

---

When creating commits:

1. Use Conventional Commits format: type(scope): description
2. Types: feat, fix, docs, style, refactor, test, chore
   ...
```

### Claude Code Output

With `version: full`, the formatter generates:

**`CLAUDE.md`** (main file)
**`.claude/rules/code-style.md`** (path-specific rules)
**`.claude/skills/commit/SKILL.md`** (commit skill)
**`.claude/skills/review/SKILL.md`** (review skill)
**`.claude/agents/code-reviewer.md`** (code reviewer subagent)
**`.claude/agents/debugger.md`** (debugger subagent)
**`CLAUDE.local.md`** (private instructions)

Example agent file:

```markdown
## <!-- .claude/agents/code-reviewer.md -->

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

Example local file:

```markdown
<!-- CLAUDE.local.md -->

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
- [Formatters API: GitHub](../api/formatters.md#github-copilot-formatter)
- [Formatters API: Claude](../api/formatters.md#claude-code-formatter)
