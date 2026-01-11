---
title: Validator API
description: '@promptscript/validator package API reference'
---

# @promptscript/validator

Validates PromptScript AST for correctness.

## Installation

```bash
npm install @promptscript/validator
```

## Functions

### validate

Validate a PromptScript program.

```typescript
function validate(program: Program | ResolvedProgram, options?: ValidateOptions): Diagnostic[];
```

**Parameters:**

| Parameter | Type              | Description                 |
| --------- | ----------------- | --------------------------- |
| `program` | `Program`         | The AST to validate         |
| `options` | `ValidateOptions` | Optional validation options |

**Returns:** `Diagnostic[]` - Array of diagnostics (errors and warnings)

**Example:**

```typescript
import { parse } from '@promptscript/parser';
import { validate } from '@promptscript/validator';

const ast = parse(source);
const diagnostics = validate(ast);

const errors = diagnostics.filter((d) => d.severity === 'error');
const warnings = diagnostics.filter((d) => d.severity === 'warning');

if (errors.length > 0) {
  console.error('Validation failed:', errors);
}
```

### createValidator

Create a validator with custom rules.

```typescript
function createValidator(options: ValidatorOptions): Validator;

interface Validator {
  validate(program: Program): Diagnostic[];
  addRule(rule: ValidationRule): void;
  removeRule(name: string): void;
}
```

## Options

### ValidateOptions

```typescript
interface ValidateOptions {
  /** Enable strict mode */
  strict?: boolean;

  /** Rule severity overrides */
  rules?: Record<string, RuleSeverity>;

  /** Rules to disable */
  disableRules?: string[];

  /** Custom rules */
  customRules?: ValidationRule[];
}
```

### ValidatorOptions

```typescript
interface ValidatorOptions {
  /** Built-in rules to include */
  builtInRules?: boolean;

  /** Custom rules */
  rules?: ValidationRule[];

  /** Default severity for custom rules */
  defaultSeverity?: 'error' | 'warning' | 'info';
}
```

## Diagnostic

### Diagnostic Interface

```typescript
interface Diagnostic {
  /** Severity level */
  severity: 'error' | 'warning' | 'info';

  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Source location */
  location: SourceLocation;

  /** Fix suggestions */
  suggestions?: string[];

  /** Related diagnostics */
  relatedInformation?: RelatedInformation[];
}

interface RelatedInformation {
  location: SourceLocation;
  message: string;
}
```

### Formatting Diagnostics

```typescript
import { formatDiagnostic, formatDiagnostics } from '@promptscript/validator';

// Format single diagnostic
const formatted = formatDiagnostic(diagnostic);
// "error[PS001]: Missing required field 'id' in @meta block (line 2, col 3)"

// Format all diagnostics
const output = formatDiagnostics(diagnostics, {
  color: true,
  showSource: true,
});
```

## Built-in Rules

### Required Rules

| Code    | Description                     |
| ------- | ------------------------------- |
| `PS001` | Missing required @meta block    |
| `PS002` | Missing required field in @meta |
| `PS003` | Invalid syntax version format   |
| `PS004` | Duplicate block definition      |

### Semantic Rules

| Code    | Description            |
| ------- | ---------------------- |
| `PS010` | Unknown block type     |
| `PS011` | Invalid property type  |
| `PS012` | Invalid path reference |
| `PS013` | Circular inheritance   |

### Style Rules (Warnings)

| Code    | Description            |
| ------- | ---------------------- |
| `PS020` | Empty block            |
| `PS021` | Unused shortcut        |
| `PS022` | Missing identity block |
| `PS023` | Overly deep nesting    |

### Best Practice Rules

| Code    | Description                  |
| ------- | ---------------------------- |
| `PS030` | Missing description in @meta |
| `PS031` | Too many shortcuts           |
| `PS032` | Very long text content       |

## Custom Rules

### Creating a Rule

