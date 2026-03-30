---
name: promptscript
description: >-
  PromptScript language expert for reading, writing, modifying, and
  troubleshooting .prs files. Use when working with PromptScript syntax,
  creating or editing .prs files, adding blocks like @identity, @standards,
  @restrictions, @shortcuts, @skills, or @agents, configuring
  promptscript.yaml, resolving compilation errors, understanding inheritance
  (@inherit) and composition (@use, @extend), or migrating AI instructions
  to PromptScript. Also use when asked about compilation targets (GitHub
  Copilot, Claude Code, Cursor, Antigravity, Factory AI, and 30+ other
  AI coding agents).
license: MIT
metadata:
  author: PromptScript
  homepage: https://getpromptscript.dev
compatibility:
  - claude-code
  - github-copilot
  - cursor
  - factory-ai
  - gemini-cli
  - opencode
  - windsurf
  - cline
  - roo
  - codex
  - continue
  - augment
  - goose
  - kilo
  - amp
  - trae
  - junie
  - kiro-cli
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
user-invocable: true
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
userInvocable, allowedTools, context ("fork" or "inherit"), agent, requires, references, inputs, outputs.

The `references` property attaches external files to the skill's context:

```
@skills {
  architecture-review: {
    description: "Review architecture decisions"
    references: [
      ./references/architecture.md
      ./references/modules.md
    ]
    content: (triple-quoted text)
  }
}
```

Allowed file types: `.md`, `.json`, `.yaml`, `.yml`, `.txt`, `.csv`. Paths are resolved relative
to the `.prs` file. Formatters emit referenced files alongside SKILL.md in the output directory.

### Parameterized Skills

Skills in `.promptscript/skills/<name>/SKILL.md` support template parameters via
YAML frontmatter. Define `params` in frontmatter and use `{{variable}}` in content:

```yaml
---
name: review
description: 'Review {{language}} code for {{standard}}'
params:
  language:
    type: string
  standard:
    type: string
    default: 'best practices'
references:
  - references/architecture.md
---
Review the code using {{language}} conventions following {{standard}}.
```

The `references` field in SKILL.md frontmatter lists files to attach to the skill's context.
Paths are relative to the SKILL.md file.

Pass values in `@skills` block:

```
@skills {
  review: {
    description: "Review code"
    language: "typescript"
    standard: "strict mode"
  }
}
```

Non-reserved properties (anything other than description, content, trigger,
userInvocable, allowedTools, disableModelInvocation, context, agent, requires,
inputs, outputs) are treated as skill parameter arguments.

### Skill Dependencies

Skills can declare dependencies on other skills via `requires`:

```
@skills {
  deploy: {
    description: "Deploy service"
    requires: ["lint-check", "test-suite"]
    content: (triple-quoted text)
  }
}
```

The validator (PS016) checks that required skills exist, detects self-references,
and catches circular dependency chains.

### Skill Contracts (Inputs/Outputs)

Skills can declare typed inputs and outputs in SKILL.md frontmatter:

```yaml
---
name: security-scan
description: 'Scan for vulnerabilities'
inputs:
  files:
    description: 'Files to scan'
    type: string
  severity:
    description: 'Minimum severity'
    type: enum
    options: [low, medium, high]
    default: medium
outputs:
  report:
    description: 'Scan report'
    type: string
  passed:
    description: 'Whether scan passed'
    type: boolean
---
```

Field types: `string`, `number`, `boolean`, `enum` (with `options` list).
The validator (PS017) checks field types, ensures enum fields have options,
and warns if param names collide with input names.

### Shared Resources

Skills in a folder can share common resources via `.promptscript/shared/`:

```
.promptscript/
  shared/
    templates.md         # Shared across all skills
    style-guide.md
  skills/
    review/
      SKILL.md           # Gets @shared/templates.md, @shared/style-guide.md
    deploy/
      SKILL.md           # Also gets shared resources
```

Files in `shared/` are automatically included in every skill with `@shared/` prefix.

### @agents

Custom subagent definitions. Compiles to `.claude/agents/` for Claude Code,
`.github/agents/` for GitHub Copilot, `.factory/droids/` for Factory AI, etc.

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

Supports mixed models per agent: `specModel` sets a different model for
Specification/planning mode (GitHub, Factory), `specReasoningEffort` sets reasoning
effort for the spec model (Factory only, values: "low", "medium", "high").

Factory AI droids support additional properties: `model` (any model ID or "inherit"),
`reasoningEffort` ("low", "medium", "high"), and `tools` (category name like "read-only"
or array of tool IDs).

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

#### URL imports (Go-module style)

Import directly from any Git repository by host path - no alias required:

```
@use github.com/acme/shared-standards/@fragments/security
@use gitlab.com/myorg/prompts/@stacks/python
```

Version pinning with `@`:

```
@use github.com/acme/shared-standards/@org/base@1.2.0    # exact version
@use github.com/acme/shared-standards/@org/base@^1.0.0   # semver range
@use github.com/acme/shared-standards/@org/base@main     # branch
```

#### Registry aliases

