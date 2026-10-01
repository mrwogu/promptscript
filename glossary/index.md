# Glossary

Short definitions of the words used across this documentation. Each term links to the page
that explains it in full.

## Files and Build

### PromptScript

A language and a compiler for AI coding agent configuration. You describe instructions,
skills, agents, and tool integrations once, and the compiler writes the files each AI tool
reads. See [Getting Started](https://getpromptscript.dev/getting-started/index.md).

### `.prs` file

A PromptScript source file. A project usually keeps them in `.promptscript/`, with
`project.prs` as the entry file. One project can use many `.prs` files that import and
inherit each other. See [Multi-File Organization](https://getpromptscript.dev/guides/multi-file/index.md).

### `promptscript.yaml`

The project configuration file. It lists the entry file, the targets to compile, the
registry, validation rules, and policies. See [Configuration](https://getpromptscript.dev/reference/config/index.md).

### Block

A named section of a `.prs` file that starts with `@`, for example `@identity`,
`@standards`, `@skills`, or `@mcpServers`. Every block has a fixed shape. See
[Block Shapes](https://getpromptscript.dev/reference/block-shapes/index.md) and the [Language Reference](https://getpromptscript.dev/reference/language/index.md).

### Target

One AI tool that PromptScript compiles for, such as `claude`, `github`, `cursor`, or
`codex`. There are 50 built-in targets. See [Supported Formatters](https://getpromptscript.dev/reference/formatters/index.md).

### Formatter

The part of the compiler that writes the files for one target. It maps each block to the
native format of that tool. See [Formatter Architecture](https://getpromptscript.dev/guides/formatter-architecture/index.md).

### Target version (mode)

How much a target writes. `simple` writes the main instruction file, `multifile` adds
rules, commands, or skills, and `full` writes the richest output, including agents and
integrations where the tool supports them. See [Target Platforms](https://getpromptscript.dev/features/target-platforms/index.md).

### Compile

Turning `.prs` sources into native files with `prs compile`. The output is deterministic,
so the same source always gives the same files. See [CLI Reference](https://getpromptscript.dev/reference/cli/index.md#prs-compile).

### Validate

Checking sources with `prs validate` without writing output: syntax, block shapes,
references, policies, and the security scan. See [CLI Reference](https://getpromptscript.dev/reference/cli/index.md#prs-validate).

### Syntax version

The `syntax` field in `@meta`. It tells the compiler which language features the file
uses. `prs upgrade` moves files to the newest version. See
[Versions and Diagnostics](https://getpromptscript.dev/reference/language/versions-and-diagnostics/index.md).

### Diagnostic code

A code such as `PS005` or `PS012` on a validation message. The code identifies the rule, so
you can search for it. See [FAQ & Troubleshooting](https://getpromptscript.dev/guides/faq/index.md).

## Reuse and Composition

### Inheritance (`@inherit`)

One `.prs` file builds on another, for example a project on a team layer and the team
layer on an organization layer. A file has at most one `@inherit`. Parameters can be passed
to the parent. See [Inheritance](https://getpromptscript.dev/guides/inheritance/index.md).

### Import (`@use`)

Merges a fragment into the current file, like a mixin. A file can have many `@use`
lines, and an alias makes the fragment available to `@extend`. See
[Composition and Precedence](https://getpromptscript.dev/reference/language/composition/index.md).

### Parameters

Values a parent or fragment accepts, declared in `@meta { params: ... }` and passed as
`@inherit @stacks/react-app(projectName: "Checkout")`. See
[Inheritance](https://getpromptscript.dev/guides/inheritance/index.md).

### `@extend`

Changes an inherited or imported block in place: adds fields, appends to lists, or
replaces values. See [Merge and Replacement](https://getpromptscript.dev/reference/language/merge-and-replacement/index.md).

### `@override`

Replaces a whole existing value instead of merging into it. See
[Merge and Replacement](https://getpromptscript.dev/reference/language/merge-and-replacement/index.md).

### Overlay

A higher layer that uses `@extend` to customize something a lower layer defined, most
often a skill. See [Skill Overlays](https://getpromptscript.dev/guides/skill-overlays/index.md).

### Sealed property

A skill property that higher layers cannot override, set with `sealed`. See
[Skill Overlays](https://getpromptscript.dev/guides/skill-overlays/index.md).

### Markdown import

Using existing Markdown files, such as a `SKILL.md`, as PromptScript sources. See
[Markdown Imports](https://getpromptscript.dev/guides/markdown-imports/index.md).

## Agent Capabilities

### Instructions

The rules an AI agent follows, written in blocks such as `@identity`, `@context`,
`@standards`, and `@restrictions`. See [Agent Platform](https://getpromptscript.dev/features/index.md).

### Skill

A reusable capability package: instructions plus optional references, scripts, assets,
and input and output contracts. Targets that support skills get them as native skill files.
See [Skills and Resources](https://getpromptscript.dev/features/skills/index.md).

### Skill composition

Building a skill from other skills and shared parts instead of copying text. See
[Skill Composition](https://getpromptscript.dev/guides/skill-composition/index.md).

### Skill contract

The declared inputs and outputs of a skill. See [Skill Contracts](https://getpromptscript.dev/guides/skill-contracts/index.md).

### Agent (subagent)

A specialized assistant with its own instructions, tools, model, skills, and MCP access,
defined in `@agents`. See [Agents](https://getpromptscript.dev/features/agents/index.md).

### MCP server

A Model Context Protocol server that gives an agent extra tools, defined in `@mcpServers`
and written to each target's native MCP configuration. See
[MCP Servers and Plugins](https://getpromptscript.dev/features/integrations/index.md).

### Plugin

A bundle of skills, agents, hooks, and MCP servers that installs as one unit, defined in
`@plugins`. See [MCP Servers and Plugins](https://getpromptscript.dev/features/integrations/index.md).

### Hook

A command that runs on an AI tool event, for example after the agent edits a file. Defined
in `@hooks`. See [Hooks and Workflows](https://getpromptscript.dev/features/automation/index.md) and [AI Tool Hooks](https://getpromptscript.dev/guides/hooks/index.md).

### Workflow

A named, repeatable procedure defined in `@workflows`. See
[Hooks and Workflows](https://getpromptscript.dev/features/automation/index.md).

### Shortcut

A user command, like a slash command, defined in `@shortcuts`. See the
[Language Reference](https://getpromptscript.dev/reference/language/index.md).

### Guard

Rules in `@guards` that apply to matching files only, for example `**/*.ts`. Guards can
require other guards. See [Guard Dependencies](https://getpromptscript.dev/guides/guard-dependencies/index.md).

### Model profile

A catalog entry that maps one model name to the name each target expects. See
[Model Catalog](https://getpromptscript.dev/reference/models/index.md).

## Teams and Organization

### Registry

A shared collection of `.prs` files, usually a Git repository, that projects inherit
from. Create one with `prs registry init` and publish with `prs registry publish`. See
[Build Your Registry](https://getpromptscript.dev/guides/registry/index.md).

### Namespace

The `@name` prefix of a registry path, such as `@company/base`. See
[Build Your Registry](https://getpromptscript.dev/guides/registry/index.md).

### Lockfile (`promptscript.lock`)

Records the exact commit and hash of every remote import, so builds are reproducible.
Written by `prs lock`. See [Build Your Registry](https://getpromptscript.dev/guides/registry/index.md).

### Vendor directory

A local copy of all locked dependencies in `.promptscript/vendor/`, made by
`prs vendor sync`, for offline and air-gapped builds. See [Build Your Registry](https://getpromptscript.dev/guides/registry/index.md).

### Policy

A rule in `promptscript.yaml` that limits how layers may change each other, for example
which properties a project may override. See [Policy Engine](https://getpromptscript.dev/guides/policy-engine/index.md).

### Security scan

Part of `prs validate` that looks for prompt injection, hidden encoded payloads, and
suspicious URLs in every source and import. See [Security](https://getpromptscript.dev/guides/security/index.md).