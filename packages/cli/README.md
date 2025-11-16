# @promptscript/cli

Command-line interface for PromptScript - standardize AI instructions across enterprise organizations.

## Installation

```bash
npm install -g @promptscript/cli
# or
pnpm add -g @promptscript/cli
```

## Commands

### Initialize Project

```bash
prs init [options]

Options:
  -t, --team <team>       Team namespace
  --template <template>   Project template
```

Creates:

- `promptscript.config.yaml` - Configuration file
- `promptscript/project.prs` - Main project file

### Compile

```bash
prs compile [options]

Options:
  -t, --target <target>   Specific target (github, claude, cursor)
  -a, --all               All configured targets (default)
  -w, --watch             Watch mode for continuous compilation
  -o, --output <dir>      Output directory
  --dry-run               Preview changes without writing files
```

### Validate

```bash
prs validate [options]

Options:
  --strict                Treat warnings as errors
  --fix                   Auto-fix issues (future)
```

### Pull Updates

```bash
prs pull [options]

Options:
  -f, --force             Force overwrite local files
```

### Show Diff

```bash
prs diff [options]

Options:
  -t, --target <target>   Specific target to diff
```

## Configuration

Create a `promptscript.config.yaml` file:

```yaml
version: '1'

project:
  id: my-project
  team: frontend

inherit: '@frontend/team'

registry:
  path: './registry'

targets:
  - github
  - claude
  - cursor

output:
  github: '.github/copilot-instructions.md'
  claude: 'CLAUDE.md'
  cursor: '.cursorrules'

validation:
  requiredGuards:
    - '@core/guards/compliance'
  rules:
    empty-block: warn
```

## Output Examples

### Success

```
✔ Compilation successful

  ✓ .github/copilot-instructions.md
  ✓ CLAUDE.md
  ✓ .cursorrules

Stats: 234ms (resolve: 45ms, validate: 8ms, format: 181ms)
```

### Error

```
✖ Compilation failed

  ✗ @meta.id is required
    at promptscript/project.prs:1:1
    suggestion: Add id: "your-id" to @meta
```

## License

MIT
