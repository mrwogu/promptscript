# Contributing to PromptScript

First off, thank you for considering contributing to PromptScript! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Updating the Model Catalog](#updating-the-model-catalog)
- [Publishing (Maintainers Only)](#publishing-maintainers-only)
  - [Library Packages](#library-packages)
  - [Deprecation Policy](#deprecation-policy)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 22.22+
- pnpm 8+
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/mrwogu/promptscript.git
cd promptscript

# Install dependencies
pnpm install

# Verify setup
nx run-many -t test
```

### Project Structure

```
promptscript/
├── packages/
│   ├── core/           # Types, errors, utilities
│   ├── parser/         # PromptScript parser
│   ├── resolver/       # Inheritance resolution
│   ├── validator/      # Validation rules
│   ├── compiler/       # Compilation pipeline
│   ├── formatters/     # Output formatters (GitHub, Claude, Cursor, etc.)
│   ├── importer/       # Reverse-parser for importing AI instruction files
│   ├── browser-compiler/ # Browser-compatible compiler bundle
│   ├── playground/     # Web-based playground UI (private)
│   ├── server/         # Local dev server for playground (private)
│   ├── schemas/        # schema/*.json as package subpaths (private)
│   └── cli/            # CLI application
├── apps/docs/          # Docs site (Astro Starlight, reads docs/)
├── docs/               # Documentation
└── examples/           # Example projects
```

## Development Workflow

### Running CLI Locally

During development, you can run the CLI without building:

```bash
# Using pnpm script (recommended)
pnpm prs --help
pnpm prs init
pnpm prs compile

# Or directly with node
node -r @swc-node/register packages/cli/src/cli.ts --help
```

This uses `@swc-node/register` to transpile TypeScript on-the-fly, so changes are reflected immediately without rebuilding.

### Initializing PromptScript in the Repository

To use PromptScript in this repository itself:

```bash
pnpm prs init
```

This creates:

- `promptscript.config.yaml` - project configuration
- `.promptscript/project.prs` - AI instructions file

### Creating a Feature

1. Create a branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following our [coding standards](#coding-standards)

3. Write/update tests

4. Run checks:

   ```bash
   nx affected -t test
   nx affected -t lint
   nx affected -t build
   ```

5. Commit using conventional commits:
   ```bash
   git commit -m "feat(parser): add support for multiline strings"
   ```

### Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code change that neither fixes nor adds
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Scope should be the package name: `feat(parser):`, `fix(cli):`, etc.

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all checks pass
4. Fill out the PR template completely
5. Request review from maintainers

### PR Title Format

```
<type>(<scope>): <description>

Examples:
feat(parser): add support for @extend syntax
fix(cli): handle missing config file gracefully
docs(readme): update installation instructions
```

### Breaking Changes

`pnpm api:breaking` runs in CI on every pull request to `main`. It is not part of the local verify steps. It compares `packages/*/api/*.api.md` and `schema/*.json` with the merge base of your branch and `main`.

What counts as breaking:

- In an API report: a removed or changed line. `@internal` declarations and comment lines are ignored.
- In a schema: a removed property, a new required property, a narrowed type, enum or union, a changed `const`, a type added to an untyped property, or `additionalProperties` narrowed or set to `false`.
- For the schemas that only `prs` writes (`approval-report-v1`, `audit-log-v1`, `diff-v1`, `eval-comparison-v1`, `eval-import-summary-v1`, `eval-report-v1`, `release-report-v1` and `validate-report-v1`), a new required property is fine and a removed one is breaking.
- Not checked: `if`, `not`, `pattern`, min and max bounds, `propertyNames` and `dependencies`. A new `allOf` entry and a new `then` or `else` are not checked. Also not caught: a base union branch split across two head branches and a narrowing `type` added next to a union. A missing `additionalProperties` changed to `{}` is reported, even though it changes nothing.

Additions pass. Reports of private packages are listed but not enforced.

Pull requests are squash-merged. With one commit, the subject of that commit becomes the commit on `main`. With more commits, the pull request title does. A merge commit from "Update branch" counts as a commit, so after it the pull request title is the one that is checked. The commit messages go into the squash body, the pull request description is not used. So mark a breaking change with `!` in that subject, for example `feat(core)!: drop parseLegacy`. A line that starts with `BREAKING CHANGE:` in any commit message also passes the check.

To run it locally:

```bash
pnpm api:breaking
PR_TITLE='feat(core)!: drop parseLegacy' pnpm api:breaking   # with more than one commit
pnpm exec vitest run --dir scripts                           # the spec of the check
```

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` with type guards)
- Named exports only
- Explicit return types on public functions

```typescript
// ✅ Good
export function parseVersion(input: string): SemVer {
  // ...
}

// ❌ Bad
export default function (input) {
  // ...
}
```

### File Naming

- Files: `kebab-case.ts`
- Test files: `kebab-case.spec.ts`
- Interfaces: `PascalCase`

### Documentation

- TSDoc on all public exports
- Examples in documentation

````typescript
/**
 * Parses a PromptScript path reference.
 *
 * @param path - The path string (e.g., "@core/guards/compliance@1.0.0")
 * @returns Parsed path object
 * @throws {ParseError} If path format is invalid
 *
 * @example
 * ```typescript
 * const parsed = parsePath('@core/org');
 * // { namespace: 'core', segments: ['org'], version: undefined }
 * ```
 */
export function parsePath(path: string): ParsedPath {
  // ...
}
````

### API Reports

Packages with an `api-extractor.json` have a committed report in `api/<pkg>.api.md`. That is `core`, `parser`, `resolver`, `validator`, `formatters`, `compiler` and `browser-compiler`.

- `pnpm api:check` builds the package and fails if the exported API changed and the report was not updated.
- `pnpm api:update` rewrites the report. Review the diff, it is the list of exported types and functions.
- A type used by an exported declaration must be exported too. A missing export fails the check.
- Do not edit the report by hand and do not format it.

### Package Checks

`pnpm package:check` first checks the release wiring of the library packages (see [Library Packages](#library-packages)), then packs `core`, `parser`, `resolver`, `validator`, `formatters`, `compiler` and `browser-compiler` the way a registry would ship them. It also packs `schemas`, runs publint on it and imports every exported JSON file. Nothing is published and the packages stay private.

- It builds the packages, packs them from a copy in a temp folder and runs publint (strict) and are-the-types-wrong (`--profile esm-only`) on each tarball.
- It installs all tarballs into a temp project, checks the packed `package.json` files (exports, `files`, `engines`, `license`, the MIT `LICENSE` file, no test files and no declaration maps), imports every package in plain Node and compiles one tiny file with `compiler` and with `browser-compiler`.
- It bundles `browser-compiler` with esbuild for the browser platform.
- Run it on Node.js 22 or newer, the `engines` minimum of these packages. CI runs it on the Node 22 leg. The install needs network for the third-party dependencies.
- In these `package.json` files the top-level `main` points at the TypeScript source, because workspace tools such as the docs app resolve the packages that way. What ships (`main` and `exports`, and `types` for `browser-compiler`) is in `publishConfig`, which `pnpm pack` applies. A plain `npm pack` of a dist folder does not apply it.

## Testing

### Running Tests

```bash
# All tests
nx run-many -t test

# Specific package
nx test parser

# With coverage
nx test parser --coverage

# Watch mode
nx test parser --watch
```

### Testing CLI End-to-End

```bash
# Run CLI in development mode
pnpm prs init
pnpm prs validate
pnpm prs compile --dry-run
```

### Writing Tests

- Use Vitest
- Follow AAA pattern (Arrange, Act, Assert)
- > 90% coverage for library packages

```typescript
describe('parseVersion', () => {
  it('should parse valid version', () => {
    // Arrange
    const input = '1.2.3';

    // Act
    const result = parseVersion(input);

    // Assert
    expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('should throw on invalid version', () => {
    expect(() => parseVersion('invalid')).toThrow(ParseError);
  });
});
```

## Documentation

- Update README.md when adding features
- Add JSDoc comments to public APIs
- Include examples for complex functionality
- Update CHANGELOG.md following Keep a Changelog format

### Docs Site

Pages are Markdown files in `docs/`. The site in `apps/docs` (Astro
Starlight) reads them from there, the sidebar is set in
`apps/docs/astro.config.mjs`.

```bash
pnpm docs:serve   # local dev server
pnpm docs:build   # full build, fails on broken internal links
```

- Use `:::note`, `:::tip`, `:::caution` for callouts and `::::tabs` with
  `:::tab[Label]` for tabs. Relative `.md` links work as usual.
- Target pages in `docs/reference/formatters/` come from `pnpm docs:formatters`.
  Only the seven hand written pages (Claude Code, GitHub Copilot, Cursor,
  Antigravity, Factory AI, Gemini CLI, OpenCode) are edited by hand, and only
  outside the generated markers.
- Snippets with a "Try in Playground" badge (`pnpm playground:links`) also get
  a "Compile here" button that compiles them in the browser.

## Updating the Model Catalog

The built-in model profiles live in `packages/core/src/model-profiles.ts`.
Update them when a provider releases, deprecates, or retires a model.

A weekly workflow drafts the mechanical part: it reads
[OpenRouter](https://openrouter.ai)'s model list, adds new releases of
known families to `model-profiles.ts` (id, display name, listing date,
and the successor on the release each one displaces), and opens a pull
request with the checklist above the manual work: release and retirement
dates, API ids, successors across families, floating aliases, and
target-specific names. A drafted release uses its id as the API id;
OpenRouter's `canonical_slug` is its own snapshot name, so set `apiId` by
hand only when the provider page lists a different one. The pull request merges itself when every check
passes; when a floating alias moved, the catalog tests fail on purpose
until the hardcoded expectations are updated. Run it on demand
with `pnpm models:drift:apply`, or check without editing with
`pnpm models:drift`; `OPENROUTER_MODELS_URL` overrides the endpoint for
local testing.

1. Check the official sources. The provider pages give releases, API ids,
   status, and retirement dates:
   - Anthropic: [models overview](https://platform.claude.com/docs/en/about-claude/models/overview) and [model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations)
   - OpenAI: [models](https://developers.openai.com/api/docs/models) and [deprecations](https://developers.openai.com/api/docs/deprecations)
   - Google: [Gemini models](https://ai.google.dev/gemini-api/docs/models) and [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
   - xAI: [models](https://docs.x.ai/developers/models)

   The tool pages show which model names each target accepts:
   [Claude Code](https://code.claude.com/docs/en/model-config),
   [GitHub Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models),
   [Factory AI](https://docs.factory.ai/models),
   [Cursor](https://cursor.com/docs/models), and
   [Codex](https://developers.openai.com/codex/models).

2. Add a new release with the helper for its provider (`claude()`, `openai()`,
   `google()`, or `xai()`) and set its `releaseDate`. Keep profiles grouped by
   provider and family, oldest first.
3. Set `successor` on the release it replaces. A release with a successor is
   `legacy` by default. When the provider announces a retirement, set
   `status: 'deprecated'` (or `'retired'` once it is gone) and
   `retirementDate`.
4. Update the `Checked on` date in the file header.
5. Run `pnpm nx run-many -t test -p core,formatters,validator`. The core tests
   check that the catalog is consistent.
6. Regenerate the reference page with `pnpm docs:models`.
7. When a floating alias (`opus`, `sonnet`, `haiku`, or `fable`) moves to a new
   release, also:
   - search for the display name of the replaced release, such as
     `rg "Claude Sonnet 5" docs skills`, and update hand-written examples
   - run `./scripts/sync-skill.sh` if `skills/promptscript/SKILL.md` changed
   - run `pnpm docs:validate --update-outputs`, because documented compile
     outputs show resolved model names
   - run `pnpm prs compile` to refresh the agent files of this repository

If a tool expects a different model name than `docs/reference/models.md`
shows, fix its scheme in `MODEL_TARGET_SCHEMES`
(`packages/core/src/model-catalog.ts`). Until a release ships the fix, users
can set `models.profiles.<id>.targets` in `promptscript.yaml`.

## Publishing (Maintainers Only)

Releases are managed via [release-please](https://github.com/googleapis/release-please).

### Release Process

1. **Run the workflow**: Go to Actions → "Release Please" → Run workflow
2. **Review the PR**: release-please creates/updates a PR with changelog and version bump
3. **Merge the PR**: This triggers the publish to npm

### Stable Release

By default, release-please creates stable versions based on conventional commits:

- `feat:` → minor bump (0.1.0 → 0.2.0)
- `fix:` → patch bump (0.1.0 → 0.1.1)
- `feat!:` or `BREAKING CHANGE:` → major bump (0.1.0 → 1.0.0)

### Prerelease (alpha/beta)

To create a prerelease version, add a commit with `Release-As` footer:

```bash
git commit --allow-empty -m "chore: prepare alpha release

Release-As: 1.1.0-alpha.0"
git push
```

Then run the workflow - the PR will have the specified prerelease version.

### Testing Publish Locally

Before publishing, you can test the build output:

```bash
# Build all packages
pnpm nx run-many -t build

# Check what would be published
cd dist/packages/cli
pnpm pack --dry-run
```

### npm Tags

- **Stable releases** (1.0.0) → published as `latest`
- **Prereleases** (1.0.0-alpha.0) → published as `next`

Install prerelease: `npm install @promptscript/cli@next`

### Library Packages

Eight packages are wired for a future npm publish: `core`, `parser`, `resolver`, `validator`, `formatters`, `compiler`, `browser-compiler` and `schemas`. They are all `"private": true` and nothing is on npm yet.

- **Lockstep with the CLI.** They share the CLI version. One tag, one release-please PR. The manifests are listed in `extra-files` of `release-please-config.json`, so release-please bumps them with the CLI. They are also in `release.projects` in `nx.json`.
- **Breaking library API means a CLI major.** There is no separate version for a library.
- **Node.** `engines.node` is `>=22` in every library manifest.
- **Internal dependencies.** In the repo they are `workspace:*`. `pnpm library:prepare-publish` rewrites them to the exact version in `dist/packages/<lib>/package.json`. `pnpm publish` would rewrite `workspace:*` too, but the prepare step pins explicitly and checks the wiring first.
- **Checks.** `pnpm package:check` fails when a version, an `extra-files` entry, an `nx.json` project, the `nx-release-publish` target, `private` or `engines` is out of line. The CI step "Publish dry run" builds the libraries, runs `library:prepare-publish` and `nx release publish --dry-run`. Private libraries get no `nx-release-publish` target, so only the CLI runs here. `package:check` covers the libraries.

The list of libraries and the `LIBRARIES_PUBLISHED` flag live in `scripts/library-packages.mts`.

Checklist for the PR that really publishes them:

1. Remove `"private": true` from the 8 manifests.
2. Set `LIBRARIES_PUBLISHED` to `true` in `scripts/library-packages.mts`.
3. Add the `pnpm library:prepare-publish` step to `.github/workflows/publish.yml`, after the build and before `nx release publish`.
4. Rewrite the 8 package READMEs.
5. Add `docs/guides/library-usage.md`.
6. Answer issue #658.

### Deprecation Policy

- Mark the old API with a TSDoc `@deprecated` tag that names the replacement.
- Keep it for at least one minor release and at least 90 days. Both must pass before removal.
- Remove it only in a major release.
- Mention the deprecation in the changelog.

JSON schemas follow their own rules, see [Schema versioning](docs/reference/json-output.md#schema-versioning).

## Questions?

Feel free to open an issue with the `question` label.

Thank you for contributing! 🙏
