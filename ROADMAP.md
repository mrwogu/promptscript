# PromptScript Roadmap

> **Vision:** Make PromptScript the industry standard for AI context management—the Terraform of prompts.

## ✅ Recently Completed

### Web Playground

**Goal:** Try PromptScript without installing anything.

- [x] **Browser-compatible compiler** (pure JS, no WASM needed)
- [x] **Interactive browser editor**
  - Monaco editor with PRS syntax highlighting
  - Live preview of all output formats (GitHub, Claude, Cursor, Antigravity)
  - Share via URL with config settings
  - Multi-file support with tab-based editing
- [x] **Example gallery** (10 examples from beginner to advanced)
- [x] **Config panel** for target/formatting settings

---

## 🎯 Current Focus

### Parameterized Inheritance (Variables in `@inherit` / `@use`)

**Goal:** Enable reusable, configurable rule templates through parameterized inheritance.

**Problem:** Currently, when you `@inherit` or `@use` a file, you get everything as-is. If you want variations (e.g., different project names, languages, strictness levels), you need to create multiple near-duplicate files.

**Proposed Syntax:**

```prs
# Passing parameters to inherited/used files
@inherit @stacks/typescript-lib(project: "my-app", runtime: "node20")

@use @core/security(level: "strict", auditFrequency: "weekly")
@use @core/testing(framework: "vitest", coverage: 90)
```

```prs
# Defining parameters in the template (with defaults)
@meta {
  name: "typescript-lib"
  params: {
    project: string
    runtime: string = "node18"
    strictMode?: boolean = true
  }
}

@project {
  name: {{project}}
  runtime: {{runtime}}
}

@typescript {
  {{#if strictMode}}
  strict: true
  noImplicitAny: true
  {{/if}}
}
```

**Key Design Decisions:**

| Aspect                 | Proposal                                   | Rationale                                          |
| ---------------------- | ------------------------------------------ | -------------------------------------------------- |
| Parameter syntax       | `(key: value, ...)`                        | Familiar from function calls, clean inline         |
| Variable interpolation | `{{variable}}`                             | Distinguishable from other syntax, Handlebars-like |
| Conditionals           | `{{#if var}}...{{/if}}`                    | Enables conditional sections based on params       |
| Defaults               | `param: type = defaultValue`               | Standard default value syntax                      |
| Required vs optional   | `param: type` vs `param?: type`            | TypeScript-like conventions                        |
| Type constraints       | `string`, `number`, `boolean`, `enum(...)` | Reuse existing type system                         |

**Use Cases:**

1. **Multi-team templates** — Same base with team-specific project names
2. **Language stacks** — `@stacks/backend(lang: "python")` vs `(lang: "go")`
3. **Environment configs** — `@use @core/security(env: "production")`
4. **Strictness levels** — `@use @core/quality(level: "strict" | "relaxed")`

**Implementation Phases:**

- [ ] **Phase 1: Basic parameters** — `(key: value)` syntax, string interpolation `{{var}}`
- [ ] **Phase 2: Type validation** — Validate param types at compile time
- [ ] **Phase 3: Conditionals** — `{{#if}}` / `{{#unless}}` blocks
- [ ] **Phase 4: Loops** — `{{#each items}}` for dynamic lists

---

### VS Code Extension

