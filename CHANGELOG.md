# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-06

### BREAKING CHANGES

* All packages now use ES Modules. Consumers must use ESM imports.
* **compiler:** Generated files now have compact marker instead of verbose header. Existing files with legacy marker still recognized.

### Features

#### PromptScript Language

* **PromptScript Syntax 1.0.0** - A language for standardizing AI instructions across organizations
* **@meta block** - Metadata with `id` and `syntax` fields, optional `org`, `team`, `tags`
* **@inherit directive** - Single inheritance from registry namespaces or relative paths
* **@use directive** - Import fragments for composition with optional aliasing
* **@extend block** - Modify inherited blocks at any nesting level
* **Content blocks:** `@identity`, `@context`, `@standards`, `@restrictions`, `@shortcuts`, `@params`, `@guards`, `@skills`, `@local`, `@knowledge`
* **Value types:** Strings, numbers, booleans, null, arrays, objects, multi-line text (`"""`)
* **Type expressions:** `range(min..max)`, `enum("a", "b", "c")`
* **Conventions support** - `markdown` (default) and `xml` output conventions

#### Formatters

* **GitHub Copilot** - `simple`, `multifile`, `full` versions with agents support (`.github/copilot-instructions.md`, `.github/agents/`, `.github/skills/`)
* **Claude Code** - `simple`, `multifile`, `full` versions with local memory support (`CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `CLAUDE.local.md`)
* **Cursor** - `modern`, `multifile`, `legacy` versions (`.cursor/rules/project.mdc`, `.cursorrules`)
* **Google Antigravity** - `simple`, `frontmatter` versions (`.agent/rules/project.md`)
* **formatters:** copilot agents support ([886f6fc](https://github.com/mrwogu/promptscript/commit/886f6fca9d0a7cd276997a31e62618ef0153322f))
* Path-specific rule generation with glob patterns

#### CLI

* `prs init` - Project initialization with auto-detection ([3f77d28](https://github.com/mrwogu/promptscript/commit/3f77d28c1f7644cb9c0620ab4b9f94c01d1ea243))
  * Tech stack detection (TypeScript, JavaScript, Python, Rust, Go, Java, Ruby, PHP, C#)
  * Framework detection (React, Vue, Angular, Next.js, Django, FastAPI, Express, NestJS, etc.)
  * Existing AI tools detection (GitHub Copilot, Claude Code, Cursor, Antigravity)
  * Interactive configuration wizard
  * Force init support ([5275c14](https://github.com/mrwogu/promptscript/commit/5275c14b9559f16cbc1b4aecf2f8edcf520e51ff))
  * Registry manifest support ([790ae31](https://github.com/mrwogu/promptscript/commit/790ae312bfef2cb80a74feb6ccbb334f15a3985b))
  * `--migrate` flag for AI-assisted migration ([3e567c6](https://github.com/mrwogu/promptscript/commit/3e567c606ddff779b841f76615a2aac93e35dec3))
* `prs compile` - Multi-file compilation with watch mode, dry-run, and file overwrite protection ([9213a1d](https://github.com/mrwogu/promptscript/commit/9213a1d6edecff54333c65226a2ede8ff20ae417))
* `prs validate` - File validation with detailed error reporting
* `prs diff` - Show compilation diff with pager support ([c5133f7](https://github.com/mrwogu/promptscript/commit/c5133f7a58f0f03323c8fa925387178e823d9415))
* `prs pull` - Registry updates with `--registry` flag
* **cli:** add AI-assisted migration skill and CLI integration ([53e9cca](https://github.com/mrwogu/promptscript/commit/53e9cca8669a30e787cbc2aa7679bb63f7896fce))
* **cli:** add verbose and debug logging throughout compilation pipeline ([36bd63a](https://github.com/mrwogu/promptscript/commit/36bd63a2fa1dde1acbfd0794bb174f645ef71335))
* **cli:** add Codecov bundle analysis ([b93568f](https://github.com/mrwogu/promptscript/commit/b93568f81835dd62517ff5f290687dd5ef9cb4da))
* **cli:** add chokidar watch mode ([afe30a9](https://github.com/mrwogu/promptscript/commit/afe30a93171ae2f08ea3d022b30a1356deca0627))

#### Compiler & Core

* **compiler:** compact PromptScript marker in all outputs ([6d74480](https://github.com/mrwogu/promptscript/commit/6d744800a4ab38030b6c23b2ab949c79977ab12e))
* **core:** config schema support ([2692b4d](https://github.com/mrwogu/promptscript/commit/2692b4d51e1fb20c4df35b5ce6b8264369910bcb))
* **formatting:** dynamic Prettier configuration support ([c7ceca1](https://github.com/mrwogu/promptscript/commit/c7ceca13928df3449d3ac9f16b1c4749cc48dc2f))
* **resolver:** Git registry support for remote configuration sharing ([555e488](https://github.com/mrwogu/promptscript/commit/555e4883c26b45661965d5994cbaf7f43b928d26))
* **validator:** security rules for supply chain injection detection ([5802a2f](https://github.com/mrwogu/promptscript/commit/5802a2f7d258fd6577d30d76d9ae1d1ce31ef123))

#### Documentation

* Interactive terminal demos on homepage and getting started ([b2f781b](https://github.com/mrwogu/promptscript/commit/b2f781b45d57862026e5c8ab8cb4525ccacbbd15))
* Complete language reference, CLI reference, API docs for all packages
* Getting started guide, tutorial, and multiple examples
* MkDocs documentation site with versioning support (mike)

### Bug Fixes

* **cli:** correct version detection in bundled package ([28c15a2](https://github.com/mrwogu/promptscript/commit/28c15a2622c92e99051854868a45825cbedf80cc))
* **cli:** use universal migration hint instead of Claude Code specific ([ff2e731](https://github.com/mrwogu/promptscript/commit/ff2e731371840b95ed2378755ff431399903c3c2))
* **cli:** skip writing unchanged files during compilation ([8542512](https://github.com/mrwogu/promptscript/commit/854251214d927dd5f5dea0aea04a65e0f96819a2))
* **cli:** extend marker detection from 10 to 20 lines ([229e9bc](https://github.com/mrwogu/promptscript/commit/229e9bc5bf4d0441c9674e6483a5125347b6f0b8))
* **cli:** resolve ESM dynamic require error for simple-git ([748a401](https://github.com/mrwogu/promptscript/commit/748a401377b5b58dff1935b94543f65f11f5360c))
* **cli:** change registry configuration default to No ([0927050](https://github.com/mrwogu/promptscript/commit/0927050523df7a659ea5eff47c11ae11dba976a6))
* **formatters:** read devCommands and postWork from @knowledge block ([83a2727](https://github.com/mrwogu/promptscript/commit/83a272707bf3550142ae440f1a595657bb5704e9))

### Infrastructure

* Nx monorepo with pnpm workspaces
* TypeScript strict mode with pure ESM packages (NodeNext module resolution)
* Comprehensive test suite (Vitest)
* ESLint and Prettier with Husky pre-commit hooks
* TypeDoc for automated API documentation
* GitHub Actions CI/CD pipeline with code coverage tracking
