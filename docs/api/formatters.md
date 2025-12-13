---
title: Formatters API
description: '@promptscript/formatters package API reference'
---

# @promptscript/formatters

Output formatters for various AI tools.

## Installation

```bash
npm install @promptscript/formatters
```

## Functions

### format

Format a resolved program to a target format.

```typescript
function format(program: ResolvedProgram, options: FormatOptions): string;
```

**Parameters:**

| Parameter | Type              | Description        |
| --------- | ----------------- | ------------------ |
| `program` | `ResolvedProgram` | Resolved AST       |
| `options` | `FormatOptions`   | Formatting options |

**Returns:** `string` - Formatted output

**Example:**

```typescript
import { format } from '@promptscript/formatters';

const markdown = format(resolved, { target: 'github' });
console.log(markdown);
```

### getFormatter

Get a specific formatter.

```typescript
function getFormatter(target: string): Formatter;
```

**Example:**

```typescript
import { getFormatter } from '@promptscript/formatters';

const githubFormatter = getFormatter('github');
const output = githubFormatter.format(resolved);
```

### registerFormatter

Register a custom formatter.

```typescript
function registerFormatter(name: string, formatter: Formatter): void;
```

## Options

### FormatOptions

```typescript
interface FormatOptions {
  /** Target format */
  target: 'github' | 'claude' | 'cursor' | string;

  /** Include header comment */
  header?: boolean | string;

  /** Include timestamp */
  timestamp?: boolean;

  /** Target-specific options */
  targetOptions?: Record<string, unknown>;

  /** Output convention ('xml' | 'markdown' | custom) */
  convention?: string;

  /** Output file path */
  outputPath?: string;
}
```

## Built-in Formatters

### GitHub Copilot Formatter

Outputs `.github/copilot-instructions.md` format.

```typescript
import { format } from '@promptscript/formatters';

const output = format(resolved, {
  target: 'github',
  targetOptions: {
    headerLevel: 2, // Starting header level
    includeComments: true, // Include source comments
    sectionOrder: [
      // Section ordering
      'identity',
      'context',
      'standards',
      'restrictions',
      'shortcuts',
      'knowledge',
    ],
  },
});
```

**Output Example:**

```markdown
# AI Instructions

## Identity

You are an expert TypeScript developer.

## Standards

- Code style: functional
- Testing: required

## Shortcuts

- `/review` - Review code for quality
- `/test` - Write comprehensive tests
```

### Claude Code Formatter

Outputs `CLAUDE.md` format.

```typescript
const output = format(resolved, {
  target: 'claude',
  targetOptions: {
    format: 'detailed', // 'minimal' | 'detailed'
    includeMetadata: false, // Include @meta info
  },
});
```

**Output Example:**

```markdown
# CLAUDE.md

You are an expert TypeScript developer.

## Standards

Code style: functional
Testing: required

## Shortcuts

/review - Review code for quality
/test - Write comprehensive tests
```

### Cursor Formatter

Outputs Cursor rules in modern MDC format (`.cursor/rules/project.mdc`) or legacy format (`.cursorrules`).

**Supported Versions:**

| Version       | Output Path                 | Cursor Version | Description                              |
| ------------- | --------------------------- | -------------- | ---------------------------------------- |
| `modern`      | `.cursor/rules/project.mdc` | 0.45+          | Single file with frontmatter (default)   |
| `frontmatter` | `.cursor/rules/project.mdc` | 0.45+          | Alias for modern                         |
| `multifile`   | `.cursor/rules/*.mdc`       | 0.45+          | Multiple files with glob-based targeting |
| `legacy`      | `.cursorrules`              | < 0.45         | Deprecated                               |

```typescript
// Modern format (default, for Cursor 0.45+)
const output = format(resolved, {
  target: 'cursor',
});

// Multi-file format with glob-based targeting
const multiOutput = format(resolved, {
  target: 'cursor',
  version: 'multifile',
});

// Legacy format (for older Cursor versions)
const legacyOutput = format(resolved, {
  target: 'cursor',
  version: 'legacy',
});
```

**YAML Configuration:**

