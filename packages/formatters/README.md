# @promptscript/formatters

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) ecosystem - the language for standardizing AI instructions across your organization.

Output formatters for PromptScript - generates configuration files for various AI tools.

## 🏗️ Ecosystem

```
                         @promptscript/cli
                                │
                         @promptscript/compiler
                                │
       ┌────────────┬───────────┼───────────┬────────────┐
       ▼            ▼           ▼           ▼            ▼
    /parser    /resolver   /validator  ╔════════════╗
       │            │           │      ║/formatters ║
       │            │           │      ║     ⭐     ║
       │            │           │      ╚═════╤══════╝
       └────────────┴───────────┴────────────┘
                        │
                        ▼
                @promptscript/core
```

See [all packages](https://github.com/mrwogu/promptscript#packages) in the PromptScript monorepo.

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

**Supported versions:**

| Version       | Description                              |
| ------------- | ---------------------------------------- |
| `modern`      | Single file with frontmatter (default)   |
| `frontmatter` | Alias for modern                         |
| `multifile`   | Multiple files with glob-based targeting |
| `legacy`      | Plain text `.cursorrules` (deprecated)   |

```typescript
// Modern format (default)
const formatter = new CursorFormatter();
const output = formatter.format(ast);

// Multi-file format with glob targeting
const multiOutput = formatter.format(ast, { version: 'multifile' });
// Returns: additionalFiles for typescript.mdc, testing.mdc, shortcuts.mdc

// Legacy format
const legacyOutput = formatter.format(ast, { version: 'legacy' });
```

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

## Standalone Functions

Convenience functions for one-off formatting:

```typescript
import {
  format,
  getFormatter,
  registerFormatter,
  hasFormatter,
  listFormatters,
  unregisterFormatter,
} from '@promptscript/formatters';

// Format with default (GitHub)
const output = format(ast);

// Format with specific formatter
const claudeOutput = format(ast, { formatter: 'claude' });

// Get a formatter instance
const formatter = getFormatter('cursor');

// Check if formatter exists
if (hasFormatter('custom')) {
  // ...
}

// List available formatters
const names = listFormatters();
// ['github', 'claude', 'cursor', 'antigravity']

// Register a custom formatter
registerFormatter('custom', myFormatter);

// Unregister a formatter
unregisterFormatter('custom');
```

## Custom Formatters

Extend `BaseFormatter` to create custom formatters:

```typescript
import { BaseFormatter, type FormatterOutput, registerFormatter } from '@promptscript/formatters';
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

// Register for use with standalone functions
registerFormatter('my-formatter', new MyFormatter());
```

## Feature Coverage Matrix

Track which features each AI tool supports:

```typescript
import {
  FEATURE_MATRIX,
  getToolFeatures,
  toolSupportsFeature,
  getFeatureCoverage,
  generateFeatureMatrixReport,
} from '@promptscript/formatters';

// Check feature support
if (toolSupportsFeature('cursor', 'yaml-frontmatter')) {
  // Generate with frontmatter
}

// Get coverage summary
const coverage = getFeatureCoverage('cursor');
console.log(`${coverage.coveragePercent}% features supported`);

// Generate markdown report
const report = generateFeatureMatrixReport();
```

## Testing

The package includes comprehensive testing mechanisms:

### Parity Matrix

Ensures consistent output across all formatters:

```typescript
import { PARITY_MATRIX, getRequiredSections } from '@promptscript/formatters';

const sections = getRequiredSections('github');
```

### Golden Files

Reference-based testing that compares output against known-good files:

```bash
# Run tests
nx test formatters

# Update golden files after intentional changes
UPDATE_GOLDEN=true nx test formatters
```

### Running Tests

```bash
# All tests
nx test formatters

# Specific test suites
nx test formatters --testNamePattern="Parity"
nx test formatters --testNamePattern="Golden Files"
nx test formatters --testNamePattern="Feature Coverage"
```

## Building

```bash
nx build formatters
```
