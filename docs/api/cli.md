---
title: CLI API
description: '@promptscript/cli package API reference'
---

# @promptscript/cli

Command-line interface for PromptScript.

## Installation

```bash
npm install -g @promptscript/cli
```

## Programmatic Usage

The CLI can also be used programmatically:

```typescript
import { run, commands } from '@promptscript/cli';

// Run CLI programmatically
await run(['compile', '--all']);

// Use individual commands
await commands.compile({
  all: true,
  target: 'github',
});
```

## Commands API

### init

Initialize a PromptScript project.

```typescript
import { init } from '@promptscript/cli';

await init({
  path: process.cwd(),
  team: 'frontend',
  template: 'default',
  force: false,
});
```

**Options:**

```typescript
interface InitOptions {
  /** Target directory */
  path?: string;

  /** Team namespace */
  team?: string;

  /** Project template */
  template?: 'default' | 'minimal' | 'enterprise';

  /** Overwrite existing files */
  force?: boolean;
}
```

### compile

Compile PromptScript files.

```typescript
import { compile } from '@promptscript/cli';

const result = await compile({
  entry: './.promptscript/project.prs',
  target: 'github',
  output: '.github/copilot-instructions.md',
  watch: false,
  dryRun: false,
});
```

**Options:**

```typescript
interface CompileCommandOptions {
  /** Entry file */
  entry?: string;

  /** Target format */
  target?: string;

  /** Compile all targets */
  all?: boolean;

  /** Output path */
  output?: string;

  /** Watch mode */
  watch?: boolean;

  /** Preview without writing */
  dryRun?: boolean;

  /** Config file path */
  config?: string;
}
```

### validate

Validate PromptScript files.

```typescript
import { validate } from '@promptscript/cli';

const result = await validate({
  files: ['./.promptscript/project.prs'],
  strict: true,
  fix: false,
  format: 'text',
});

console.log('Valid:', result.valid);
console.log('Errors:', result.errors.length);
console.log('Warnings:', result.warnings.length);
```

**Options:**

```typescript
interface ValidateCommandOptions {
  /** Files to validate */
  files?: string[];

  /** Strict mode */
  strict?: boolean;

  /** Auto-fix issues */
  fix?: boolean;

  /** Output format */
  format?: 'text' | 'json';
}
```

### diff

Show compilation diff.

```typescript
import { diff } from '@promptscript/cli';

const result = await diff({
  target: 'github',
  all: false,
  color: true,
});

console.log(result.diff);
```

**Options:**

```typescript
interface DiffCommandOptions {
  /** Target to diff */
  target?: string;

  /** Diff all targets */
  all?: boolean;

  /** Enable color output */
  color?: boolean;
}
```

## Configuration API

### loadConfig

Load configuration from file.

```typescript
import { loadConfig } from '@promptscript/cli';

const config = await loadConfig('./promptscript.yaml');
```

### resolveConfig

Resolve configuration with defaults.

```typescript
import { resolveConfig } from '@promptscript/cli';

const config = await resolveConfig({
  configPath: './custom.config.yaml',
  overrides: {
    targets: {
      github: { enabled: true },
    },
  },
});
```

### Configuration Type

```typescript
interface Config {
  input: {
    entry: string;
    include?: string[];
    exclude?: string[];
  };

  registry?: {
    path?: string;
    url?: string;
    auth?: {
      token?: string;
    };
  };

  targets: {
    [name: string]: {
      enabled: boolean;
      output: string;
      options?: Record<string, unknown>;
    };
  };

  validation?: {
    strict?: boolean;
    rules?: Record<string, string>;
  };

  watch?: {
    include?: string[];
    exclude?: string[];
    debounce?: number;
  };
}
```

## Output API

### createOutput

Create styled output.

```typescript
import { createOutput } from '@promptscript/cli';

const output = createOutput({
  color: true,
  verbose: false,
  quiet: false,
});

output.info('Processing...');
output.success('Done!');
output.warn('Warning: ...');
output.error('Error: ...');
```

### Progress

Show progress indicator.

```typescript
import { createProgress } from '@promptscript/cli';

const progress = createProgress({
  total: 10,
  label: 'Compiling',
});

for (let i = 0; i < 10; i++) {
  await doWork();
  progress.increment();
}

progress.complete();
```

### Spinner

Show loading spinner.

```typescript
import { createSpinner } from '@promptscript/cli';

const spinner = createSpinner('Loading...');
spinner.start();

await doAsyncWork();

spinner.succeed('Loaded!');
// or spinner.fail('Failed!');
```

## Plugin System

### Creating a Plugin

```typescript
import { definePlugin } from '@promptscript/cli';

const myPlugin = definePlugin({
  name: 'my-plugin',

  // Add new commands
  commands: {
    'my-command': {
      description: 'My custom command',
      options: [{ name: '--flag', description: 'A flag' }],
      action: async (options) => {
        console.log('Running my command');
      },
    },
  },

  // Hook into existing commands
  hooks: {
    beforeCompile: async (context) => {
      console.log('Before compile');
    },
    afterCompile: async (context, result) => {
      console.log('After compile');
    },
  },
});

export default myPlugin;
```

### Using Plugins

In `promptscript.yaml`:

```yaml
plugins:
  - ./plugins/my-plugin.js
  - name: '@promptscript/plugin-foo'
    options:
      key: value
```

### Plugin Hooks

| Hook             | Description                 |
| ---------------- | --------------------------- |
| `beforeInit`     | Before initialization       |
| `afterInit`      | After initialization        |
| `beforeCompile`  | Before compilation          |
| `afterCompile`   | After compilation           |
| `beforeValidate` | Before validation           |
| `afterValidate`  | After validation            |
| `beforeWatch`    | Before watch starts         |
| `onChange`       | On file change (watch mode) |

## Error Handling

### CLIError

```typescript
import { CLIError } from '@promptscript/cli';

try {
  await run(['compile', '--target', 'unknown']);
} catch (error) {
  if (error instanceof CLIError) {
    console.error('CLI Error:', error.message);
    console.error('Exit code:', error.exitCode);
  }
}
```

### Exit Codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 0    | Success                          |
| 1    | General error                    |
| 2    | Validation error (with --strict) |
| 3    | Configuration error              |
| 130  | Interrupted (Ctrl+C)             |

## Testing

### Testing Commands

```typescript
import { createTestCLI } from '@promptscript/cli/testing';

describe('compile command', () => {
  it('should compile successfully', async () => {
    const cli = createTestCLI({
      cwd: '/test/project',
      files: {
        'promptscript/project.prs': '...',
        'promptscript.yaml': '...',
      },
    });

    const result = await cli.run(['compile', '--all']);

    expect(result.exitCode).toBe(0);
    expect(result.files['.github/copilot-instructions.md']).toBeDefined();
  });
});
```

### Mocking

```typescript
import { mockConfig, mockRegistry } from '@promptscript/cli/testing';

const config = mockConfig({
  targets: {
    github: { enabled: true },
  },
});

const registry = mockRegistry({
  '@company/base': '...',
});
```