```yaml
targets:
  # Modern format (default)
  - cursor

  # Multi-file format with glob targeting
  - cursor:
      version: multifile

  # Legacy format for older Cursor installations
  - cursor:
      version: legacy
      output: .cursorrules
```

**Modern Output Example (MDC with frontmatter):**

```markdown
---
description: 'Project rules for MyApp'
alwaysApply: true
---

You are working on MyApp.

Tech stack: TypeScript, React

## Architecture

...
```

**Multi-file Output Example:**

When using `multifile` version, the formatter generates:

1. **Main file** (`.cursor/rules/project.mdc`) with `alwaysApply: true` for core rules
2. **Glob-specific files** for TypeScript, testing, etc. based on `@guards` block patterns
3. **Shortcuts file** (`.cursor/rules/shortcuts.mdc`) with `alwaysApply: false` for manual activation

```markdown
## <!-- .cursor/rules/typescript.mdc -->

description: "TypeScript-specific rules"
globs:

- "\*.ts"
- "\*.tsx"

---

Code style:

- strict: Enable strict mode
  ...
```

```markdown
## <!-- .cursor/rules/shortcuts.mdc -->

description: "Project shortcuts and commands"
alwaysApply: false

---

## Commands

- **/test**: Run tests
- **/deploy**: Deploy workflow
  ...
```

**Legacy Output Example (plain text):**

```text
You are working on MyApp.

Tech stack: TypeScript, React

Architecture:
...
```

### Antigravity Formatter

Outputs `.agent/rules/project.md` for Google Gemini/Antigravity.

**Supported Versions:**

| Version       | Output Path               | Description                        |
| ------------- | ------------------------- | ---------------------------------- |
| `simple`      | `.agent/rules/project.md` | Plain Markdown without frontmatter |
| `frontmatter` | `.agent/rules/project.md` | Markdown with YAML frontmatter     |

**Activation Types:**

| Type     | Description                             |
| -------- | --------------------------------------- |
| `always` | Rule always applied (default)           |
| `manual` | Activated via @mention                  |
| `model`  | Model decides when to apply             |
| `glob`   | Applied to matching files (from guards) |

**Character Limit:** 12,000 characters per file. A warning is emitted when content exceeds this limit.

**Workflow Support:** Shortcuts with `steps` or `workflow` properties generate separate workflow files in `.agent/workflows/`.

```typescript
// Simple format (default)
const output = format(resolved, {
  target: 'antigravity',
});

// Frontmatter format with activation types
const frontmatterOutput = format(resolved, {
  target: 'antigravity',
  version: 'frontmatter',
});
```

**YAML Configuration:**

```yaml
targets:
  # Simple format (default)
  - antigravity

  # Frontmatter format with activation
  - antigravity:
      version: frontmatter
      output: .agent/rules/project.md
```

**Simple Output Example (plain Markdown):**

```markdown
# Project Rules

> Auto-generated by PromptScript
> Source: my-project (syntax 1.0.0)

## Project Identity

You are working on MyApp.

## Code Standards

### TypeScript

- Use strict mode
- No any types
```

**Frontmatter Output Example (with activation):**

```markdown
---
title: 'My Project'
activation: 'always'
description: 'Project rules for MyApp'
---

# Project Rules

> Auto-generated by PromptScript

## Project Identity

...
```

**Workflow Output Example (.agent/workflows/deploy.md):**

```markdown
---
title: 'Deploy'
description: 'Deploy to production'
---

## Steps

1. Run all tests
2. Build production bundle
3. Deploy to staging
4. Run smoke tests
5. Deploy to production
```

## Output Conventions

Output conventions control how sections are rendered in the output. Built-in conventions include `xml` and `markdown`.

### Built-in Conventions

| Convention | Supported By           | Section Format                         | List Format    |
| ---------- | ---------------------- | -------------------------------------- | -------------- |
| `markdown` | GitHub, Claude, Cursor | `## Section Name`                      | Markdown lists |
| `xml`      | GitHub, Claude         | `<section-name>content</section-name>` | Markdown lists |

!!! warning "Cursor Convention Support"
The Cursor formatter only supports `markdown` convention. Using `xml` convention with Cursor will throw an error.

### Using Conventions

