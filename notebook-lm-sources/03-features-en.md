# Key PromptScript Features

## Compilation to 37 AI Tools

PromptScript compiles instructions into native prompt formats for 37 AI tools. Primary targets include GitHub Copilot, Claude Code, Factory AI, and Gemini. Additional supported tools include Cursor, OpenCode, Antigravity, Windsurf, Cline, Roo Code, Codex, Continue, Augment, Goose, Kilo Code, Amp, Trae, Junie, Kiro CLI, and many more.

The point isn't to compile to all 37 at once. You choose the tools your organization uses in the config. A typical company compiles to 2-3 tools. But if tomorrow the company decides to pilot Gemini alongside Copilot, adding a new tool is a single line in the config. PromptScript ensures Gemini gets instructions in its format and structure, optimized for its model.

## Hierarchical Inheritance

This is the answer to mindless copy-paste of instructions from project to project. PromptScript lets you build instruction hierarchies like object-oriented code.

The organization defines global standards, for example security policies and general coding conventions. Teams inherit from the organization and add their requirements, for example the backend team adds architectural patterns. Projects inherit from the team and refine the context, for example specifying details of a particular service.

A change at the organization level automatically propagates downward. No need to manually update thirty repositories.

## Parameterized Templates

Templates can accept parameters, like Infrastructure as Code. You define a template @stacks/typescript-service with parameters such as projectName, framework, and port. Each project can use this template with its own values. Templates eliminate the situation where every project has a slightly different version of the same instructions.

## Registry and Imports

PromptScript has a registry system modeled after Go modules. You import instructions from any Git repository via URL or short alias. The organization configures aliases once, for example @company points to the company standards repository. From that point, every project imports shared standards with a single line.

Lockfiles guarantee reproducible builds. Vendor mode enables offline and air-gapped builds.

## Migration from Existing Instructions

The prs init --migrate command automatically detects existing AI instructions, such as CLAUDE.md, Copilot files, or Cursor instructions, and converts them to .prs format with AI assistance. No need to start from scratch. Existing prompts are preserved and unified into a single source.

## Validation and CI/CD

PromptScript validates instructions at compile time. It catches errors, inconsistencies, and references to non-existent resources before instructions reach AI tools. The Docker image lets you validate instructions in any CI/CD pipeline, ensuring no merge goes through with invalid prompts.

## Watch Mode

Watch mode (prs compile --watch) automatically recompiles on every source file change. You edit the .prs file, and instructions for GitHub Copilot, Claude Code, Factory AI, and the rest update instantly.

## Built-in Language Skill

AI agents automatically learn PromptScript syntax via an injected SKILL.md file. The agent knows how to write and edit .prs files, helping users create instructions without having to remember the syntax.
