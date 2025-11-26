---
title: Formatters API
description: "@promptscript/formatters package API reference"
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
function format(
  program: ResolvedProgram,
  options: FormatOptions
): string;
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `program` | `ResolvedProgram` | Resolved AST |
| `options` | `FormatOptions` | Formatting options |

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
    headerLevel: 2,           // Starting header level
    includeComments: true,    // Include source comments
    sectionOrder: [           // Section ordering
      'identity',
      'context',
      'standards',
      'restrictions',
      'shortcuts',
      'knowledge'
    ]
  }
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
    format: 'detailed',       // 'minimal' | 'detailed'
    includeMetadata: false,   // Include @meta info
  }
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

Outputs `.cursorrules` format.

```typescript
const output = format(resolved, {
  target: 'cursor',
  targetOptions: {
    compact: true,            // Minimize whitespace
    maxLength: 10000,         // Max output length
  }
});
```

**Output Example:**

```text
You are an expert TypeScript developer.

Standards:
- Code style: functional
- Testing: required

Commands:
/review - Review code for quality
/test - Write comprehensive tests
```

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
  }
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
  preserveNewlines: true
});
```

### formatObject

Format object to readable output:

```typescript
import { formatObject } from '@promptscript/formatters';

const formatted = formatObject(obj, {
  style: 'yaml',      // 'yaml' | 'json' | 'markdown-list'
  indent: 2,
  maxDepth: 5
});
```

### formatShortcuts

Format shortcuts block:

```typescript
import { formatShortcuts } from '@promptscript/formatters';

const formatted = formatShortcuts(shortcuts, {
  style: 'list',      // 'list' | 'table' | 'inline'
  separator: ' - '
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
`
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
    forbiddenPatterns: [/TODO/i]
  }
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
  context: 3
});

console.log(diff);
```

## Performance

Formatter performance:

| Target | 1KB Program | 10KB Program |
|--------|-------------|--------------|
| github | < 1ms | ~2ms |
| claude | < 1ms | ~2ms |
| cursor | < 1ms | ~1ms |