```typescript
import { format } from '@promptscript/formatters';

// Use Markdown convention (default for all targets)
const mdOutput = format(resolved, {
  target: 'github',
  convention: 'markdown',
});

// Use XML convention (GitHub and Claude only)
const xmlOutput = format(resolved, {
  target: 'github',
  convention: 'xml',
});
```

### XML Convention Output

```xml
<project>
PromptScript is a language for AI instructions.
</project>

<tech-stack>
- TypeScript 5.x
- Node.js 20+
</tech-stack>

<standards>
- Use strict mode
- No any types
</standards>
```

### Markdown Convention Output

```markdown
## Project

PromptScript is a language for AI instructions.

## Tech Stack

- TypeScript 5.x
- Node.js 20+

## Standards

- Use strict mode
- No any types
```

### ConventionRenderer

The `ConventionRenderer` class provides utilities for rendering content according to a convention:

```typescript
import { createConventionRenderer } from '@promptscript/formatters';

const renderer = createConventionRenderer('xml');

// Render a section
const section = renderer.renderSection('standards', '- Use TypeScript');

// Render a list
const list = renderer.renderList(['Item 1', 'Item 2']);

// Render a code block
const code = renderer.renderCodeBlock('const x = 1;', 'typescript');

// Wrap content in root element (for XML)
const wrapped = renderer.wrapRoot(content);
```

### Custom Conventions

Define custom conventions in your configuration:

````yaml
# promptscript.yaml
customConventions:
  my-convention:
    name: 'my-convention'
    section:
      prefix: '=== '
      suffix: ' ==='
      contentPrefix: ''
      contentSuffix: "\n"
    list:
      itemPrefix: '* '
      itemSuffix: ''
      listPrefix: ''
      listSuffix: ''
    codeBlock:
      prefix: '```'
      suffix: '```'
      languageSupport: true

targets:
  - github:
      convention: my-convention
````

## Custom Formatters

### Formatter Interface

```typescript
interface Formatter {
  /** Formatter name */
  name: string;

  /** File extension */
  extension: string;

  /** Default output path */
  defaultOutput: string;

  /** Default output convention */
  defaultConvention: 'xml' | 'markdown';

  /** Format the program */
  format(program: ResolvedProgram, options?: Record<string, unknown>): string;

  /** Validate options */
  validateOptions?(options: Record<string, unknown>): void;
}
```

### Creating a Custom Formatter

```typescript
import { registerFormatter, createFormatter } from '@promptscript/formatters';

const xmlFormatter = createFormatter({
  name: 'xml',
  extension: '.xml',
  defaultOutput: 'ai-instructions.xml',

  format(program, options) {
    let xml = '<?xml version="1.0"?>\n<instructions>\n';

    // Format identity
    if (program.blocks.identity) {
      xml += `  <identity>${escapeXml(program.blocks.identity.content)}</identity>\n`;
    }

    // Format standards
    if (program.blocks.standards) {
      xml += '  <standards>\n';
      xml += formatObject(program.blocks.standards.properties);
      xml += '  </standards>\n';
    }

    // ... more blocks

    xml += '</instructions>';
    return xml;
  },
});

registerFormatter('xml', xmlFormatter);
```

### Using Custom Formatter

```typescript
import { format } from '@promptscript/formatters';

const xml = format(resolved, { target: 'xml' });
```

## Formatter Helpers

### formatText

Format text content:

```typescript
import { formatText } from '@promptscript/formatters';

const formatted = formatText(textContent, {
  trimLines: true,
  maxLineLength: 80,
  preserveNewlines: true,
});
```

### formatObject

Format object to readable output:

```typescript
import { formatObject } from '@promptscript/formatters';

const formatted = formatObject(obj, {
  style: 'yaml', // 'yaml' | 'json' | 'markdown-list'
  indent: 2,
  maxDepth: 5,
});
```

### formatShortcuts

Format shortcuts block:

```typescript
import { formatShortcuts } from '@promptscript/formatters';

const formatted = formatShortcuts(shortcuts, {
  style: 'list', // 'list' | 'table' | 'inline'
  separator: ' - ',
});
```

## Output Templates

### Template-based Formatting

