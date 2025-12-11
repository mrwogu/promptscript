# @promptscript/formatters

Output formatters for PromptScript - generates configuration files for various AI tools.

## Overview

This package provides formatters that transform PromptScript AST into native configuration formats for different AI tools:

- **GitHub Copilot** - `.github/copilot-instructions.md`
- **Claude Code** - `CLAUDE.md`
- **Cursor** - `.cursor/rules/*.mdc`
- **Google Antigravity** - `.agent/rules/project.md`

## Installation

```bash
pnpm add @promptscript/formatters
```

## Usage

```typescript
import {
  FormatterRegistry,
  GitHubFormatter,
  ClaudeFormatter,
  CursorFormatter,
  AntigravityFormatter,
} from '@promptscript/formatters';

// Using the registry (formatters are auto-registered)
const githubFormatter = FormatterRegistry.get('github');
const output = githubFormatter.format(ast);

// Or use formatters directly
const github = new GitHubFormatter();
const claude = new ClaudeFormatter();
const cursor = new CursorFormatter();
const antigravity = new AntigravityFormatter();
```

## Available Formatters

### GitHubFormatter

Generates `.github/copilot-instructions.md` for GitHub Copilot.

### ClaudeFormatter

Generates `CLAUDE.md` for Claude Code.

### CursorFormatter

Generates `.cursor/rules/*.mdc` files for Cursor IDE.

### AntigravityFormatter

Generates `.agent/rules/project.md` for Google Gemini/Antigravity.

**Supported versions:**

| Version       | Description                        |
| ------------- | ---------------------------------- |
| `simple`      | Plain Markdown without frontmatter |
| `frontmatter` | Markdown with YAML frontmatter     |

**Activation types** (frontmatter version):

- `always` - Rule always applied (default)
- `manual` - Activated via @mention
- `model` - Model decides when to apply
- `glob` - Applied to matching files

**Character limit:** 12,000 characters per file.

**Workflow support:** Shortcuts with `steps` generate separate workflow files in `.agent/workflows/`.

```typescript
// Simple format (default)
const formatter = new AntigravityFormatter();
const output = formatter.format(ast);

// Frontmatter format with activation types
const outputWithFrontmatter = formatter.format(ast, { version: 'frontmatter' });
```

## Custom Formatters

Extend `BaseFormatter` to create custom formatters:

```typescript
import { BaseFormatter, type FormatterOutput } from '@promptscript/formatters';
import type { PromptScriptAST } from '@promptscript/core';

export class MyFormatter extends BaseFormatter {
  name = 'my-formatter';
  outputPath = 'my-output.md';

  format(ast: PromptScriptAST): FormatterOutput {
    const content = this.buildContent(ast);
    return {
      path: this.outputPath,
      content,
      format: 'markdown',
    };
  }
}
```

## Building

```bash
nx build formatters
```

## Testing

```bash
nx test formatters
```
