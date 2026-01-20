# @promptscript/cli

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) ecosystem - The Infrastructure-as-Code for AI Context.

Command-line interface for PromptScript. Compile, validate, and manage AI instructions at enterprise scale.

## 🏗️ Ecosystem

```text
@promptscript/cli  ⭐
│
└─► @promptscript/compiler
    │
    ├─► @promptscript/parser ────┐
    ├─► @promptscript/resolver ──┤
    ├─► @promptscript/validator ─┤
    └─► @promptscript/formatters ┘
             │
             ▼
    @promptscript/core
```

See [all packages](https://github.com/mrwogu/promptscript#packages) in the PromptScript monorepo.

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
  -n, --name <name>        Project name (auto-detected)
  -t, --team <team>        Team namespace
  --inherit <path>         Inheritance path (e.g., @company/team)
  --registry <path>        Registry path
  --targets <targets...>   Target AI tools (github, claude, cursor)
  -i, --interactive        Force interactive mode
  -y, --yes                Skip prompts, use defaults
  -f, --force              Force reinitialize even if already initialized
```

**Auto-detection:** Project name, languages, frameworks, and existing AI tool configurations.

Creates:

- `promptscript.yaml` - Configuration file
- `.promptscript/project.prs` - Main project file

### Compile

```bash
prs compile [options]

Options:
  -t, --target <target>   Specific target (github, claude, cursor)
  -a, --all               All configured targets (default)
  -w, --watch             Watch mode for continuous compilation (uses chokidar)
  -o, --output <dir>      Output directory
  --dry-run               Preview changes without writing files
  --registry <path>       Path or URL to registry
```

**Watch Mode:** Uses [chokidar](https://github.com/paulmillr/chokidar) for reliable file watching across all platforms. Automatically recompiles when `.prs` files change.

### Validate

```bash
prs validate [options]

Options:
  --strict                Treat warnings as errors
  --format <format>       Output format (text, json)
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
  --full                  Show full diff without truncation
  --no-pager              Disable pager output
```

By default, diff output is shown through a pager (`less`) for easy scrolling. Use `--no-pager` to disable this behavior. You can customize the pager via the `PAGER` environment variable.

## Configuration

Create a `promptscript.yaml` file:

```yaml
version: '1'

project:
  id: my-project
  team: frontend

inherit: '@frontend/team'

registry:
  path: './registry'
  cache: true # Enable HTTP registry caching
  auth: # Authentication for HTTP registry
    type: bearer
    token: ${REGISTRY_TOKEN} # Environment variable interpolation

input:
  entry: '.promptscript/project.prs'
  include:
    - '.promptscript/**/*.prs'
  exclude:
    - '**/*.local.prs'

output:
  dir: '.' # Output base directory
  clean: false # Clean output before compile
  targets:
    github: '.github/copilot-instructions.md'
    claude: 'CLAUDE.md'
    cursor: '.cursor/rules/project.mdc'

watch:
  debounce: 300 # Debounce time in ms
  ignored:
    - '**/node_modules/**'

targets:
  - github
  - claude
  - cursor

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
  ✓ .cursor/rules/project.mdc

Stats: 234ms (resolve: 45ms, validate: 8ms, format: 181ms)
```

### Watch Mode

```
👀 Watching for changes...

[12:34:56] File changed: .promptscript/project.prs
✔ Compilation successful (156ms)

  ✓ .github/copilot-instructions.md
  ✓ CLAUDE.md
```

### Error

```
✖ Compilation failed

  ✗ @meta.id is required
    at .promptscript/project.prs:1:1
    suggestion: Add id: "your-id" to @meta
```

## License

MIT