See [VS Code Extension under Future](#5-vs-code-extension) for the full plan.

---

## 🔜 Next Up — Foundation & Ecosystem

### 1. Platform Support Expansion

**Goal:** Support all major AI coding assistants.

| Tool               | Status  | Output Format                     | Priority |
| ------------------ | ------- | --------------------------------- | -------- |
| GitHub Copilot     | ✅ Done | `.github/copilot-instructions.md` | —        |
| Claude Code        | ✅ Done | `CLAUDE.md`                       | —        |
| Cursor             | ✅ Done | `.cursor/rules/*.mdc`             | —        |
| Google Antigravity | ✅ Done | `.agent/rules/*.md`               | —        |
| Factory AI         | ✅ Done | `AGENTS.md`                       | —        |
| OpenCode           | ✅ Done | `OPENCODE.md`                     | —        |
| Gemini CLI         | ✅ Done | `GEMINI.md`                       | —        |
| Windsurf           | ✅ Done | `.windsurf/rules/project.md`      | —        |
| Cline              | ✅ Done | `.clinerules`                     | —        |
| Roo Code           | ✅ Done | `.roorules`                       | —        |
| Codex              | ✅ Done | `AGENTS.md`                       | —        |
| Continue           | ✅ Done | `.continue/rules/project.md`      | —        |
| Augment            | ✅ Done | `.augment/rules/project.md`       | —        |
| Goose              | ✅ Done | `.goose/rules/project.md`         | —        |
| Kilo Code          | ✅ Done | `.kilocode/rules/project.md`      | —        |
| Amp                | ✅ Done | `AGENTS.md`                       | —        |
| Trae               | ✅ Done | `.trae/rules/project.md`          | —        |
| Junie              | ✅ Done | `.junie/rules/project.md`         | —        |
| Kiro CLI           | ✅ Done | `.kiro/rules/project.md`          | —        |
| Cortex             | ✅ Done | `.cortex/rules/project.md`        | —        |
| Crush              | ✅ Done | `.crush/rules/project.md`         | —        |
| Command Code       | ✅ Done | `.commandcode/rules/project.md`   | —        |
| Kode               | ✅ Done | `.kode/rules/project.md`          | —        |
| MCPJam             | ✅ Done | `.mcpjam/rules/project.md`        | —        |
| Mistral Vibe       | ✅ Done | `.vibe/rules/project.md`          | —        |
| Mux                | ✅ Done | `.mux/rules/project.md`           | —        |
| OpenHands          | ✅ Done | `.openhands/rules/project.md`     | —        |
| Pi                 | ✅ Done | `.pi/rules/project.md`            | —        |
| Qoder              | ✅ Done | `.qoder/rules/project.md`         | —        |
| Qwen Code          | ✅ Done | `.qwen/rules/project.md`          | —        |
| Zencoder           | ✅ Done | `.zencoder/rules/project.md`      | —        |
| Neovate            | ✅ Done | `.neovate/rules/project.md`       | —        |
| Pochi              | ✅ Done | `.pochi/rules/project.md`         | —        |
| AdaL               | ✅ Done | `.adal/rules/project.md`          | —        |
| iFlow              | ✅ Done | `.iflow/rules/project.md`         | —        |
| OpenClaw           | ✅ Done | `INSTRUCTIONS.md`                 | —        |
| CodeBuddy          | ✅ Done | `.codebuddy/rules/project.md`     | —        |

### 2. CI/CD Integration

**Goal:** Make it effortless to integrate PromptScript into existing workflows.

- [ ] **GitHub Action (`promptscript/action`)**
  - Reusable action for `prs validate` and `prs check`
  - Support version selection via inputs
  - Auto-comment on PRs with drift detection results
  - **Usage:** `uses: promptscript/action@v1`

- [ ] **Pre-commit hook**
  - Auto-format and validate `.prs` files on commit
  - Regenerate outputs if source changed

- [ ] **GitLab CI template**
- [ ] **Azure DevOps task**

### 3. Developer Experience

**Goal:** Improve internal development velocity and quality safeguards.

- [ ] **Watch mode improvements**
  - Incremental compilation (only changed files)
  - Live reload in editors

- [ ] **Better error messages**
  - Actionable suggestions for common errors
  - Links to documentation

- [ ] **CLI enhancements**
  - ~~`prs migrate`~~ → Shipped as `prs import` — Convert existing `.md`, `.cursorrules`, `CLAUDE.md` to PromptScript
  - `prs doctor` — Diagnose common configuration issues
  - `prs upgrade` — Update syntax version with automatic migrations

---

## 🔮 Future — IDE Integration & Registry

### 4. Language Server Protocol (LSP)

**Goal:** World-class editing experience in any editor.

- [ ] **`@promptscript/language-server` package**
  - Real-time diagnostics (errors, warnings)
  - Autocomplete for directives, sections, inherited values
  - Jump-to-definition for `@inherit` and `@use` references
  - Hover documentation
  - Code actions (quick fixes)
  - Rename refactoring

### 5. VS Code Extension

**Goal:** First-class support for the most popular editor.

- [ ] **Syntax highlighting** for `.prs` files
- [ ] **Snippets** for common patterns
- [ ] **LSP integration** (bundled language server)
- [ ] **Preview pane** — See compiled output side-by-side
- [ ] **Command palette** — Compile, validate, migrate from VS Code
- [ ] **Outline view** — Navigate sections easily

### 6. Public Registry

**Goal:** Enable sharing and reusing rule sets across organizations.

- [ ] **Registry service** (`registry.getpromptscript.dev`)
  - Publish packages: `prs publish @myorg/typescript-standards`
  - Scoped packages: `@company/*`
  - Versioning with semver
  - README display and documentation

- [ ] **CLI integration**
  - `prs login` / `prs logout`
  - `prs publish` / `prs unpublish`
  - `prs search <query>`
  - `prs info @scope/package`

- [ ] **Curated starter packs**
  - `@promptscript/typescript-strict`
  - `@promptscript/security-basics`
  - `@promptscript/python-best-practices`
  - `@promptscript/react-patterns`

---

## 🏢 Future — Enterprise & Security

### 7. Enterprise Features

**Goal:** Make PromptScript production-ready for large organizations.

- [ ] **Remote registry support**
  - Self-hosted registry (Docker image)
  - Private package hosting
  - Authentication via OIDC/SAML

- [ ] **Policy enforcement**
  - Required sections in all projects
  - Forbidden patterns (regex blacklist)
  - Mandatory inheritance from approved bases
  - Compliance templates (SOC2, HIPAA, PCI-DSS)

- [ ] **Audit logging**
  - Track who changed what and when
  - Git-native audit trail
  - Export to SIEM systems

### 8. Security & Compliance

**Goal:** Ensure prompts don't introduce security risks.

- [ ] **`prs audit` command**
  - Scan for secrets in prompts
  - Check for injection vulnerabilities
  - Validate against security policies

- [ ] **Signed packages**
  - GPG signing for published packages
  - Verification on install
  - Trust chain for enterprise registries

- [ ] **SBOM generation**
  - Track dependencies in prompt inheritance
  - Export as CycloneDX/SPDX

### 9. Analytics & Insights

**Goal:** Understand how prompts are being used.

- [ ] **Usage metrics**
  - Compilation frequency
  - Most used inherited packages
  - Error patterns

- [ ] **Drift detection dashboard**
  - Track when compiled outputs get stale
  - Alert on configuration changes

- [ ] **A/B testing framework**
  - Compare prompt effectiveness
  - Track developer satisfaction metrics

---

## 🌐 Future — Ecosystem & Community

### 10. Plugin System

**Goal:** Make PromptScript extensible.

- [ ] **Plugin API**
  - Custom formatters
  - Custom validators
  - Custom resolvers

- [ ] **Plugin registry**
  - `prs plugin install @community/windsurf-formatter`

- [ ] **Hooks system**
  - Pre-compile, post-compile, pre-validate

### 11. AI-Specific Features

**Goal:** Optimize prompts for different models.

- [ ] **Model-specific optimizations**
  - Auto-adjust for GPT-4 vs Claude vs Gemini
  - Token budget warnings
  - Context window management

- [ ] **Prompt testing framework**
  - Define test cases for prompts
  - Run against multiple models
  - Score effectiveness

- [ ] **Model version targeting**
  - Different outputs for Claude Sonnet 3.5 vs Sonnet 4
  - Feature flags per model version

### 12. Documentation & Community

**Goal:** Build a thriving community.

- [ ] **Interactive tutorials**
- [ ] **Video walkthroughs**
- [ ] **Migration guides** for each tool
- [ ] **Enterprise case studies**
- [ ] **Discord community**
- [ ] **Contribution bounty program**

---

## 🤔 Under Consideration

_These features are being evaluated based on community interest. Vote with 👍 on GitHub issues!_

- [ ] **Multi-language support** — Prompts in different human languages
- [ ] **Real-time collaboration** — Google Docs-style editing
- [ ] **GitHub App** — Auto-create PRs when standards change
- [ ] **Slack/Teams integration** — Notifications and approvals
- [ ] **JetBrains plugin** — Full IDE integration
- [ ] **Neovim plugin** — LSP + Treesitter support
- [ ] **AI-powered migration** — Use LLMs to convert legacy prompts
- [ ] **Prompt linting rules** — ESLint-style configurable rules
- [ ] **Template inheritance** — Mustache/Handlebars in prompts
- [ ] **Conditional compilation** — `@if env.production` blocks
- [ ] **Monorepo support** — Per-package configurations with shared base
- [ ] **Import from URL** — `@inherit https://example.com/rules.prs`
- [x] **Docker container** — Pre-built image with PromptScript CLI (see [Docker guide](docs/guides/docker.md))

---

## 📣 How to Contribute

We're actively looking for contributors and sponsors! Here's how you can help:

1. **Add a formatter** — Pick a tool from the "Planned" list and implement it
2. **Write documentation** — Tutorials, guides, examples
3. **Test and report** — Try PromptScript and file issues
4. **Spread the word** — Blog posts, talks, social media
5. **Sponsor development** — [GitHub Sponsors](https://github.com/sponsors/mrwogu)

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.
