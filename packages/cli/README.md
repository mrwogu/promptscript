<div align="center">

# @promptscript/cli

**Agent platform configuration as code**

Define instructions, skills, agents, MCP servers, hooks, workflows, and policies once. Compile
native configuration for 48 AI coding platforms.

[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/mrwogu/promptscript/blob/main/LICENSE)

[**Get started**](https://getpromptscript.dev/getting-started/) ·
[**Documentation**](https://getpromptscript.dev/) ·
[**Playground**](https://getpromptscript.dev/playground/) ·
[**GitHub**](https://github.com/mrwogu/promptscript)

</div>

[![Watch the PromptScript introduction](https://img.youtube.com/vi/7sHMn-DbZig/maxresdefault.jpg)](https://youtu.be/7sHMn-DbZig)

AI coding platforms use different files for instructions, skills, agents, commands, MCP
integrations, hooks, and settings. PromptScript replaces hand-maintained copies with one validated,
composable, Git-native source and target-specific compilers.

```text
.promptscript/project.prs
    -> resolve inheritance, imports, and policies
    -> validate language and capabilities
    -> compile deterministic native files
```

No runtime proxy. Each selected platform keeps consuming its own native configuration.

## Install

Requires Node.js 20 or later.

```bash
npm install -g @promptscript/cli
```

Also available through pnpm or yarn:

```bash
pnpm add -g @promptscript/cli
yarn global add @promptscript/cli
```

Verify installation:

```bash
prs --version
```

## 60-Second Quick Start

```bash
prs init
# Edit .promptscript/project.prs
prs validate --strict
prs compile
```

`prs init` detects the project stack, creates `promptscript.yaml` and
`.promptscript/project.prs`, helps select targets, and installs supported AI-tool hooks by default.
Pass `--no-hooks` to skip hook installation.

Generated output can include:

```text
.github/copilot-instructions.md
.github/prompts/review.prompt.md
CLAUDE.md
.claude/agents/reviewer.md
.claude/skills/security-review/SKILL.md
.cursor/rules/project.mdc
.opencode/agents/reviewer.md
```

## Define the Platform

`.promptscript/project.prs`:

```promptscript
@meta {
  id: "checkout-service"
  syntax: "1.4.0"
}

@identity {
  """
  You are working on the checkout service.
  Preserve transaction integrity and auditability.
  """
}

@standards {
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
    inputs: {
      targetPath: {
        description: "Path to review"
        type: "string"
      }
    }
    outputs: {
      report: {
        description: "Review report"
        type: "string"
      }
      highestSeverity: {
        description: "Highest detected severity"
        type: "enum"
        options: [low, medium, high, critical]
      }
    }
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
    command: ["npm", "run", "typecheck"]
  }
}

@workflows {
  release: {
    description: "Prepare a validated release"
    content: "Run quality gates, summarize changes, and prepare release metadata."
  }
}
```

`promptscript.yaml`:

```yaml
id: checkout-service
syntax: '1.4.0'

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

Run `prs compile`. Formatters map each supported capability to native target files and omit
unsupported platform-specific features.

## What PromptScript Manages

| Capability              | Source                                                            | Result                                                                           |
| :---------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| Instructions and policy | `@identity`, `@context`, `@standards`, `@restrictions`, `@guards` | Main instructions and scoped rules                                               |
| Portable skills         | `@skills`                                                         | Native skill directories with references, assets, scripts, and contracts         |
| Specialist agents       | `@agents`                                                         | Native Markdown, TOML, or droid files with models, tools, skills, and MCP access |
| User commands           | `@shortcuts`                                                      | Native prompts, commands, or documented shortcuts                                |
| Tool integrations       | `@mcpServers`                                                     | Platform-specific MCP configuration                                              |
| Capability bundles      | `@plugins`                                                        | Native plugin manifests where supported                                          |
| Automation              | `@hooks`, `@workflows`                                            | Lifecycle hooks and repeatable workflow files                                    |
| Monorepo delivery       | `builds` in `promptscript.yaml`                                   | Scoped output for packages and applications                                      |

## 48 Built-In Targets

| Platform       | Primary and rich output                                          |
| :------------- | :--------------------------------------------------------------- |
| GitHub Copilot | `.github/copilot-instructions.md`, agents, skills, prompts       |
| Claude Code    | `CLAUDE.md`, `.claude/agents/`, `.claude/skills/<name>/SKILL.md` |
| Cursor         | `.cursor/rules/`, `.cursor/agents/`, commands, MCP and hooks     |
| Factory AI     | `AGENTS.md`, `.factory/droids/`, skills, MCP, hooks and plugins  |
| Codex          | `AGENTS.md`, `.codex/agents/*.toml`, skills and config           |
| OpenCode       | `OPENCODE.md`, agents, skills and commands                       |
| Gemini CLI     | `GEMINI.md`, commands and interoperable skills                   |
| Antigravity    | `.agent/rules/`, workflows and MCP configuration                 |
| Grok           | `AGENTS.md`, agents, skills, commands and integrations           |

PromptScript also supports 10 AGENTS.md targets and 29 Markdown instruction targets, including
Windsurf, Cline, Roo Code, Continue, Aider, Amazon Q, Warp, Zed, OpenHands, Qwen Code, Kimi, Mimo,
Deep Agents, and ForgeCode.

See the [complete target and capability matrix](https://getpromptscript.dev/reference/formatters/).

## Skills from Local Files, Registries, or Git

```promptscript
@use ./skills/security-review.md
@use @company/skills/release@^2.0.0
@use github.com/acme/agent-skills/database-review@1.3.0
```

Skill directories can bundle `SKILL.md`, references, scripts, assets, and licenses while preserving
their directory structure:

```text
security-review/
├── SKILL.md
├── references/threat-model.md
├── scripts/scan.sh
└── assets/report-template.md
```

Manage remote skills from the CLI:

```bash
prs skills add github.com/acme/agent-skills/security-review@2.1.0
prs skills list
prs skills update
prs skills remove security-review
```

Remote imports are recorded in `promptscript.lock` with commit and SHA-256 integrity data.

## Composition and Governance

```promptscript
@inherit @company/platform
@use @team/backend

@extend standards {
  testing!: ["Use Vitest", "Require 95% coverage"]
}
```

- Inherit organization, team, and project layers.
- Compose local files, Markdown skills, aliases, and direct Git imports.
- Extend selected paths with deterministic merges, explicit replacement, negation, and sealed
  properties.
- Pass typed parameters to reusable templates.
- Enforce layer boundaries, protected properties, and registry allowlists with policies.
- Inspect skill provenance with `prs inspect <skill>`.
- Build reproducibly with version pins, lockfile integrity, and vendor mode.

## Monorepo Build Profiles

Create scoped builds in `promptscript.yaml`:

```yaml
builds:
  api:
    entry: .promptscript/packages/api.prs
    output: packages/api
    targets:
      - factory
  codex-api:
    entry: .promptscript/packages/api.prs
    output: packages/api
    targets:
      - codex:
          output: AGENTS.override.md
          agentsFile: AGENTS.override.md
  web:
    entry: .promptscript/packages/web.prs
    output: packages/web
    targets:
      - cursor:
          version: full
```

```bash
prs build api
prs build codex-api
prs compile --build web
prs compile --all-builds
```

## Migrate Existing Instructions

```bash
prs import CLAUDE.md
prs import .github/copilot-instructions.md
prs migrate --static
prs migrate --llm
```

Static migration deterministically imports detected instruction files. AI-assisted migration
installs the PromptScript skill and generates a migration prompt. Existing files remain untouched
until compilation.

Preview before writing:

```bash
prs compile --dry-run
prs diff --all
```

## CLI Commands

| Command                                             | Purpose                                                  |
| :-------------------------------------------------- | :------------------------------------------------------- |
| `prs init`                                          | Detect project context and initialize PromptScript       |
| `prs compile`                                       | Compile all configured targets                           |
| `prs compile --watch`                               | Recompile when source changes                            |
| `prs build <name>`                                  | Compile one named build profile                          |
| `prs compile --all-builds`                          | Compile every named profile                              |
| `prs validate --strict`                             | Validate source, references, policies, and capabilities  |
| `prs validate --fix`                                | Upgrade outdated syntax declarations when possible       |
| `prs diff --all`                                    | Preview compiled output differences                      |
| `prs inspect <skill>`                               | Show skill layers and property provenance                |
| `prs hooks install [tool]`                          | Integrate supported AI tools and protect generated files |
| `prs skills <add\|remove\|list\|update>`            | Manage remote Markdown skills                            |
| `prs registry <init\|validate\|publish\|list\|add>` | Manage registries and aliases                            |
| `prs lock` / `prs update`                           | Pin or refresh remote dependencies                       |
| `prs vendor sync` / `prs vendor check`              | Prepare and verify offline dependencies                  |
| `prs resolve <import>`                              | Explain import resolution                                |
| `prs import <file>` / `prs migrate`                 | Adopt existing instruction files                         |
| `prs upgrade`                                       | Upgrade `.prs` syntax versions                           |
| `prs serve`                                         | Connect local files to the online playground             |

See the [complete CLI reference](https://getpromptscript.dev/reference/cli/) for every option.

## Hooks and Generated-File Protection

PromptScript has two separate automation layers:

- `@hooks` compiles portable lifecycle events to native target hook configuration.
- `prs hooks install` integrates supported AI tools, recompiles after their `.prs` edit events, and
  redirects direct edits of generated files back to PromptScript source.

Use `prs compile --watch` for changes made in a general-purpose editor.

Targets with native skill support can receive the bundled PromptScript language skill, allowing
compatible agents to work with `.prs` source. Disable it with
`includePromptScriptSkill: false`.

## Docker

```bash
docker run --rm -v "$(pwd):/workspace" ghcr.io/mrwogu/promptscript:latest compile
```

## Editor Support

Install the
[PromptScript VS Code extension](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript-language)
for syntax highlighting, bracket matching, code folding, and file icons.

## Documentation

- [Getting Started](https://getpromptscript.dev/getting-started/)
- [Agent Platform](https://getpromptscript.dev/features/)
- [Language Reference](https://getpromptscript.dev/reference/language/)
- [Configuration Reference](https://getpromptscript.dev/reference/config/)
- [Target Matrix](https://getpromptscript.dev/reference/formatters/)
- [Enterprise Guide](https://getpromptscript.dev/guides/enterprise/)
- [Playground](https://getpromptscript.dev/playground/)

## License

[MIT](https://github.com/mrwogu/promptscript/blob/main/LICENSE)
