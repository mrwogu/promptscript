<div align="center">
  <img src="docs/assets/logo.svg" alt="PromptScript logo" width="200" />

# PromptScript

**Agent platform configuration as code**

_Define instructions, skills, agents, MCP servers, hooks, workflows, and policies once. Compile
native configuration for 48 AI coding platforms._

[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/mrwogu/promptscript/graph/badge.svg?token=MPUCPQLVWR)](https://codecov.io/github/mrwogu/promptscript)
[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/mrwogu/promptscript/pkgs/container/promptscript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript-language)

[**Get started**](https://getpromptscript.dev/getting-started/) ·
[**Try the playground**](https://getpromptscript.dev/playground/) ·
[**Explore all features**](https://getpromptscript.dev/features/) ·
[**View target matrix**](https://getpromptscript.dev/reference/formatters/)

</div>

---

AI coding tools no longer consume one instruction file. They discover skills, specialist agents,
commands, MCP integrations, hooks, workflows, and platform-specific settings from different paths
and schemas. Managing these files by hand creates drift between tools, repositories, and teams.

PromptScript turns that surface area into one validated, composable, Git-native source:

```text
PromptScript source
    -> resolve inheritance, imports, and policies
    -> validate language and capabilities
    -> compile deterministic target-native files
```

No runtime proxy. No lowest-common-denominator output. Each formatter emits the richest native
representation its platform supports.

## Quick Start

```bash
npm install -g @promptscript/cli

prs init
# Edit .promptscript/project.prs
prs validate --strict
prs compile
```

`prs init` detects the project stack and installed AI tools, then creates a clean
`promptscript.yaml` and `.promptscript/project.prs`. Detected targets are preselected, while other
targets remain explicit choices. For automation, use `prs init --yes --targets claude factory`.
Hooks are installed by default. Use `--no-hooks` to skip hook installation or `--dry-run` to
preview all writes.

Prefer no local installation?

```bash
docker run --rm -v "$(pwd):/workspace" ghcr.io/mrwogu/promptscript:latest validate --strict
```

Or [open the playground](https://getpromptscript.dev/playground/) and compile in the browser.

## Define a Complete Agent Platform

`.promptscript/project.prs`:

```promptscript
@meta {
  id: "checkout-service"
  syntax: "1.5.0"
}

@identity {
  """
  You are working on the checkout service.
  Preserve transaction integrity and auditability.
  """
}

@standards {
  @header "Engineering Standards"
  code: ["Use strict TypeScript", "Test every business rule"]
}

@shortcuts {
  "/review": {
    prompt: true
    description: "Review current changes"
    content: "Review correctness, security, tests, and operational impact."
  }
}

@skills {
  security-review: {
    description: "Review payment changes for security risks"
    allowedTools: ["Read", "Grep", "Bash"]
    content: "Inspect authentication, authorization, secrets, and payment data handling."
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
  }
}

@agents {
  reviewer: {
    description: "Review changes before merge"
    tools: ["Read", "Grep", "Glob", "Bash"]
    skills: ["security-review"]
    mcpServers: ["issue-tracker"]
    content: "Review changed code, tests, and operational impact."
  }
}

@hooks {
  validate-changes: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "run", "typecheck"]
  }
}

@workflows {
  release: {
    description: "Prepare a validated release"
    content: "Run quality gates, summarize changes, and prepare release metadata."
  }
}

@plugins {
  engineering: {
    description: "Shared engineering capabilities"
    version: "1.0.0"
    skills: ["security-review"]
    hooks: ["validate-changes"]
    mcpServers: ["issue-tracker"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaODGoA3CIxjyxEuAE92GQrPkBGCgDYKABhOsAvmLHdpnLBBY5sKmciAm4eKCAJrqghjUMIIA7szUyhCsAOaCbIK4SYyKKupYgjr6hjAUoQAKiRV6SVjUGKxwGIwBeZkcWdSBwW1S8WpSgRgARtCDNVER7l6sPnACrFIJUnAhUdyKGFK6YQCi2Zkwupk5AMprG9Rb7hIsh7LI8gCqOuUthmUAKuY0DBrowBmgsPI6GF-vAyjAmtRgpM1HBznBttQ1LB5ABdMRLFY4NJYRgabaieYgAD0iQMMGS8lklIkEhozDIWFkLTUxiiEkOcDBEAhEDYthAACUERAGYIydREux5Tg2ll4E9WSx2P4JdL6cl5WlEl1WPA4NCdArBtCOKsLfF1rlga1uqwMFBJGROlgapEJEtCaxuHAMlAoBTQla1AMgpo6bLkszQgL4MLReKwvrE4JMOY+Mqimr4IIwGlykoY4NBANQ3BNRIPVBmMkYFJ-sxmBG3vJpQcoWEAOKJNAD+QAIQwcBweJTRp17AlAEl2sCuqMCuxDNgxaxoRgNMSBgAvHdsS1KRJYB3DXMYfP+QQbASCVXrKBXP2hQPeYMkRhoNcuiIpGUQQBivKaC0nTKLoyb8vkrSriSEqrOMzANkaJAkMMPYgKwzCHGOIAUNSWCdhG1LgXAvJwBQJAAFb1iA+JRD+yzBhg6rsKBEgJgycE7KyT5puCbp6jKcpFtkJaTDAZaJIIfDUOqmHkV2cB4X2UjEcOMCjiA0LyIOzaTMRk7TrOCGhtA3aCO8IDRrG5jxpJjIsXO-6AcBuiafZ8jUZB0EqLoVnCdqHCLlmbkqsWIwvDAtpwjeTrMC6Z7up6EDel0X5sQSv57J2yi8YIegetI2AwJo0nqn5LKsgiuphGgzCrFBFGaKixj+qyOGkoo1ASsc4xYAAPgA6rGPVziw2G4f5IBoKwaAkMRWLLIZYRBGuxTKGFgjsT4qTpGAzbJKViSwFOMDwcJgrpuJYT1PpCRJEI5Ufs+bY1jA106JhEXNb2ajiAAjmoFVBIIWRVQ6NHzSehRvnV+5OjQr2KVdMA3Up-AHNgGB5QGBUcdw5BqFkmSlZwVNmpc2R3ayD1ibuErXKqiQjLT5wMzkjAYJg0wfgEGq9RIIFs2EDguK4mE2eGfkOU5gyuQaB0SMSzAlXhn2VRwNUo2LrHCV5QH6L5eGBdVwWwdQB2BiAHi4gw-hIvgRCkOQ1Q0PQICS2w+B2E7QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`promptscript.yaml`:

```yaml
id: checkout-service
syntax: '1.5.0'

input:
  entry: .promptscript/project.prs

targets:
  - github:
      version: multifile
  - claude:
      version: full
  - cursor:
      version: full
  - opencode:
      version: full
  - gemini:
      version: full
```

`prs compile` maps supported capabilities to files each platform already understands:

```text
.github/copilot-instructions.md
.github/prompts/review.prompt.md
CLAUDE.md
.claude/agents/reviewer.md
.claude/skills/security-review/SKILL.md
.cursor/rules/project.mdc
.cursor/agents/reviewer.md
.opencode/agents/reviewer.md
```

## One Language, Complete Platform

| Capability              | PromptScript source                                               | Native result                                                                          |
| :---------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| Instructions and policy | `@identity`, `@context`, `@standards`, `@restrictions`, `@guards` | Main instructions and scoped rules                                                     |
| Portable skills         | `@skills`                                                         | `SKILL.md` directories with references, assets, scripts, and contracts                 |
| Specialist agents       | `@agents`                                                         | Native Markdown, TOML, or droid definitions with models, tools, skills, and MCP access |
| User commands           | `@shortcuts`                                                      | Native prompts, slash commands, or documented shortcuts                                |
| Tool integrations       | `@mcpServers`                                                     | Platform-specific JSON or TOML MCP configuration                                       |
| Capability bundles      | `@plugins`                                                        | Native plugin manifests where supported                                                |
| Automation              | `@hooks`, `@workflows`                                            | Lifecycle hook configuration and workflow files                                        |
| Monorepo delivery       | `builds` in `promptscript.yaml`                                   | Scoped output for packages, applications, and plugins                                  |

Target support stays explicit. Unsupported platform-specific capabilities are omitted rather than
approximated with incompatible configuration.

## Compose Instead of Copying

Build organization, team, and project layers with deterministic merge rules:

```promptscript
@inherit @company/platform
@use @team/backend
@use github.com/acme/agent-skills/database-review@1.3.0

@override standards.testing {
  ["Use Vitest", "Require 95% coverage"]
}

@extend standards {
  testing: ["Run integration tests in CI"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAhFY4Y1CFgEsyGVgE8A9OWxhm1Er158AFNRgBzCHCzVZvALS8AJoYwAjWJd4rqvJbL3VmAV1aWAlAA6rHz8XnAwAhyk8rYYjADWnI6avDr6hsamFtZwdg5Oqq5QGO6ePv5BoeG8BrhethRS8nEkMM16nFhmcPHQUHDylth2GOFmugBuEDAA7vwAjBQAzBQADEGVzBOiYpYRRjJD1JZwFBxGQnq8wEEayAEgAKrVAGri8FgPdLwPAEowAEcvBBdLwAJwAVgApLwWNtqBgOg8ALpBAC+G1Y-CIHF8vAOvgwxzg11uvHOWEuiF49xAvx8vCEHA82AgbHJHxJQl4AGEAJIo9EgNHIhidEz4IikcgwKi0EAMeFwNmsfDzYVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

- `@inherit` creates a single-parent base chain.
- `@use` composes multiple local, registry, Git, or Markdown resources.
- `@extend` merges selected paths and supports skill-specific overlays.
- `@override` atomically replaces one existing block or nested value.
- `@header` customizes generated section titles without changing native schemas.
- Typed parameters turn shared stacks into reusable templates.
- Sealed properties, reference negation, and overlay drift warnings keep extension layers safe.
- `prs inspect <skill>` shows property and layer provenance.

Remote imports are pinned in `promptscript.lock` with commit and integrity data. Vendor mode mirrors
resolved dependencies into `.promptscript/vendor/` for offline and air-gapped builds.

## Portable Skills, Native Agents

PromptScript accepts inline skills, standalone Markdown skills, and complete skill directories:

```text
.promptscript/skills/security-review/
├── SKILL.md
├── references/
│   └── threat-model.md
├── scripts/
│   └── scan.sh
└── assets/
    └── report-template.md
```

Import versioned skills without copy-paste:

```promptscript
@use github.com/acme/agent-skills/security-review@^2.0.0
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQBzCLl4AjCixIB6DIxIx5wzlgC0cANbQocWQMa9qYgJ7rqMAG4QYAd24A9AEwUADO5ABfALoM11Kb4RKTkMFS0IAxWMLQQbPgAjN5AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

```bash
prs skills add github.com/acme/agent-skills/security-review@2.1.0
prs skills update
```

PromptScript validates Agent Skills metadata, resolves dependencies and resources, then emits the
native skill path for each selected platform. Agents can reference those skills and receive
target-native model, reasoning, sandbox, tool, permission, and MCP settings.

## 48 Built-In Targets

PromptScript ships 48 output targets:

- **9 rich native formatters** - Claude Code, GitHub Copilot, Cursor, Factory AI, Codex, Gemini CLI,
  OpenCode, Antigravity, and Grok
- **10 AGENTS.md targets** - Aider, Amazon Q, Warp, Zed, Jules, Devin, Kimi, Mimo, Deep Agents, and
  ForgeCode
- **29 Markdown instruction targets** - Windsurf, Cline, Roo Code, Continue, Augment, Goose, Kilo
  Code, OpenHands, Qwen Code, and more

See exact output paths and feature support in the
[formatter capability matrix](https://getpromptscript.dev/reference/formatters/).

## Built for Repositories and Organizations

- **Git-native governance** - review source and deterministic generated diffs in pull requests.
- **Private registries** - share versioned standards through local, HTTP, or Git registries with
  SSH and token-based authentication.
- **Policy engine** - enforce layer boundaries, property protection, and registry allowlists after
  resolution.
- **Reproducible builds** - lockfile hashes, version pins, vendor mode, and strict validation.
- **Safe automation** - lifecycle hook commands use arrays, while generated-file protection keeps
  agents pointed at `.prs` source.
- **Scoped monorepo builds** - compile one package with `prs build <name>` or every profile with
  `prs compile --all-builds`.
- **CI-ready output** - use `prs validate --strict --format json`, `prs compile --dry-run`, and
  `prs diff`.

## Adopt Without a Rewrite

```bash
prs import CLAUDE.md
prs migrate --static --dry-run
prs migrate --static
prs migrate --llm
```

Import existing Claude Code, GitHub Copilot, Cursor, AGENTS.md, and other instruction files. Review
the generated `.prs` source, preview output with `prs compile --dry-run`, then migrate targets at
your own pace. Migration preserves existing PromptScript configuration and source instructions;
if no candidates are detected, it changes nothing.

Targets with native skill support can also receive the bundled PromptScript language skill. This
lets compatible agents read and maintain `.prs` files from plain-language requests. Disable it
with `includePromptScriptSkill: false`.

## Tooling

- [Online playground](https://getpromptscript.dev/playground/) - edit source and inspect generated
  output in the browser
- [VS Code extension](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript-language) -
  syntax highlighting, bracket matching, folding, and file icons
- [Docker image](https://github.com/mrwogu/promptscript/pkgs/container/promptscript) - portable CLI
  for local use and CI
- `prs serve` - connect the online playground to local files
- `prs compile --watch` - recompile after editor changes
- `prs hooks install` - integrate supported AI tools and protect generated files

## Documentation

| Resource                                                                         | Description                                                 |
| :------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| [Getting Started](https://getpromptscript.dev/getting-started/)                  | First project from initialization to native output          |
| [Agent Platform](https://getpromptscript.dev/features/)                          | Skills, agents, MCP, plugins, hooks, workflows, and targets |
| [Language Reference](https://getpromptscript.dev/reference/language/)            | Complete PromptScript syntax                                |
| [CLI Reference](https://getpromptscript.dev/reference/cli/)                      | Commands and options                                        |
| [Configuration Reference](https://getpromptscript.dev/reference/config/)         | Targets, registries, builds, policies, and formatting       |
| [Upgrade 1.15 to 1.16](https://getpromptscript.dev/guides/upgrade-1-15-to-1-16/) | Syntax, block shape, and hook migration guide               |
| [Enterprise Guide](https://getpromptscript.dev/guides/enterprise/)               | Organization-wide adoption and governance                   |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and
[open issues](https://github.com/mrwogu/promptscript/issues).

PromptScript is available under the [MIT License](LICENSE).
