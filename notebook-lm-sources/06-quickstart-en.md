# Quick Start with PromptScript

## Three commands to get started

Installing and first using PromptScript takes minutes.

Step 1: Install. npm install -g @promptscript/cli

Step 2: Initialize. The prs init command automatically detects the project's tech stack (language, framework, tools) and generates a .prs file with appropriate settings.

Step 3: Compile. The prs compile command generates native configuration files for all configured AI tools.

## Installation alternatives

Docker: For CI/CD or environments without Node.js, just run docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile.

Online Playground: You can try PromptScript in the browser without installation at getpromptscript.dev/playground.

## Migration from existing files

If a project already has CLAUDE.md, .cursorrules, or copilot-instructions.md files, the prs init --migrate command automatically detects them and converts them to .prs format with AI assistance. Existing instructions are preserved and unified into a single source. No need to start from scratch.

## What's next after the first compile

Set up watch mode (prs compile --watch) for automatic recompilation on every change. Connect validation to your CI/CD pipeline. Create a team registry with shared standards. Add skills for frequently performed tasks such as code review, deployment, or test generation.

## Open Source

PromptScript is an open source project under the MIT license. Source code, documentation, and issue tracker are available on GitHub. Project website: getpromptscript.dev. Currently supports 37 AI tools with active development and regular additions of new ones.
