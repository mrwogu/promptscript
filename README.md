<div align="center">
  <img src="docs/assets/logo.svg" alt="PromptScript Logo" width="200" />
  
  # PromptScript
  
  **The Infrastructure-as-Code for AI Context**

  _Standardize, Audit, and Deploy AI Instructions across your entire Engineering Organization._

[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/mrwogu/promptscript/graph/badge.svg?token=MPUCPQLVWR)](https://codecov.io/github/mrwogu/promptscript)
[![Docs](https://img.shields.io/badge/docs-mkdocs-blue)](https://mrwogu.github.io/promptscript/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Getting Started](#getting-started) · [Enterprise Benefits](#why-promptscript) · [Contributing](CONTRIBUTING.md)

</div>

---

## 📉 The Business Problem: "Prompt Drift"

Modern engineering organizations face a critical challenge: **AI Context Fragmentation**.

As you scale to 50+ repositories and deploy multiple AI tools (GitHub Copilot, Claude, Cursor), maintaining coherent AI instructions becomes impossible manually.

*   **The Scale Problem:** Updating a security policy across 100 microservices takes weeks of manual PRs.
*   **The Model Volatility:** New models (e.g., Claude 3.7 vs 3.5) require different prompting strategies. You shouldn't have to rewrite 1000 instruction files when a model upgrades.
*   **The Governance Void:** Developers use local, unvetted instructions. Junior devs miss critical security context. There is no audit trail for what constraints your AI is operating under.

Result: **Inconsistent code quality, security risks, and operational chaos.**

## 🛡️ The Solution: PromptOps

**PromptScript turns AI context into managed infrastructure.** 

It treats your prompts as code—compiled, validated, and deployed.

```mermaid
flowchart LR
    Central["Organization Standards<br/>(.prs files)"] --> Compiler
    Compiler -->|Output 1| Copilot["GitHub Copilot<br/>(XML/Markdown)"]
    Compiler -->|Output 2| Claude["Claude Code<br/>(Markdown/Frontmatter)"]
    Compiler -->|Output 3| Cursor["Cursor Rules<br/>(.mdc)"]
    Compiler -->|Audit| CI["CI/CD Compliance"]
```

## ✨ Why PromptScript?

### 1. Enterprise Governance
Enforce non-negotiable standards globally. Define policies once, apply them everywhere.
*   *Example:* "All TypeScript code must us `unknown` instead of `any`."
*   *Example:* "All SQL queries must use parameterized inputs."

### 2. Vendor Independence
Don't lock your organization's intellectual property into a specific tool's format.
*   Write logic in PromptScript (`.prs`).
*   Deploy to **Cursor** today.
*   Deploy to **Windsurf** or **GitHub Copilot** tomorrow.
*   Your context moves with you.

### 3. Hierarchical Inheritance
Structure instructions like you structure code.
*   `@company/global-security` (CISO approved)
*   `@company/backend-java` (Platform team approved)
*   `@team/checkout-service` (Project specific)

## 💻 Code Example

One source of truth that compiles to every native format you need.

**Source:** `.promptscript/project.prs`
```promptscript
@meta { id: "checkout-service", syntax: "1.0.0" }

// Inherit approved company standards
@inherit @company/backend-security
@inherit @company/typescript-standards

// Project-specific identity
@identity {
  """
  You are an expert Backend Engineer working on the Checkout Service.
  This service handles payments and utilizes a hexagonal architecture.
  """
}

// Define reusable tools/skills
@skills {
  review: {
    description: "Security-focused code review"
    content: "Check for: IDOR, SQL Injection, and PII leaks."
  }
}
```

**Run Compilation:**
```bash
prs compile
```

**Generated Outputs (Native Formats):**
*   **GitHub Copilot:** `.github/copilot-instructions.md` (Optimized XML/Markdown)
*   **Claude Code:** `CLAUDE.md` (With local memory hooks)
*   **Cursor:** `.cursor/rules/tech-stack.mdc` (With glob patterns)

👉 **[See full example with all outputs →](https://mrwogu.github.io/promptscript/#quick-example)**

## 📊 Supported Platforms

Write once, compile to native formats for the industry's leading AI tools.

| Tool | Output Path | Format Types |
| :--- | :--- | :--- |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Markdown, XML |
| **Claude Code** | `CLAUDE.md` | Markdown, XML |
| **Cursor** | `.cursor/rules/*.mdc` | MDC (Frontmatter) |
| **Google Antigravity** | `.agent/rules/*.md` | Markdown |

## 🚀 Getting Started

### For Team Leads & Architects

1.  **Install the CLI:**
    ```bash
    npm install -g @promptscript/cli
    ```

2.  **Initialize your repo:**
    ```bash
    prs init
    ```
    _Auto-detects your tech stack (React, Node, Python) and generates a tailored configuration._

3.  **Compile & Commit:**
    ```bash
    prs compile
    git add .
    git commit -m "chore: setup PromptScript infrastructure"
    ```

## 📦 Monorepo Packages

| Package | Description | Version |
| :--- | :--- | :--- |
| [@promptscript/cli](packages/cli) | Command-line compiler & tools | ![npm](https://img.shields.io/npm/v/@promptscript/cli) |
| [@promptscript/core](packages/core) | Runtime types & utilities | ![npm](https://img.shields.io/npm/v/@promptscript/core) |
| [@promptscript/parser](packages/parser) | Language parser (Chevrotain) | ![npm](https://img.shields.io/npm/v/@promptscript/parser) |
| [@promptscript/compiler](packages/compiler) | Optimization pipeline | ![npm](https://img.shields.io/npm/v/@promptscript/compiler) |

## 🗺️ Roadmap

🎯 **Current Focus: Migration & Adoption**
*   `prs migrate`: Automated CLI to convert existing `.md`, `.cursorrules`, and `CLAUDE.md` files into valid PromptScript.

🤔 **Under Consideration** _(Looking for contributors & sponsors!)_
- [ ] **Windsurf** (`.windsurfrules`) support
- [ ] **Aider** (`.aider.conf.json`) support
- [ ] **Continue** (`.continue/config.json`) support
- [ ] **Cline** (`.cline/cline_rules`) support
- [ ] **Public Registry** (`@company/standard`) for sharing rule sets
- [ ] **VS Code Extension** with syntax highlighting & auto-complete
- [ ] **CI/CD Action** for drift detection

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

<div align="center">
  <sub>Built with ❤️ for the AI-First Engineering Community</sub>
</div>
