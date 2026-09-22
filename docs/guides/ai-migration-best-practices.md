---
title: AI Migration Best Practices
description: Guidelines for AI models performing PromptScript migration
---

# AI Migration Best Practices

This guide provides best practices for AI models performing automated migration from existing AI instruction files (CLAUDE.md, .cursorrules, copilot-instructions.md) to PromptScript format.

## Content Analysis Principles

### Recognizing Block Types

When analyzing source content, use these patterns to classify into PromptScript blocks:

| Pattern          | Indicators                                        | PromptScript Block |
| ---------------- | ------------------------------------------------- | ------------------ |
| **Identity**     | "You are", "Act as", role descriptions            | `@identity`        |
| **Context**      | Tech stack, languages, "uses", "built with"       | `@context`         |
| **Standards**    | "Always", "Should", "Best practice", coding rules | `@standards`       |
| **Restrictions** | "Don't", "Never", "Avoid", "Must not"             | `@restrictions`    |
| **Commands**     | `/command`, "Shortcut:", command definitions      | `@shortcuts`       |
| **Knowledge**    | API docs, references, "Documentation:"            | `@knowledge`       |
| **Parameters**   | Config values, settings, variables                | `@params`          |
| **Guards**       | File globs, "applyTo:", path patterns             | `@guards`          |

### Handling Ambiguous Content

When content could belong to multiple blocks:

1. **Prioritize by specificity** - More specific blocks over general ones
2. **Consider the "why"** - Standards explain _how_, restrictions explain _what not to do_
3. **Look at surrounding context** - Headers and sections provide hints
4. **Preserve intent** - Keep the original meaning, even if restructured

### Content Classification Priority

When content is unclear, use this priority order:

1. `@restrictions` - If it says "don't" or "never"
2. `@standards` - If it's a positive rule or guideline
3. `@context` - If it's factual project information
4. `@knowledge` - If it's reference documentation
5. `@identity` - If it describes the AI's role or behavior

## Syntax Patterns

### Multi-line Strings

Use triple quotes for any content with:

- Line breaks
- Markdown formatting
- Code examples
- Multiple paragraphs

