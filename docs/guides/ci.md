# CI/CD Integration

PromptScript creates infrastructure-as-code for your AI prompts. Like any code, it should be validated and tested in your Continuous Integration (CI) pipeline.

## GitHub Actions

You can integrate PromptScript into your GitHub Actions workflow to ensure all `.prs` files are valid before merging.

### Manual Setup

Until the official action is published, you can use `npx` to run PromptScript in your workflow.

Create a file `.github/workflows/promptscript.yml`:

```yaml
name: PromptScript

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci
        # If PromptScript is a devDependency in your package.json

      - name: Check Syntax
        run: npx prs check

      - name: Compile and Verify
        # Ensures that compilation succeeds
        run: npx prs compile
```

## GitLab CI

Add this to your `.gitlab-ci.yml`:

```yaml
promptscript:
  image: node:20
  script:
    - npm ci
    - npx prs check
    - npx prs compile
```

## Pre-commit Hooks

To prevent invalid code from being committed, use `husky`.

1. Install dependencies:

   ```bash
   npm install --save-dev husky
   ```

2. Initialize husky:

   ```bash
   npx husky init
   ```

3. Add hook to `.husky/pre-commit`:
   ```bash
   npx prs check
   ```