Short names for Git repository URLs, configured in `promptscript.yaml`:

```yaml
registries:
  company:
    url: github.com/acme/promptscript-registry
```

Then use the alias as scope prefix:

```
@use @company/security
@inherit @company/base-config
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

#### Skill-aware @extend semantics

When extending a skill definition via `@extend`, individual skill properties follow specific merge
strategies rather than the generic block merge rules:

| Strategy          | Properties                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Replace**       | content, description, trigger, userInvocable, allowedTools, disableModelInvocation, context, agent |
| **Append**        | references, examples, requires                                                                     |
| **Shallow merge** | params, inputs, outputs                                                                            |

Example — extending a base skill to add references and override content:

```
@use @company/skills as skills

@extend skills.code-review {
  content: (triple-quoted text with overridden instructions)
  references: [
    ./extra-context.md
  ]
}
```

The `references` array from the base skill and the overlay are combined (append). The `content`
field from the overlay replaces the base (replace).

### Parameterized Inheritance (Template Variables)

Use `{{variable}}` placeholders in a **parent/template** file, and pass values
from the **child** file via `@inherit` or `@use` with `(key: value)` syntax.

**IMPORTANT:** Variables are NOT set from `promptscript.yaml` or CLI. They are
passed from one `.prs` file to another through `@inherit` or `@use`.

**Step 1: Create the template** (parent file with `params` in `@meta`):

```
# base.prs - reusable template
@meta {
  id: "service-template"
  syntax: "1.0.0"
  params: {
    serviceName: string
    port?: number = 3000
  }
}

@identity {
  """
  You are working on {{serviceName}} running on port {{port}}.
  """
}
```

**Step 2: Inherit with values** (child file passes params):

```
# project.prs - concrete project
@meta { id: "user-api" syntax: "1.0.0" }

@inherit ./base(serviceName: "user-api", port: 8080)
```

After compilation, `{{serviceName}}` becomes `user-api` and `{{port}}` becomes `8080`.

The same works with `@use`:

```
@use ./base(serviceName: "auth-service") as auth
```

**Parameter types:** `string`, `number`, `boolean`, `enum("a", "b")`.
Optional params use `?` suffix. Defaults use `= value`.
Missing required params produce a compile error.

**Multi-service pattern** - reuse one template across many projects:

```
services/
  base.prs                          # template with params
  user-api/
    promptscript.yaml               # source: project.prs
    project.prs                     # @inherit ../base(serviceName: "user-api")
  auth-service/
    promptscript.yaml
    project.prs                     # @inherit ../base(serviceName: "auth-service")
```

## Configuration: promptscript.yaml

### Auto-injection

This skill is automatically included when compiling with `prs compile`. No manual copying needed.
To disable, set `includePromptScriptSkill: false` in your `promptscript.yaml`.

```
id: my-project
syntax: "1.1.0"
description: "My project description"
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
  windsurf:             # 31 additional agents supported
    version: simple
  cline:
    version: simple
registry:
  git: https://github.com/org/registry.git
  ref: main
registries:
  company:
    url: github.com/acme/promptscript-registry
  oss:
    url: github.com/prscrpt/community-registry
    ref: v2
