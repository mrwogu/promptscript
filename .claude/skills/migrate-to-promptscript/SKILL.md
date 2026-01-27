---
name: 'migrate-to-promptscript'
description: 'Migrate existing AI instruction files to PromptScript format'
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
user-invocable: true
---

<!-- PromptScript 2026-01-27T21:55:57.840Z - do not edit -->

# Migrate to PromptScript

## Overview

This skill guides you through migrating existing AI instruction files
to PromptScript format, creating a unified source of truth for all
AI coding assistants.

## Step 1: Discovery

Search for existing instruction files using these patterns:

Claude Code:

- CLAUDE.md, claude.md, CLAUDE.local.md

Cursor:

- .cursorrules
- .cursor/rules/\*.md
- .cursor/rules/\*.mdc

GitHub Copilot:

- .github/copilot-instructions.md
- .github/instructions/\*.md

Other:

- AGENTS.md
- AI_INSTRUCTIONS.md
- AI.md
- .ai/instructions.md

Use Glob tool to find these files.

## Step 2: Read and Analyze

For each discovered file:

1. Read the full content using the Read tool
2. Identify sections by headers (##, ###) and patterns
3. Classify content type using the mapping table below
4. Note any tool-specific content that may need special handling

## Step 3: Content Mapping

Map source content to PromptScript blocks:

| Source Pattern                       | PromptScript Block |
| ------------------------------------ | ------------------ |
| You are, persona, identity, role     | @identity          |
| Tech stack, languages, frameworks    | @context           |
| Coding standards, conventions, rules | @standards         |
| Don't, Never, restrictions           | @restrictions      |
| Commands, shortcuts                  | @shortcuts         |
| API docs, references, knowledge base | @knowledge         |
| Parameters, config values            | @params            |
| File patterns, globs, applyTo        | @guards            |
| Skills, capabilities                 | @skills            |
| Agents, subagents                    | @agents            |
| Local-only settings                  | @local             |

## Step 4: Generate PromptScript

### Required: @meta block

Every PromptScript file needs metadata with id and syntax fields.

### Identity (persona)

Convert persona descriptions to @identity block with triple-quote string.

### Context (project info)

Convert tech stack to @context block with structured properties
like project, languages, frameworks.

### Standards (conventions)

Convert coding standards to @standards block organized by category:
code, naming, commits, etc.

### Restrictions (don'ts)

Convert restrictions to @restrictions block using dash prefix for each item.

### Shortcuts (commands)

Convert custom commands to @shortcuts block. Simple shortcuts use
key-value format. Complex shortcuts use object format with
prompt, description, and content fields.

### Knowledge (references)

Convert API docs and reference material to @knowledge block
using triple-quote string for rich content.

### Guards (file patterns)

Convert file-specific rules to @guards block with globs array
specifying file patterns.

### Params (configuration)

Convert configuration parameters to @params block with type annotations:
range(), enum(), boolean.

### Skills (capabilities)

Convert skill definitions to @skills block with description,
trigger, and content fields.

### Agents (subagents)

Convert agent definitions to @agents block with description,
tools, model, and content fields.

## Step 5: File Organization

Simple Projects - single file structure:

- .promptscript/project.prs
- promptscript.yaml

Complex Projects - modular file structure:

- .promptscript/project.prs (main with @use imports)
- .promptscript/context.prs
- .promptscript/standards.prs
- .promptscript/restrictions.prs
- .promptscript/commands.prs
- promptscript.yaml

## Step 6: Configuration

Create promptscript.yaml with:

- version: '1'
- project.id
- input.entry pointing to main .prs file
- targets for github, claude, cursor

## Step 7: Validation

After generating PromptScript files:

1. Validate syntax: prs validate
2. Test compilation: prs compile --dry-run
3. Compare output with original files
4. Iterate if content is missing or incorrect

## Common Patterns

### Merging Multiple Sources

When instructions exist in multiple files:

1. Identity: Take from most detailed source
2. Standards: Merge all, deduplicate
3. Restrictions: Combine all (union)
4. Commands: Merge, resolve conflicts

### Tool-Specific Content

Handle tool-specific content:

- GitHub prompts: Use @shortcuts with prompt: true
- Claude agents: Use @agents block
- Cursor rules: Map to @standards
- Local content: Use @local block

### Preserving Formatting

Use triple-quote multiline strings for:

- Rich markdown content
- Code examples
- Complex instructions

## Syntax Rules

Quick reference for PromptScript syntax:

- Strings: quoted or identifier
- Multi-line: triple quotes
- Arrays: [item1, item2] or - item prefix
- Objects: { key: value }
- Comments: # comment
- Required @meta fields: id, syntax

## Quality Checklist

Before completing migration:

- @meta block has id and syntax
- Identity is clear and specific
- Standards are organized by category
- Restrictions use dash prefix (-)
- Shortcuts work in target tools
- prs validate passes
- prs compile produces correct output
- No duplicate content across blocks

## Troubleshooting

### Missing @meta Error

Add required metadata block at the start.

### Multiline String in Object Error

Assign multiline strings to named keys, don't leave them loose
inside objects.

### Content Not Appearing in Output

Check block names match expected patterns and
verify syntax with prs validate --verbose.
