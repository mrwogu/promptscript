# The PromptScript Language in a Nutshell

## Structure of a .prs file

Every .prs file begins with an @meta block containing an identifier and syntax version. It then contains blocks defining different aspects of AI instructions.

## Main blocks

@meta is file metadata: project identifier, syntax version, and optional template parameters.

@identity defines who the AI is in the context of this project. For example, "You are an expert backend architect working on the payments service." It sets the AI's role and perspective.

@context is project context: programming languages, frameworks, architecture, dependencies. It gives the AI knowledge about the environment it's working in.

@standards defines coding standards: style, naming conventions, architectural patterns, testing requirements. It specifies what the AI should do.

@restrictions defines constraints: what the AI should not do. For example: never use the any type, don't commit without tests, don't expose API keys.

@shortcuts are commands the user can invoke. For example, /review runs a code review, /test generates tests, /deploy deploys to production.

@skills defines reusable AI capabilities with descriptions, allowed tools, and resources.

@agents defines AI subagents with specific roles and tools.

@guards are context-aware rules activated for specific files or directories.

@knowledge contains references to documentation, APIs, and specifications.

## Composition and inheritance

@inherit lets you inherit from another .prs file. The project inherits all blocks from the parent and can extend or override them.

@use imports a fragment. It lets you compose instructions from smaller, reusable pieces. You can import from local files or from a Git registry.

@extend modifies inherited values without overwriting the whole block.

## Example of a complete file

```
@meta { id: "api-service" syntax: "1.0.0" }

@inherit @company/backend-standards
@use @fragments/testing
@use @fragments/security

@identity {
  """
  You are a senior backend engineer working on the REST API service.
  The service uses Express.js with TypeScript and PostgreSQL.
  """
}

@standards {
  code: {
    languages: ["TypeScript"]
    testing: ["Vitest", ">90% coverage"]
  }
}

@restrictions {
  - "Never use any type"
  - "Never expose database credentials"
  - "Always validate request input"
}

@shortcuts {
  "/review": "Code review focused on security and performance"
  "/test": "Generate unit tests for the current file"
}
```

This single file compiles to native formats for your chosen tools. GitHub Copilot gets markdown in its format. Cursor gets an .mdc file with metadata. Claude Code gets CLAUDE.md. Each format is idiomatic for the given tool.