```

### Lockfile: `promptscript.lock`

When remote imports are used, `prs compile` automatically generates a lockfile
recording the exact resolved commit for each dependency. This enables reproducible
builds across machines and CI. Commit `promptscript.lock` to version control.

## Syntax Version Validation

The `syntax` field in `@meta` declares the PromptScript language version (semver).

### Known Versions

| Version | What it adds                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `1.0.0` | Core blocks (identity, context, standards, restrictions, knowledge, shortcuts, commands, guards, params, skills, local) |
| `1.1.0` | Adds `@agents` (plus internal `@workflows`, `@prompts` - not user-facing)                                               |

### Validation Rules

- **PS018 (`syntax-version-compat`)**: warns when blocks used in a file require a higher syntax version than declared. For example, `@agents` with `syntax: "1.0.0"` triggers PS018. Suggestion: run `prs validate --fix`.
- **PS019 (`unknown-block-name`)**: warns when a block name is not a known PromptScript type, with fuzzy-match suggestions for typos.
- **PS025 (`valid-skill-references`)**: errors when a `references` entry points to a file with a disallowed extension or a path that cannot be resolved.
- **PS026 (`safe-reference-content`)**: warns when a referenced file contains potentially sensitive content (e.g., secrets, credentials).

### Fixing Syntax Versions

```
prs validate --fix          # Auto-fix syntax versions in .prs files
prs upgrade                 # Upgrade all .prs files to the latest version
```

`--fix` rewrites the `syntax: "..."` line in each file's `@meta` block to match the minimum version required by the blocks used. It only upgrades, never downgrades.

`prs upgrade` upgrades all files to the latest known syntax version regardless of what blocks they use.

## CLI Commands

```
prs init                    # Initialize project (auto-detects existing files)
prs init --auto-import      # Initialize + static import of existing files
prs migrate                 # Interactive migration flow
prs migrate --static        # Non-interactive static import
prs migrate --llm           # Generate AI-assisted migration prompt
prs compile                 # Compile to all targets
prs compile --watch         # Watch mode
prs validate --strict       # Validate syntax
prs validate --fix          # Auto-fix syntax version declarations
prs upgrade                 # Upgrade all .prs files to latest syntax version
prs import CLAUDE.md        # Import existing AI instructions
prs import --dry-run        # Preview import conversion
prs pull                    # Update registry
prs diff --target claude    # Show compilation diff
prs lock                    # Generate/update promptscript.lock
prs lock --dry-run          # Preview lockfile changes
prs update                  # Re-resolve all remote imports to latest
prs update <url>            # Update a specific registry
prs vendor sync             # Copy cached deps to .promptscript/vendor/
prs vendor check            # Verify vendor matches lockfile
prs resolve @alias/path     # Debug: show how an import resolves
prs registry list           # Show configured registries and aliases
prs registry add <alias> <url>  # Add a registry alias
```

## Output Targets

38 supported targets. Key examples:

| Target      | Main File                       | Skills                                             |
| ----------- | ------------------------------- | -------------------------------------------------- |
| GitHub      | .github/copilot-instructions.md | .github/skills/\*/SKILL.md                         |
| Claude      | CLAUDE.md                       | .claude/skills/\*/SKILL.md                         |
| Cursor      | .cursor/rules/project.mdc       | .cursor/commands/\*.md                             |
| Antigravity | .agent/rules/project.md         | .agent/rules/\*.md                                 |
| Factory     | AGENTS.md                       | .factory/skills/\*/SKILL.md, .factory/droids/\*.md |
| OpenCode    | OPENCODE.md                     | .opencode/skills/\*/SKILL.md                       |
| Gemini      | GEMINI.md                       | .gemini/skills/\*/skill.md                         |
| Windsurf    | .windsurf/rules/project.md      | .windsurf/skills/\*/SKILL.md                       |
| Cline       | .clinerules                     | .agents/skills/\*/SKILL.md                         |
| Roo Code    | .roorules                       | .roo/skills/\*/SKILL.md                            |
| Codex       | AGENTS.md                       | .agents/skills/\*/SKILL.md                         |
| Continue    | .continue/rules/project.md      | .continue/skills/\*/SKILL.md                       |
| + 26 more   |                                 | See full list in documentation                     |

### Formatter Documentation

For detailed information about each formatter's output paths, supported features, quirks, and example outputs:

- **Full formatter reference:** `docs/reference/formatters/` (7 dedicated pages + index of all 37)
- **llms-full.txt:** Available at the docs site root - contains all documentation in a single file for LLM consumption
- **Dedicated pages exist for:** Claude Code, GitHub Copilot, Cursor, Antigravity, Factory AI, Gemini CLI, OpenCode
- **All 37 formatters indexed at:** `docs/reference/formatters/index.md` with output paths, tier, and feature flags

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
7. Using `{{var}}` in the root file without `@inherit` - template variables only work
   in a parent file that defines `params` in `@meta`, with values passed by the child
   via `@inherit ./parent(key: value)` or `@use ./fragment(key: value)`. They are NOT
   set from `promptscript.yaml` or CLI flags

## Migrating Existing AI Instructions to PromptScript

### Automated: `prs import`

The fastest way to convert existing AI instructions to PromptScript:

```
prs import CLAUDE.md                    # Convert a single file
prs import .github/copilot-instructions.md
prs import AGENTS.md --output ./imported.prs
prs import --dry-run CLAUDE.md          # Preview without writing
```

`prs import` automatically:

- Detects the source format (Claude, GitHub Copilot, Cursor, Factory, etc.)
- Maps content to appropriate PromptScript blocks (@identity, @standards, etc.)
- Generates a valid `.prs` file with `@meta` block
- Preserves the original intent and structure

Supported source formats:

- `CLAUDE.md` (Claude Code)
- `.github/copilot-instructions.md` (GitHub Copilot)
- `.cursorrules` or `.cursor/rules/*.mdc` (Cursor)
- `AGENTS.md` (Factory AI / Codex)
- `.clinerules` (Cline), `.roorules` (Roo Code)
- `.windsurf/rules/*.md` (Windsurf)
- Any Markdown-based AI instruction file

### Manual Migration

For complex migrations or when `prs import` needs refinement:

| Source Pattern                      | PromptScript Block |
| ----------------------------------- | ------------------ |
| "You are..." persona text           | `@identity`        |
| Project description, tech stack     | `@context`         |
| Coding conventions, style rules     | `@standards`       |
| "Never...", "Always...", hard rules | `@restrictions`    |
| `/command` definitions              | `@shortcuts`       |
| Skill/tool definitions              | `@skills`          |
| Agent/subagent configs              | `@agents`          |
| Reference docs, API specs           | `@knowledge`       |

After import, split into modular files (`context.prs`, `standards.prs`, etc.)
and compose with `@use` in `project.prs`. Run `prs validate --strict` then
`prs compile` to verify output matches the original.