```typescript
import { createRule } from '@promptscript/validator';

const noTodoComments = createRule({
  name: 'no-todo-comments',
  severity: 'warning',
  message: 'TODO comments should be resolved',

  validate(program, context) {
    const diagnostics: Diagnostic[] = [];

    // Check all text content for TODO
    visit(program, {
      TextValue: (node) => {
        if (node.content.includes('TODO')) {
          diagnostics.push(context.createDiagnostic('TODO comment found', node.location));
        }
      },
    });

    return diagnostics;
  },
});
```

### Rule Interface

```typescript
interface ValidationRule {
  /** Unique rule name */
  name: string;

  /** Default severity */
  severity: 'error' | 'warning' | 'info';

  /** Rule description */
  description?: string;

  /** Validate function */
  validate(program: Program, context: RuleContext): Diagnostic[];
}

interface RuleContext {
  /** Create a diagnostic */
  createDiagnostic(message: string, location: SourceLocation): Diagnostic;

  /** Get rule severity (may be overridden) */
  getSeverity(): RuleSeverity;

  /** Report multiple diagnostics */
  report(diagnostics: Diagnostic[]): void;
}
```

### Using Custom Rules

```typescript
import { validate, Validator } from '@promptscript/validator';

// Via standalone function
const diagnostics = validate(ast, {
  customRules: [noTodoComments, otherRule],
});

// Via Validator instance
const validator = new Validator({
  customRules: [noTodoComments],
});
validator.addRule(otherRule);

// Remove a rule
validator.removeRule('no-todo-comments');
```

### Formatting Validation Output

```typescript
import { formatValidationMessage, formatValidationResult } from '@promptscript/validator';

// Format single message with color and rule ID
const formatted = formatValidationMessage(error, {
  color: true,
  showRuleId: true,
});
// "error[PS001]: Missing required field 'id' at project.prs:5:3"

// Format entire validation result
const output = formatValidationResult(result, { color: true });
```

### Rule Sets

```typescript
import { createRuleSet } from '@promptscript/validator';

const strictRules = createRuleSet({
  name: 'strict',
  rules: ['no-empty-blocks', 'require-identity', 'require-restrictions'],
  severity: 'error',
});

const diagnostics = validate(ast, {
  customRules: strictRules,
});
```

## Auto-fixing

### Getting Fix Suggestions

```typescript
const diagnostics = validate(ast);

for (const diagnostic of diagnostics) {
  if (diagnostic.suggestions) {
    console.log('Possible fixes:');
    for (const suggestion of diagnostic.suggestions) {
      console.log(`  - ${suggestion}`);
    }
  }
}
```

### Applying Fixes

```typescript
import { applyFixes } from '@promptscript/validator';

const fixed = applyFixes(source, diagnostics);
```

## Strict Mode

Strict mode treats warnings as errors:

```typescript
const diagnostics = validate(ast, { strict: true });

// All warnings become errors
const hasErrors = diagnostics.some((d) => d.severity === 'error');
```

## Rule Configuration

### Disabling Rules

```typescript
const diagnostics = validate(ast, {
  disableRules: ['PS022', 'PS023'],
});
```

### Using ValidatorConfig

```typescript
const validator = new Validator({
  requiredGuards: ['@core/guards/compliance'],
  rules: {
    'empty-block': 'warning',
    deprecated: 'off',
  },
  disableRules: ['PS022'],
  customRules: [myCustomRule],
});
```

### Changing Severity

```typescript
const diagnostics = validate(ast, {
  rules: {
    PS020: 'error', // Upgrade warning to error
    PS001: 'warning', // Downgrade error to warning
    PS030: 'off', // Disable rule
  },
});
```

### Inline Comments

Disable rules inline (in source):

```promptscript
# promptscript-disable-next-line PS022
@standards {
  # Empty is intentional
}
```

## Performance

The validator is optimized for large files:

- Single-pass validation
- Early exit on critical errors
- Lazy rule evaluation

Typical performance:

| File Size | Validate Time |
| --------- | ------------- |
| 1 KB      | < 1 ms        |
| 10 KB     | ~2 ms         |
| 100 KB    | ~15 ms        |
