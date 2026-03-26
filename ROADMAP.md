# PromptScript Roadmap

> **Vision:** Make PromptScript the industry standard for AI context management—the Terraform of prompts.

## ✅ Recently Completed

### Reverse Parser (`prs import`)

**Goal:** Convert existing AI instructions back to PromptScript.

- [x] **`prs import` command** — Converts `.md`, `.cursorrules`, `CLAUDE.md`, `AGENTS.md` etc. to `.prs` format
- [x] **Intelligent block mapping** — Detects identity, context, standards, restrictions sections
- [x] **Multi-format support** — Handles Markdown, YAML frontmatter, plain text

### Skill System Enhancements

**Goal:** Make skills more powerful and composable.

- [x] **Parameterized skills** — Template parameters in SKILL.md frontmatter with `{{variable}}` interpolation
- [x] **Skill folders with shared resources** — `.promptscript/shared/` directory for cross-skill resources with `@shared/` prefix
- [x] **Skill dependencies** — `requires` field for declaring skill dependencies, PS016 validation (circular dep detection)
- [x] **Skill contracts** — `inputs`/`outputs` typed fields (`string`, `number`, `boolean`, `enum`), PS017 validation

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

### Parameterized Inheritance

**Goal:** Enable reusable, configurable rule templates through parameterized inheritance.

- [x] **Basic parameters** — `(key: value)` syntax, string interpolation `{{var}}` in `@inherit`, `@use`, and `@skills`
- [x] **Type validation** — Validate param types at compile time (PS009 for `@params`, PS015 for `@skills`)

### 37 AI Agent Formatters

**Goal:** Support all major AI coding assistants — **done.**

GitHub Copilot, Claude Code, Cursor, Google Antigravity, Factory AI, OpenCode, Gemini CLI, Windsurf, Cline, Roo Code, Codex, Continue, Augment, Goose, Kilo Code, Amp, Trae, Junie, Kiro CLI, Cortex, Crush, Command Code, Kode, MCPJam, Mistral Vibe, Mux, OpenHands, Pi, Qoder, Qwen Code, Zencoder, Neovate, Pochi, AdaL, iFlow, OpenClaw, CodeBuddy.

### Remote Git Registry

**Goal:** Share configs via Git repositories.

- [x] Git repository as registry (public and private)
- [x] Registry aliases with three-level merge (system > user > project)
- [x] Go-style URL imports (`@use github.com/org/repo/@path`)
- [x] Lockfile (`promptscript.lock`) for reproducible builds
- [x] Vendor mode (`prs vendor sync/check`) for offline/air-gapped CI
- [x] Auto-discovery of SKILL.md, agents, commands from repos without .prs files
- [x] Private repo auth via SSH keys and GITHUB_TOKEN

### Docker & CI/CD

- [x] **Docker container** — Pre-built image with PromptScript CLI ([Docker guide](docs/guides/docker.md))
- [x] **`prs upgrade`** — Update syntax version with automatic migrations
- [x] **`prs migrate`** — Convert existing `.md`, `.cursorrules`, `CLAUDE.md` to PromptScript

---

## 🎯 Current Focus

### Parameterized Inheritance — Advanced Features

**Goal:** Complete the template system with conditionals and loops.

- [ ] **Conditionals** — `{{#if}}` / `{{#unless}}` blocks for conditional sections
- [ ] **Loops** — `{{#each items}}` for dynamic lists

### VS Code Extension

See [VS Code Extension under Future](#5-vs-code-extension) for the full plan.

---

## 🔜 Next Up — Foundation & Ecosystem

### 1. CI/CD Integration

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

### 2. Developer Experience

**Goal:** Improve internal development velocity and quality safeguards.

- [ ] **Watch mode improvements**
  - Incremental compilation (only changed files)
  - Live reload in editors

- [ ] **Better error messages**
  - Actionable suggestions for common errors
  - Links to documentation

- [ ] **CLI enhancements**
  - `prs doctor` — Diagnose common configuration issues

---

## 🔮 Future — IDE Integration & Registry

### 3. Language Server Protocol (LSP)

**Goal:** World-class editing experience in any editor.

- [ ] **`@promptscript/language-server` package**
  - Real-time diagnostics (errors, warnings)
  - Autocomplete for directives, sections, inherited values
  - Jump-to-definition for `@inherit` and `@use` references
  - Hover documentation
  - Code actions (quick fixes)
  - Rename refactoring

### 4. VS Code Extension

**Goal:** First-class support for the most popular editor.

- [ ] **Syntax highlighting** for `.prs` files
- [ ] **Snippets** for common patterns
- [ ] **LSP integration** (bundled language server)
- [ ] **Preview pane** — See compiled output side-by-side
- [ ] **Command palette** — Compile, validate, migrate from VS Code
- [ ] **Outline view** — Navigate sections easily

### 5. Public Registry

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

### 6. Enterprise Features

**Goal:** Make PromptScript production-ready for large organizations.

- [ ] **Self-hosted HTTP registry** (Docker image, OIDC/SAML auth)

- [ ] **Policy enforcement**
  - Required sections in all projects
  - Forbidden patterns (regex blacklist)
  - Mandatory inheritance from approved bases
  - Compliance templates (SOC2, HIPAA, PCI-DSS)

- [ ] **Audit logging**
  - Track who changed what and when
  - Git-native audit trail
  - Export to SIEM systems

### 7. Security & Compliance

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

### 8. Analytics & Insights

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

### 9. Plugin System

**Goal:** Make PromptScript extensible.

- [ ] **Plugin API**
  - Custom formatters
  - Custom validators
  - Custom resolvers

- [ ] **Plugin registry**
  - `prs plugin install @community/windsurf-formatter`

- [ ] **Hooks system**
  - Pre-compile, post-compile, pre-validate

### 10. AI-Specific Features

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
  - Different outputs for Claude Sonnet 4 vs Opus 4
  - Feature flags per model version

### 11. Documentation & Community

**Goal:** Build a thriving community.

- [x] **Video walkthroughs** — [YouTube introduction](https://youtu.be/7sHMn-DbZig)
- [ ] **Interactive tutorials**
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
- [ ] **Monorepo support** — Per-package configurations with shared base

---

## 📣 How to Contribute

We're actively looking for contributors and sponsors! Here's how you can help:

1. **Build integrations** — GitHub Action, pre-commit hooks, CI templates
2. **Write documentation** — Tutorials, guides, examples
3. **Test and report** — Try PromptScript and file issues
4. **Spread the word** — Blog posts, talks, social media
5. **Sponsor development** — [GitHub Sponsors](https://github.com/sponsors/mrwogu)

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.
