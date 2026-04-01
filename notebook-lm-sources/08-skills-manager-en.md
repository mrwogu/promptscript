# PromptScript as an AI Skills Manager

## Skills - what they are and why they matter

Modern AI coding tools support the concept of "skills" - ready-made instructions that AI executes on user command. Claude Code has .claude/skills/, GitHub Copilot has .github/skills/, Cursor has its own format. The problem is the same as with general instructions: every tool expects a different format, in a different location.

PromptScript solves this by acting as a central skills manager. You define a skill once, and PromptScript compiles it to each tool's native format. But that's not all - PromptScript also provides a complete ecosystem for discovering, installing, updating, and sharing AI skills.

## Four ways to load skills

### 1. Git import via @use (primary method)

The main approach is importing skills directly from Git repositories. The syntax follows Go modules:

```
@use github.com/anthropics/skills/commit@1.0.0
```

You can import SKILL.md files from any public or private Git repository. PromptScript automatically detects the type of imported file - whether it's a skill with YAML frontmatter, a .prs fragment, or raw markdown for the knowledge base.

Versioning supports exact tags, semantic ranges (like @^1.0.0), and branches (like @main). A lockfile guarantees reproducible builds.

### 2. CLI for skill management (prs skills)

PromptScript has a built-in CLI for managing skills:

The prs skills add command adds a skill from a Git repository to the .prs file and updates the lockfile. For example, prs skills add github.com/anthropics/skills/commit@1.0.0 adds a @use directive to the source file and records the exact commit in the lockfile.

The prs skills remove command removes a skill from the .prs file and lockfile. It supports partial name matching.

The prs skills list command shows all installed skills.

The prs skills update command updates skills to their latest versions. You can update all at once or a specific skill by name.

### 3. Local skills (.promptscript/skills/ directory)

Skills can also be defined locally within the project, in the .promptscript/skills/ directory. Every subdirectory containing a SKILL.md file is automatically discovered and compiled. No configuration needed.

Local skills have the highest priority and override registry skills with the same name. This allows creating project-specific versions of shared skills.

### 4. Universal .agents/skills/ directory

There is also the .agents/skills/ directory, which acts as a shared directory. You can install skills into it using the npx skills tool or manually. PromptScript automatically scans this directory and includes discovered skills in compilation.

## Auto-discovery from external repositories

PromptScript can automatically discover skills in imported repositories, even if those repositories are unaware of PromptScript. If a repository contains SKILL.md files, .claude/agents/, .claude/commands/, or .github/skills/, PromptScript automatically recognizes and synthesizes them as .prs fragments.

This means a skill author for Claude Code doesn't need to know PromptScript. They just publish a SKILL.md in their repository, and PromptScript users can import it with a single line.

## Resource files with skills

Skills can include resource files: Python scripts, CSV data, JSON templates, configuration files. All files alongside SKILL.md are automatically discovered and copied to the target directories of all 37 AI tools.

For example, a UI design skill might contain a colors.csv file with a color palette and a search.py script for searching patterns. PromptScript will copy these files to .claude/skills/ui-design/, .cursor/skills/ui-design/, and the remaining 35 locations.

Security limits apply: maximum 1 MB per file, 10 MB per skill, 100 files. System files (.env, node_modules, lock files) are automatically skipped.

## Input/output contracts

Skills can define formal contracts describing what data they accept and what they return. Contracts are defined in the YAML frontmatter of the SKILL.md file:

Inputs describe what the skill needs to operate, such as a list of files to scan or a minimum severity level. Outputs describe what the skill produces, such as a markdown report or a boolean flag indicating whether the scan passed.

Supported contract types are string, number, boolean, and enum with predefined options. PromptScript validates contracts at compile time.

## Parameterized skills

Skills can accept parameters that are interpolated at compile time. For example, a test-generator skill can accept parameters for language, framework, and coverage. Each project can use the same skill with different parameter values.

## Skills as user commands

Skills can be marked as userInvocable, meaning the user can invoke them with a command, such as /deploy or /commit. You can also restrict the tools available to a skill (allowedTools) and define dependencies between skills (requires).

## Skills registry

Organizations can create internal skill registries on private Git repositories. A registry can contain a manifest with a skill catalog, tags, descriptions, and auto-detection hints. Teams can browse available skills, and PromptScript can suggest skills based on project dependencies.

## Summary

PromptScript is not just an AI instruction compiler. It is a full-featured skills manager that combines discovering, installing, versioning, validating, and distributing AI skills in a single tool. Write a skill once, manage it centrally, compile to 37 tools.
