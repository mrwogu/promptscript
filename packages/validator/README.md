# @promptscript/validator

AST validation rules for PromptScript files.

## Installation

```bash
pnpm add @promptscript/validator
```

## Usage

```typescript
import { Validator } from '@promptscript/validator';
import { parse } from '@promptscript/parser';

// Parse a PromptScript file
const ast = parse(source);

// Create a validator with configuration
const validator = new Validator({
  requiredGuards: ['@core/guards/compliance'],
  rules: {
    'empty-block': 'warning',
    deprecated: 'off',
  },
});

// Validate the AST
const result = validator.validate(ast);

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`${error.ruleId}: ${error.message}`);
    if (error.suggestion) {
      console.error(`  Suggestion: ${error.suggestion}`);
    }
  }
}
```

## Validation Rules

| ID    | Rule                  | Default | Description                     |
| ----- | --------------------- | ------- | ------------------------------- |
| PS001 | required-meta-id      | error   | @meta.id is required            |
| PS002 | required-meta-version | error   | @meta.version is required       |
| PS003 | valid-semver          | error   | Version must be valid semver    |
| PS004 | required-guards       | error   | Required guards must be present |
| PS005 | blocked-patterns      | error   | No prompt injection patterns    |
| PS006 | valid-path            | error   | Valid path references           |
| PS007 | deprecated            | warning | Deprecated features             |
| PS008 | empty-block           | warning | Block has no content            |

## Configuration

### Rule Severity

Override the default severity for any rule:

```typescript
const validator = new Validator({
  rules: {
    'empty-block': 'off', // Disable the rule
    deprecated: 'error', // Treat as error instead of warning
    'required-meta-id': 'info', // Treat as info instead of error
  },
});
```

### Required Guards

Specify guards that must be present in the @guards block:

```typescript
const validator = new Validator({
  requiredGuards: ['@core/guards/compliance', '@core/guards/security'],
});
```

### Blocked Patterns

Add custom patterns to detect in content (in addition to defaults):

```typescript
const validator = new Validator({
  blockedPatterns: [
    'custom-forbidden-phrase',
    /SECRET\d+/i, // Regex patterns supported
  ],
});
```

## Custom Rules

Add custom validation rules:

```typescript
import { Validator, ValidationRule } from '@promptscript/validator';

const customRule: ValidationRule = {
  id: 'PS999',
  name: 'my-custom-rule',
  description: 'Custom validation rule',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    // Access the AST via ctx.ast
    // Report issues via ctx.report()
    if (someCondition) {
      ctx.report({
        message: 'Something is wrong',
        location: ctx.ast.loc,
        suggestion: 'Fix it like this',
      });
    }
  },
};

const validator = new Validator();
validator.addRule(customRule);
```

## Walker Utilities

The package exports utilities for walking the AST:

```typescript
import { walkText, walkBlocks, walkUses, hasContent } from '@promptscript/validator';

// Walk all text content
walkText(ast, (text, location) => {
  console.log(`Found text at ${location.file}:${location.line}`);
});

// Walk all blocks
walkBlocks(ast, (block) => {
  console.log(`Found block: ${block.name || block.targetPath}`);
});

// Walk all use declarations
walkUses(ast, (use) => {
  console.log(`Found import: ${use.path.raw}`);
});

// Check if content is empty
if (!hasContent(block.content)) {
  console.log('Block is empty');
}
```

## API Reference

### Standalone Function

```typescript
import { validate } from '@promptscript/validator';

// Quick validation without creating an instance
const result = validate(ast, {
  disableRules: ['empty-block'],
  customRules: [myCustomRule],
});

if (!result.valid) {
  console.error(result.errors);
}
```

### Formatting Validation Results

```typescript
import { formatValidationMessage, formatValidationResult } from '@promptscript/validator';

// Format a single message
const formatted = formatValidationMessage(error, { color: true, showRuleId: true });
// "error[PS001]: Missing required field 'id' at project.prs:5:3"

// Format entire result
const output = formatValidationResult(result, { color: true });
```

### `Validator`

Main validator class.

- `constructor(config?: ValidatorConfig)` - Create a new validator
- `validate(ast: Program): ValidationResult` - Validate an AST
- `addRule(rule: ValidationRule): void` - Add a custom rule
- `removeRule(name: string): boolean` - Remove a rule by name
- `getConfig(): ValidatorConfig` - Get current configuration
- `getRules(): ValidationRule[]` - Get all registered rules

### `ValidatorConfig`

```typescript
interface ValidatorConfig {
  requiredGuards?: string[];
  rules?: Record<string, Severity>;
  blockedPatterns?: (string | RegExp)[];
  disableRules?: string[]; // Rules to disable completely
  customRules?: ValidationRule[]; // Custom rules to add
}
```

### `ValidationResult`

```typescript
interface ValidationResult {
  valid: boolean; // True if no errors
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  infos: ValidationMessage[];
  all: ValidationMessage[];
}
```

### `ValidationMessage`

```typescript
interface ValidationMessage {
  ruleId: string; // e.g., "PS001"
  ruleName: string; // e.g., "required-meta-id"
  severity: Severity; // "error" | "warning" | "info"
  message: string; // Human-readable message
  location?: SourceLocation;
  suggestion?: string; // Suggested fix
}
```
