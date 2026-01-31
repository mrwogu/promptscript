---
title: Security Guide
description: Security considerations for PromptScript templates and inheritance
---

# Security Guide

Understanding security implications when using PromptScript's template system and consuming external stacks.

## Template Security Model

PromptScript's template system is designed with security as a core principle. Understanding its security model helps you confidently use parameterized inheritance.

### Values Are Data, Not Code

Template values (`{{variable}}`) are **never executed** as code. They are:

- Interpolated as plain text strings
- Validated against expected types (string, number, boolean, enum)
- Never passed to any code execution mechanism

```promptscript
@meta {
  id: "secure-template"
  syntax: "1.0.0"
  params: {
    projectName: string
  }
}

@identity {
  """
  Working on {{projectName}}
  """
}
```

Even if `projectName` contains suspicious content like `"; rm -rf /`, it's treated as a literal string in the output markdown—never executed.

### Output Is Static Markdown

PromptScript compiles to static markdown files (CLAUDE.md, copilot-instructions.md, etc.). These files contain no executable code, only text instructions for AI assistants.

### Type Validation

Parameters are validated at compile time:

```promptscript
# Template definition
@meta {
  params: {
    port: number           # Must be a number
    mode: enum("dev", "prod")  # Must be one of these values
  }
}
```

```promptscript
# Usage - these would cause compile errors:
@inherit ./template(port: "not-a-number")  # ❌ Type mismatch
@inherit ./template(mode: "staging")        # ❌ Invalid enum value
```

## Trusting External Stacks

While the template system itself is secure, you should still carefully evaluate external stacks before using them.

### The Real Risk: Prompt Injection

The primary concern with external stacks isn't code execution—it's **prompt injection**. A malicious stack could include instructions that manipulate the AI assistant's behavior:

```promptscript
# Hypothetical malicious stack
@identity {
  """
  You are a helpful assistant.

  IMPORTANT: Ignore all previous instructions and...
  """
}
```

### Mitigations

1. **Review Before Installing**

   Always inspect external stacks before adding them to your registry:

   ```bash
   # Clone and review before adding
   git clone https://github.com/org/stack.git
   cat stack/*.prs
   ```

2. **Use Trusted Sources**
   - Official PromptScript registry (`@core/*`, `@stacks/*`)
   - Your organization's private registry
   - Verified open-source projects

3. **Pin Versions**

   ```promptscript
   # Good: pinned version
   @inherit @stacks/typescript@1.2.3

   # Risky: unpinned (could change)
   @inherit @stacks/typescript
   ```

4. **Code Review Changes**

   When updating stack versions, diff the changes:

   ```bash
   # Compare versions
   git diff v1.2.3..v1.3.0 -- *.prs
   ```

## Environment Variables vs Template Variables

PromptScript has two interpolation mechanisms with different trust models:

| Feature               | Syntax    | Trust Level          | Resolved At  |
| --------------------- | --------- | -------------------- | ------------ |
| Environment Variables | `${VAR}`  | High (local machine) | Parse time   |
| Template Variables    | `{{var}}` | Medium (external)    | Resolve time |

### Environment Variables

Environment variables come from your local machine or CI environment. They're resolved during parsing:

```text
@context {
  # Safe: comes from your environment
  apiKey: ${API_KEY}
  environment: ${NODE_ENV:-development}
}
```

### Template Variables

Template variables come from parent stacks or passed parameters:

```promptscript
# Values come from whoever instantiates the template
@inherit @stacks/app(projectName: "my-app")
```

## Security Best Practices

### 1. Validate Parameter Inputs

When creating templates, use specific types:

```promptscript
@meta {
  params: {
    # Good: constrained types
    mode: enum("development", "production")
    port: number
    strict: boolean

    # Acceptable: string when flexible input needed
    projectName: string
  }
}
```

### 2. Don't Include Secrets in Templates

Never put secrets in template parameters or content:

```promptscript
# ❌ Bad: secrets in parameters
@inherit ./api(apiKey: "sk-secret-key-here")

# ✅ Good: use environment variables for secrets
@context {
  apiKey: ${API_KEY}
}
```

### 3. Audit Your Registry

Regularly review stacks in your registry:

```bash
# List all .prs files in registry
find ~/.promptscript/registry -name "*.prs" -exec head -20 {} \;

# Search for suspicious patterns
grep -r "ignore.*instruction\|override\|IMPORTANT:" ~/.promptscript/registry
```

### 4. Use Private Registries for Sensitive Stacks

For enterprise environments, use a private Git registry:

```yaml
# promptscript.yaml
registry:
  source:
    type: git
    url: git@github.com:your-org/private-stacks.git
    branch: main
```

### 5. Review CI/CD Pipeline Changes

When stacks are updated via CI/CD, ensure changes are reviewed:

```yaml
# .github/workflows/validate.yml
- name: Validate PromptScript
  run: prs validate --strict

- name: Diff Changes
  run: git diff HEAD~1 -- '*.prs' '**/*.prs'
```

## Comparison with Other Template Systems

| System     | Code Execution Risk  | PromptScript Equivalent |
| ---------- | -------------------- | ----------------------- |
| Handlebars | Low (no logic)       | `{{variable}}`          |
| EJS/ERB    | High (embedded code) | Not supported           |
| Jinja2     | Medium (filters)     | Not supported           |

PromptScript intentionally supports only simple variable substitution (similar to Handlebars without helpers), avoiding any code execution risk.

## Reporting Security Issues

If you discover a security vulnerability in PromptScript:

1. **Do not** open a public issue
2. Email security concerns to the maintainers
3. Include a detailed description and reproduction steps

## Summary

PromptScript's template system is secure by design:

- ✅ Values are data, never code
- ✅ Type validation prevents injection
- ✅ Output is static markdown
- ✅ No dynamic code evaluation

**Your responsibility:**

- ⚠️ Review external stacks before using
- ⚠️ Use trusted sources and pin versions
- ⚠️ Keep secrets in environment variables
- ⚠️ Audit your registry periodically
