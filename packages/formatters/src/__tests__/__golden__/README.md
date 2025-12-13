# Golden Files

This directory contains reference output files for each formatter.
These files are used to detect unintended changes in formatter output.

## Structure

```
__golden__/
├── github.md           # Expected GitHub Copilot output
├── cursor.mdc          # Expected Cursor output
├── claude.md           # Expected Claude Code output
├── antigravity.md      # Expected Antigravity output
└── README.md           # This file
```

## Updating Golden Files

When you intentionally change formatter output:

1. Run tests with `UPDATE_GOLDEN=true`:

   ```bash
   UPDATE_GOLDEN=true pnpm nx test formatters
   ```

2. Review the changes in git diff

3. Commit the updated golden files with your changes

## How It Works

1. Tests generate output from a canonical AST (same as project.prs)
2. Output is compared against golden files
3. Differences indicate either:
   - **Regression**: Unintended change (fix the formatter)
   - **Improvement**: Intentional change (update golden files)

## Canonical AST

The canonical AST used for golden file generation matches the structure
of `.promptscript/project.prs` and includes:

- `@identity` - Project description
- `@context` - Tech stack and architecture
- `@standards` - Code standards, git, config, etc.
- `@shortcuts` - Commands
- `@knowledge` - Dev commands and post-work
- `@restrictions` - Don'ts

This ensures golden files represent realistic output.