```typescript
import { createTemplateFormatter } from '@promptscript/formatters';

const customFormatter = createTemplateFormatter({
  name: 'custom',
  extension: '.md',
  template: `
# {{meta.id}}

{{#identity}}
## About
{{content}}
{{/identity}}

{{#standards}}
## Standards
{{#each properties}}
- {{key}}: {{value}}
{{/each}}
{{/standards}}

{{#shortcuts}}
## Commands
{{#each items}}
- \`{{name}}\` - {{description}}
{{/each}}
{{/shortcuts}}
`,
});
```

### Built-in Template Helpers

```typescript
// Available in templates:
{{#if block}}...{{/if}}
{{#each items}}...{{/each}}
{{#with object}}...{{/with}}
{{escape text}}
{{lowercase text}}
{{uppercase text}}
{{trim text}}
```

## Validation

### Validating Output

```typescript
import { validateOutput } from '@promptscript/formatters';

const result = validateOutput(output, {
  target: 'github',
  rules: {
    maxLength: 50000,
    requiredSections: ['identity'],
    forbiddenPatterns: [/TODO/i],
  },
});

if (!result.valid) {
  console.error('Output validation failed:', result.errors);
}
```

## Diffing

### Generating Diffs

```typescript
import { generateDiff } from '@promptscript/formatters';

const diff = generateDiff(oldOutput, newOutput, {
  color: true,
  context: 3,
});

console.log(diff);
```

## Feature Coverage Matrix

The Feature Coverage Matrix tracks which features each AI tool supports and which features our formatters implement. This helps identify gaps and ensures consistent functionality across formatters.

### Using the Matrix

```typescript
import {
  FEATURE_MATRIX,
  getToolFeatures,
  getFeatureCoverage,
  toolSupportsFeature,
  generateFeatureMatrixReport,
} from '@promptscript/formatters';

// Get all supported features for a tool
const cursorFeatures = getToolFeatures('cursor');

// Check if a specific feature is supported
const hasGlobs = toolSupportsFeature('cursor', 'glob-patterns'); // true
const hasGlobsGithub = toolSupportsFeature('github', 'glob-patterns'); // false

// Get coverage summary
const coverage = getFeatureCoverage('cursor');
console.log(`${coverage.coveragePercent}% features supported`);

// Generate markdown report
const report = generateFeatureMatrixReport();
```

### Feature Categories

| Category         | Description                          |
| ---------------- | ------------------------------------ |
| `output-format`  | Markdown, MDC, code blocks, diagrams |
| `file-structure` | Single/multi-file, workflows         |
| `metadata`       | Frontmatter, descriptions            |
| `targeting`      | Globs, activation types              |
| `content`        | Character limits, section splitting  |
| `advanced`       | Context inclusion, @-mentions        |

### Feature Status Values

| Status          | Description                         |
| --------------- | ----------------------------------- |
| `supported`     | Tool supports, formatter implements |
| `not-supported` | Tool doesn't support                |
| `planned`       | Tool supports, not yet implemented  |
| `partial`       | Partially implemented               |

### Current Feature Coverage

| Feature          | GitHub | Cursor | Claude | Antigravity |
| ---------------- | ------ | ------ | ------ | ----------- |
| Markdown Output  | Yes    | Yes    | Yes    | Yes         |
| YAML Frontmatter | No     | Yes    | No     | Yes         |
| Multi-file Rules | No     | Yes    | No     | Yes         |
| Glob Patterns    | No     | Yes    | No     | Yes         |
| Workflows        | No     | No     | No     | Yes         |
| Mermaid Diagrams | Yes    | Yes    | Yes    | Yes         |
| Character Limit  | No     | No     | No     | Yes (12k)   |

For the complete matrix, use `generateFeatureMatrixReport()` or see the [Feature Coverage Tests](../testing/feature-coverage.md).

## Performance

Formatter performance:

| Target      | 1KB Program | 10KB Program |
| ----------- | ----------- | ------------ |
| github      | < 1ms       | ~2ms         |
| claude      | < 1ms       | ~2ms         |
| cursor      | < 1ms       | ~1ms         |
| antigravity | < 1ms       | ~2ms         |
