---
name: promptscript
description: PromptScript language expert for reading, writing, modifying, and troubleshooting .prs files. Use when working with PromptScript syntax, creating or editing .prs files, adding blocks like @identity, @standards, @restrictions, @shortcuts, @skills, or @agents, configuring promptscript.yaml, resolving compilation errors, understanding inheritance (@inherit) and composition (@use, @extend), or migrating AI instructions to PromptScript. Also use when asked about compilation targets (GitHub Copilot, Claude Code, Cursor, Antigravity, Factory AI).
---

# PromptScript Language Guide

PromptScript is a domain-specific language that compiles `.prs` files into native instruction formats for AI coding assistants (GitHub Copilot, Claude Code, Cursor, Antigravity, Factory AI, OpenCode, Gemini CLI). One source of truth, multiple outputs.

## File Structure

A `.prs` file is made of blocks. Order doesn't matter except `@meta` should come first by convention.

```
# Comments start with #

@meta { ... }           # Required metadata
@inherit @path          # Single inheritance (optional)
@use @path [as alias]   # Imports/mixins (optional, multiple)

@identity { ... }       # AI persona
@context { ... }        # Project context
@standards { ... }      # Coding conventions
@restrictions { ... }   # Hard rules
@shortcuts { ... }      # Command aliases
@knowledge { ... }      # Reference documentation
@skills { ... }         # Reusable skill definitions
@agents { ... }         # Subagent definitions
@params { ... }         # Template parameters
@guards { ... }         # File globs and priorities
@local { ... }          # Private config (not committed)
@extend path { ... }    # Modify imported blocks
@custom-name { ... }    # Arbitrary named blocks
```

## Content Types

PromptScript has three content types inside blocks:

### Text Content

Use triple quotes (three double-quote characters) to wrap multiline text.
Text is automatically dedented - leading whitespace from source indentation is stripped.
Use for prose, markdown, or freeform content.

Example: `@identity` with a text block describing an AI persona starting with "You are..."

### Object Content (key-value pairs)

```
@context {
  project: "My App"
  team: "Frontend"
  monorepo: {
    tool: "Nx"
    packageManager: "pnpm"
  }
}
```

Values can be strings (quoted or unquoted), numbers, booleans, nested objects, or arrays.

### Array Content

```
@standards {
  code: [
    "Use strict TypeScript",
    "Named exports only"
  ]
}

@restrictions {
  - "Never use any type"
  - "Never commit secrets"
}
```

### Mixed Content

Blocks can contain both object properties and text in the same block.
Place the triple-quoted text block alongside key-value pairs.

## Block Reference

### @meta (required)

```
@meta {
  id: "project-id"        # Required: unique identifier
  syntax: "1.0.0"         # Required: syntax version (semver)
  org: "Company Name"     # Optional
  team: "Frontend"        # Optional
  tags: [react, ts]       # Optional
  params: {               # Optional: template parameters
    projectName: string
    port: number = 3000
    debug?: boolean
    framework: enum("react", "vue") = "react"
  }
}
```

### @identity

Defines AI persona. Start with "You are..." for consistent output across all formatters.
Contains a triple-quoted text block with the persona description.

### @context

Project context with structured properties (project, team, languages, runtime)
plus optional triple-quoted text for architecture details, diagrams, etc.

### @standards

Category-based conventions. Any category name is valid:

```
@standards {
  typescript: ["Strict mode", "No any type"]
  naming: ["Files: kebab-case.ts", "Classes: PascalCase"]
  git: {
    format: "Conventional Commits"
    types: [feat, fix, docs, refactor, test, chore]
  }
}
```

### @restrictions

Hard rules as a list of dash-prefixed strings:

```
@restrictions {
  - "Never expose API keys"
  - "Never commit secrets to version control"
  - "Always validate user input"
}
```

### @shortcuts

Simple strings appear as documentation. Objects with `prompt: true` generate
executable prompt/command files for GitHub Copilot and Cursor:

```
@shortcuts {
  "/review": "Review code for quality"
  "/test": {
    prompt: true
    description: "Write unit tests"
    content: (triple-quoted text with instructions)
  }
}
```