```promptscript
@identity {
  """
  You are a senior TypeScript developer.

  Your focus areas:
  - Clean code
  - Type safety
  - Testing
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IKXYTR15Aq3CQWLqagE13MWo7UThOCGZqXgAVRzQYAGVGagg0LF4pADcYKGYh6goipvdesGZGN2UMNow4RDiAWl4AYVgMKxYpE-7BuzgMMGFHO774LAhWdTj6vPyIHyAF0GJwsNRHPgiKRyDAqLQQAw5rRuqx8KkgUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Standards Organization

Group standards by category for clarity:

```promptscript
@standards {
  code: [
    "Use functional programming patterns",
    "Write pure functions when possible"
  ]
  testing: [
    "Write tests for all public functions",
    "Use AAA pattern (Arrange, Act, Assert)"
  ]
  documentation: [
    "Document public APIs with JSDoc",
    "Keep README up to date"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKsdZikw5DjgiIBVODswD0YsCDYMKHtXF1ISCFZ1e2wOalY4CLpm8JAAdWoTOzQ3ak7u3rZlcxxOe2Y4OAgAIxiQOIBdOI5S8fVGpYi1jYV4UxVmajEUEGW2uEEYKj2fTmC3eIHadgAgkiplgZlYABQI6hqCYwOi8BE9fEI84wahYACUeWCD1q4mYjDcWhE+1Yb1qLRAABEGUzOFh7G5QeCEQAFACShxMOF4ACkAMo8xgwjnLADSMBgaF4ACUAKIIrkAWT1vDc2qw8nE2Bg1N4tPyIHydwY-OojnwRFI5BgVFoIAYADcyRc2PhUk6gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Restrictions Format

Always use dash prefix for restrictions:

```promptscript
@restrictions {
  - "Never commit secrets or credentials"
  - "Don't use any type in TypeScript"
  - "Avoid default exports"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35qeCxqCEYsCDZlQKteAFpwkAA5GAA3GGodZhISE1kYRlLTQx6R6U5qjCg4PODmiIARNgByLF43ODsMVkcFRzQ7CCsAFSOYAGURiDQsBaaWgEEO5ggZKTAMNyhNojQzGopjy+RA+QAugxptRHPgiKRyDAqLQQAwurQaqx8KlwUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Shortcuts Complexity Levels

**Simple shortcuts** - Single action or description:

```promptscript
@shortcuts {
  "/test": "Run the test suite"
  "/build": "Build for production"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq3CQAHoOOCwIlJAAJQ8FHDsWrFk3Exg84IjGgCNhqG8kBoAhGZkwcvtXcTdGLAg2PPyQfIBdBk4sakd8IlJyGCpaEAYANxhaXdZ8VMOgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Complex shortcuts** - With detailed instructions:

```promptscript
@shortcuts {
  "/review": {
    prompt: true
    description: "Perform code review"
    content: """
      Review the code for:
      1. Type safety issues
      2. Error handling gaps
      3. Security vulnerabilities
      4. Performance concerns
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq3CQAHpqGAA3CBhzCLC64OCaZjIsMKxqNxg44Kk4RmoINCwINhSQAAUYajBykh1mKV4W9s68vt32TmGG2JBJvoAlNo7zBRw7Fn2t6kRb4PTeABVHGg7HAMGBhI5jHA4OM4D9eAAmCi8ACi1Fc1F4OAwnigEFY6l46gwaDh9VOAGZkQBlGBVOZYSGtNxQVgbDAAI2gJg6ZNOwQALMj1pttjjGG82BLqKw+X1rideIUCiB8gBdBgXaiOfBEUjkGBUWggBitDZwJasfCpVVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Migration Workflow

### Recommended Sequence

```
Discovery → Analysis → Mapping → Generation → Validation → Comparison → Iteration
```

1. **Discovery** - Find all existing instruction files
2. **Analysis** - Read and categorize content in each file
3. **Mapping** - Map content to PromptScript blocks
4. **Generation** - Generate PromptScript files
5. **Validation** - Run `prs validate`
6. **Comparison** - Compare compiled output with original
7. **Iteration** - Refine until output matches expectations

### File Discovery Order

Check files in this priority order:

1. `CLAUDE.md` / `CLAUDE.local.md` - Often most comprehensive
2. `.cursorrules` - Usually has coding standards
3. `.github/copilot-instructions.md` - Project context
4. `AGENTS.md` - Agent definitions
5. `.github/instructions/*.md` - File-specific rules
6. `.cursor/rules/*.md` - Additional Cursor rules

### Merging Strategy

When combining multiple source files:

1. **Identity**: Use the most detailed and specific description
2. **Context**: Union of all technical context, deduplicate
3. **Standards**: Merge by category, remove exact duplicates
4. **Restrictions**: Include all restrictions (union)
5. **Shortcuts**: Merge, use longer description for conflicts

## Common Mistakes to Avoid

### Missing @meta Block

**Wrong:**

```promptscript
@identity {
  """
  You are a developer...
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IKXYTR15Aq3CQWLqagE13MWo7USkANxgoZjQYagohuPq8-JB8gF0GTixqR3wiUnIYKloQBm7aCDZ8VImgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Correct:**

```promptscript
@meta {
  id: "project-name"
  syntax: "1.0.0"
}

@identity {
  """
  You are a developer...
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgazAFYxGWALStSMeWIlwAnuwyFZ8gIwUADNd2sAvmLHdpnLBCwHheuSF1-xQQBNZgBXQQxqGAjBKRgANxgoZjQYagoMn387exB7AF0GN2oDfCJSchgqWhAGRNoINnxzPKA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Loose Multi-line Strings in Objects

**Wrong:**

```promptscript
@standards {
  code: {
    style: "functional"
    """
    Additional notes about the style...
    """
  }
}
```

**Correct:**

```promptscript
@standards {
  code: {
    style: "functional"
    notes: """
      Additional notes about the style...
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKsdZikwmuDg0sdYFPAPRiwINgwoPObeVmYOOA7YkDihgEFJE17WfuHRgwwAI3csBRw7VsoKCmnwqdO4woKQfIBdBk4sakd8IlJyGCpaEAYANxhaRfwqSuQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Mixing Block Concerns

**Wrong:**

```promptscript
@standards {
  code: [
    "Use TypeScript",
    "Never use any"  # This is a restriction
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKsdZikw5DjgiIBVODsAFUc0GABlRmoINCwIumbwkAA5GAA3GGpeNw6xVkcI4L5OnCVjZVFqeCwhxiwINjiAXR98kHzLhk5jx3wiUnIYKloQBnnac9Y+FSdyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Correct:**

```promptscript
@standards {
  code: [
    "Use TypeScript"
  ]
}

@restrictions {
  - "Never use any type"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKsdZikw5DjgiIBVODsAFUc0GABlRmoINCw84IBdH0LWYup4LCHGLAg2ariAWnCQADkYADcYal43DrFWRwUemDz8kHzxhk4Fx3wiUnIYKloQBgPaFdY+FSdyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Forgetting Commas in Arrays

**Wrong:**

```promptscript
@context {
  languages: [typescript python ruby]
}
```

**Correct:**

```promptscript
@context {
  languages: [typescript, python, ruby]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34WdiIsXkCrXigMVnU3DXgw5CxHNHhGagg0LDp7R1w2fuo3ACNHAF0ffJB8yYZOLGpHfCJSchgqWhAGADcYWgg2fFS5oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Quality Checklist

Before completing a migration, verify:

### Structure

- [ ] `@meta` block exists with `id` and `syntax`
- [ ] Blocks are in logical order (meta, inherit, use, identity, context, ...)
- [ ] No duplicate blocks of the same type

### Content

- [ ] Identity clearly describes the AI's role
- [ ] Standards are organized by category
- [ ] All restrictions from source are preserved
- [ ] Commands/shortcuts work as expected
- [ ] No content was lost in migration

### Syntax

- [ ] All strings properly quoted
- [ ] Multi-line strings use `"""`
- [ ] Arrays use proper syntax
- [ ] No loose multi-line strings in objects

### Validation

- [ ] `prs validate` passes without errors
- [ ] `prs compile --dry-run` produces expected output
- [ ] Compiled output matches original intent
- [ ] Each target (Claude, GitHub, Cursor) looks correct

## Tool-Specific Considerations

### Claude Code

- Agents should use `@agents` block
- Local development settings go in `@local`
- Use `CLAUDE.local.md` content for `@local` block

### GitHub Copilot

- Prompts with `prompt: true` generate to `.github/prompts/`
- File-specific instructions use `@guards` with globs
- Instructions in `.github/instructions/` map to `@guards`

#### Migrating `.github/instructions/*.instructions.md` Files

Files in `.github/instructions/` with `applyTo` frontmatter should be migrated using **`@guards` named entries**, not `@standards` or `@context`. Each instruction file becomes a named entry under `@guards`:

```promptscript
@meta { id: "copilot-instructions-migration" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular component coding standards"
    content: """
    Use OnPush change detection for all components.
    Always implement OnDestroy for cleanup.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJszTRmWALQRWcLNQCujLBDZwlJCAHNq2PaxmC4AT3YZCkmQEYKABndWAvlMutuxpoY1GJwwr6CghisgVDBSixkbJxYcJLAEZFRaOQ2ACrMksgyGDlwAPQYYkas5QBUdfUUqTJ00iClaBUA7jAARgBuEDDd9Y11zXAyALqZkWLwjNQQaLpsTiAAgjGacdSCiWjJ7AfMYqrG1gKsYsGhMnOn7CkbDyCPAKpwMIIA8qwABU0cBwBxw0WMPwWHB0FkEYGY+wwUCgpySrBScAoj02UG6GBsYQgZFgfBO-wAIvANMwbPDEQdYNFNGhsawsu03pkfKwvCAvNMGClqDZ8ERSOQYFRaCAGAMYLQLPhnPygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`prs migrate --static` discovers project instruction files and converts
`.github/instructions/*.instructions.md` files with `applyTo` frontmatter to named `@guards`
entries. Review the generated files before compilation.

### Cursor

- Rules map to `@standards` and `@restrictions`
- `.cursor/rules/*.mdc` files have frontmatter with globs → use `@guards`
- Model preferences are configuration, not instructions

## Iteration Tips

### When Validation Fails

1. Check the error message for line numbers
2. Look for common syntax issues (missing quotes, colons, brackets)
3. Simplify the problematic section
4. Add content back incrementally

### When Output Differs

1. Run `prs compile --verbose` to see processing steps
2. Check if content is in the correct block type
3. Verify block names match expected patterns
4. Look for content being filtered by guards

### When Content is Missing

1. Verify the source content was included in a block
2. Check if the block type is supported by the target
3. Look for syntax errors that might cause parsing to stop
4. Use `--dry-run` to see what would be generated

## Example Migration

### Source: CLAUDE.md

```markdown
# Project

You are a senior engineer working on the API service.

## Stack

- Python 3.11
- FastAPI
- PostgreSQL

## Rules

- Write type hints for all functions
- Use async/await for I/O

## Don'ts

- Don't commit .env files
- Never store passwords in plain text

## Commands

/test - Run pytest
/deploy - Deploy to staging
```

### Result: project.prs

```promptscript
@meta {
  id: "api-service"
  syntax: "1.0.0"
}

@identity {
  """
  You are a senior engineer working on the API service.
  """
}

@context {
  languages: [python]
  runtime: "Python 3.11"
  frameworks: [fastapi]
  database: "PostgreSQL"
}

@standards {
  code: [
    "Write type hints for all functions",
    "Use async/await for I/O operations"
  ]
}

@restrictions {
  - "Don't commit .env files"
  - "Never store passwords in plain text"
}

@shortcuts {
  "/test": "Run pytest test suite"
  "/deploy": "Deploy to staging environment"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMaCAFo4MagDcIjGPLES4AT3YZCs+QEYKABht7WAXzFju0zlghZDw-XJB7-cUEATWYAV0EMahhIwTVWCGZqQU4AcwhWGHVBAHckgGsM1ME2QVwYgEEABQBJOPUtHQpfAPsnVhcWdiIsHyCoDFZUsIxU+FlkNENcNgBdX2ow9gg+cxAq6ZxSgGYKCwt7CTBqUhg86ny4CbAMOAEleaCpbAwAI1uYNarmO9TogGUAIoAGTazlY3Dug2e1CkcD6EhYUk+gmQvgk8gA6tRPDEvGgYjgMlh4WAkpEoFBBGAlowPGw4PI6Oi-ABVNSRIysRgAegwOQwnmp5JqPIA8iUCSd6axGYEJI92i5onccXTErKEYJlH4ACJsADkvRYJBIQoonA01Og8EO2r8ADkYBpsnckjFMHA4Oc4ZJxORBeIOIQsGCOhC4FtqFhGGESVr5DyOHd5GsAEpLQRTZO9HNxMK4u2J5HkZiGVN6mCl7xYZhxATpIYpVhaahsPjsNogByzBjuaiGfBEUjkGBUWggBgu2ga-AWbtAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## See Also

- [Migration Guide](migration.md) - Step-by-step migration instructions
- [Language Reference](../reference/language.md) - Complete syntax reference
- [Multi-File Organization](multi-file.md) - Organizing complex projects