### @skills

Reusable skill definitions with metadata:

```
@skills {
  commit: {
    description: "Create git commits"
    trigger: "commit, git commit"
    disableModelInvocation: true
    userInvocable: true
    allowedTools: ["Bash", "Read"]
    content: (triple-quoted text with skill instructions)
  }
}
```

Properties: description (required), content (required), trigger, disableModelInvocation,
userInvocable, allowedTools, context ("fork" or "inherit"), agent.

### @agents

Custom subagent definitions:

```
@agents {
  code-reviewer: {
    description: "Reviews code quality"
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    permissionMode: "default"
    content: (triple-quoted text with agent instructions)
  }
}
```

### @knowledge

Reference documentation as triple-quoted text. Used for command references,
API docs, and other material that should appear in the output.

### @params

Template parameter definitions with types: string, number, boolean, enum("a", "b").
Optional parameters use `?` suffix. Defaults use `= value`.

### @guards

File glob patterns and priority rules for path-specific instructions.

### @local

Private local configuration. Not included in compiled output or committed to git.

## Inheritance and Composition

### @inherit (single, linear)

One per file. Child blocks merge on top of parent:

```
@inherit @company/frontend-team
@inherit ./parent
@inherit @stacks/react-app(projectName: "my-app", port: 3000)
```

### @use (multiple, mixins)

Import and merge fragments:

```
@use @core/security
@use @core/quality
@use ./local-config
@use @core/typescript as ts   # alias enables @extend access
```

Merge rules:

- Text: concatenated with deduplication
- Objects: deep merged (target wins on conflicts)
- Arrays: unique concatenation

### @extend (modify imported blocks)

Requires an aliased @use:

```
@use @core/typescript as ts

@extend ts.standards {
  testing: { coverage: 95 }
}
```

## Configuration: promptscript.yaml

```
version: '1'
input:
  entry: .promptscript/project.prs
  include: ['.promptscript/**/*.prs']
targets:
  github:
    version: full      # simple | multifile | full
  claude:
    version: full
  cursor:
    version: standard
  antigravity:
    version: frontmatter
  factory:
    version: full
registry:
  git: https://github.com/org/registry.git
  ref: main
```

## CLI Commands

```
prs init                    # Initialize project
prs init --migrate          # Initialize + migration skills
prs compile                 # Compile to all targets
prs compile --watch         # Watch mode
prs validate --strict       # Validate syntax
prs pull                    # Update registry
prs diff --target claude    # Show compilation diff
```

## Output Targets

| Target      | Main File                       | Skills                      |
| ----------- | ------------------------------- | --------------------------- |
| GitHub      | .github/copilot-instructions.md | .github/skills/\*/SKILL.md  |
| Claude      | CLAUDE.md                       | .claude/skills/\*/SKILL.md  |
| Cursor      | .cursor/rules/project.mdc       | .cursor/commands/\*.md      |
| Antigravity | .agent/rules/project.md         | .agent/rules/\*.md          |
| Factory     | AGENTS.md                       | .factory/skills/\*/SKILL.md |
| OpenCode    | agents.yaml                     | -                           |
| Gemini      | GEMINI.md                       | -                           |

## Project Organization

Typical modular structure:

```
.promptscript/
  project.prs      # Entry: @meta, @inherit, @use, @identity, @agents
  context.prs      # @context (architecture, tech stack)
  standards.prs    # @standards (coding conventions)
  restrictions.prs # @restrictions (hard rules)
  commands.prs     # @shortcuts and @knowledge
```

The entry file uses `@use ./context`, `@use ./standards`, etc. to compose them.

## Common Mistakes

1. Missing @meta block - every .prs file needs `@meta` with `id` and `syntax`
2. Multiple @inherit - only one per file; use `@use` for additional imports
3. @extend without alias - requires prior `@use ... as alias`
4. Unquoted strings with special chars - quote strings containing `:`, `#`, `{`, `}`
5. Forgetting to compile - `.prs` changes need `prs compile` to take effect
6. Triple quotes inside triple quotes - not supported; describe content textually instead
