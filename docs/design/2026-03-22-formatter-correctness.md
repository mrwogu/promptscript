# Formatter Correctness

## Problem Statement

During ECC migration testing, two formatter output issues were discovered:

1. **Agent frontmatter tools format bug:** The Claude formatter generates agent YAML frontmatter with `tools: Read, Grep, Glob` (a bare comma-separated string), but Claude Code expects `tools: ["Read", "Grep", "Glob"]` (a YAML inline array). This causes Claude Code to misparse the tools list when loading agent files.

2. **Output section ordering inconsistency:** Each formatter defines its own section order in `addCommonSections()`. The orders differ across formatters and do not follow a documented convention, making it difficult to predict output structure or match existing project layouts.

## Goals

- Fix the tools format bug in Claude agent YAML frontmatter so tools are serialized as a YAML inline array
- Audit all formatters that generate agent/skill/command YAML frontmatter for the same bug pattern
- Document and standardize the default output section ordering across formatters
- Ensure the fix is backward-compatible (existing compiled output changes only in the tools line format)

## Non-Goals

- Full section ordering configurability via `sectionOrder` config in `promptscript.yaml` (future work)
- Changing the formatter class hierarchy or architecture
- Adding new sections or removing existing ones

## Design

### 1. Agent Frontmatter Tools Format

#### Problem

In `packages/formatters/src/formatters/claude.ts`, the `generateAgentFile()` method at line 748 serializes tools as:

```typescript
lines.push(`tools: ${config.tools.join(', ')}`);
```

This produces:

```yaml
---
name: researcher
description: Researches codebases
tools: Read, Grep, Glob
---
```

Claude Code expects a YAML array:

```yaml
---
name: researcher
description: Researches codebases
tools: ['Read', 'Grep', 'Glob']
---
```

#### Root Cause

The Claude formatter's `generateAgentFile()` joins the tools array into a plain comma-separated string instead of formatting it as a YAML inline array. Other formatters (GitHub, Factory) already use the correct `[...]` array syntax for their tools fields.

#### Affected Files and Current Behavior

| File                                                        | Method                      | Current Output                  | Status                 |
| ----------------------------------------------------------- | --------------------------- | ------------------------------- | ---------------------- |
| `packages/formatters/src/formatters/claude.ts`              | `generateAgentFile()`       | `tools: Read, Grep, Glob`       | **BUG**                |
| `packages/formatters/src/formatters/claude.ts`              | `generateAgentFile()`       | `disallowedTools: Tool1, Tool2` | **BUG** (same pattern) |
| `packages/formatters/src/formatters/claude.ts`              | `generateAgentFile()`       | `mcpServers: server1, server2`  | **BUG** (same pattern) |
| `packages/formatters/src/formatters/github.ts`              | `generateCustomAgentFile()` | `tools: ['read', 'search']`     | OK                     |
| `packages/formatters/src/formatters/github.ts`              | `generatePromptFile()`      | `tools: ['read', 'search']`     | OK                     |
| `packages/formatters/src/formatters/factory.ts`             | `generateAgentFile()`       | `tools: ["tool1", "tool2"]`     | OK                     |
| `packages/formatters/src/formatters/factory.ts`             | `generateCommandFile()`     | `tools: ['tool1']`              | OK                     |
| `packages/formatters/src/markdown-instruction-formatter.ts` | `generateAgentFile()`       | No tools field                  | N/A                    |

#### Fix Approach

In `claude.ts` `generateAgentFile()`, replace all bare `.join(', ')` serializations for array-type YAML fields with inline YAML array format:

**Before:**

```typescript
if (config.tools && config.tools.length > 0) {
  lines.push(`tools: ${config.tools.join(', ')}`);
}

if (config.disallowedTools && config.disallowedTools.length > 0) {
  lines.push(`disallowedTools: ${config.disallowedTools.join(', ')}`);
}

// ... same pattern for mcpServers
```

**After:**

```typescript
if (config.tools && config.tools.length > 0) {
  const toolsArray = config.tools.map((t) => `"${t}"`).join(', ');
  lines.push(`tools: [${toolsArray}]`);
}

if (config.disallowedTools && config.disallowedTools.length > 0) {
  const arr = config.disallowedTools.map((t) => `"${t}"`).join(', ');
  lines.push(`disallowedTools: [${arr}]`);
}

if (config.mcpServers && config.mcpServers.length > 0) {
  const arr = config.mcpServers.map((t) => `"${t}"`).join(', ');
  lines.push(`mcpServers: [${arr}]`);
}
```

This matches the pattern already used by GitHub and Factory formatters.

### 2. Output Section Ordering

#### Current Behavior

Each formatter defines section order independently in its `addCommonSections()` method:

**Claude formatter** (`claude.ts`):

1. project (identity)
2. techStack
3. architecture
4. codeStandards
5. gitCommits
6. configFiles
7. commands (shortcuts)
8. postWork
9. documentation
10. diagrams
11. knowledgeContent
12. donts (restrictions)

**GitHub formatter** (`github.ts`):

1. project
2. techStack
3. architecture
4. codeStandards
5. shortcuts
6. commands (knowledge)
7. gitCommits
8. configFiles
9. documentation
10. postWork
11. restrictions
12. diagrams
13. knowledge

**MarkdownInstructionFormatter base** (used by Factory, OpenCode):

1. project
2. techStack
3. architecture
4. codeStandards
5. gitCommits
6. configFiles
7. commands
8. postWork
9. documentation
10. diagrams
11. knowledgeContent
12. restrictions

#### Proposed Standard Order

The recommended default section order follows the principle of "context first, reference material last, restrictions near the end":

1. **Project** (identity/description) -- who you are
2. **Tech Stack** -- what you work with
3. **Architecture** -- how the system is structured
4. **Code Standards** -- how to write code
5. **Git Commits** -- how to commit
6. **Configuration** -- tool config details
7. **Commands / Shortcuts** -- available actions
8. **Post-Work Verification** -- what to run after changes
9. **Documentation** -- doc maintenance rules
10. **Diagrams** -- diagram conventions
11. **Knowledge** -- additional reference material
12. **Restrictions** -- what NOT to do (near end for emphasis)

This order is already used by the Claude formatter and MarkdownInstructionFormatter base class. The GitHub formatter deviates slightly (shortcuts before commands, diagrams after restrictions). Aligning GitHub to the standard order is a low-risk change.

#### Approach

- **(a)** Align the GitHub formatter's `addCommonSections()` to match the standard order above. This is a non-breaking change since section ordering in output files does not affect tool parsing.
- **(b)** Add a brief section ordering reference to the formatter documentation in `docs/reference/formatters.md` (or equivalent) so contributors and users know the expected output structure.
- **(c) Future:** Allow `sectionOrder` configuration in `promptscript.yaml` per target. This is out of scope for this change.

## Testing Strategy

### Agent Frontmatter Fix

- **Unit tests:** Update existing Claude formatter agent tests in `packages/formatters/src/formatters/claude.spec.ts` to assert YAML array format for `tools`, `disallowedTools`, and `mcpServers`.
- **Snapshot tests:** Any snapshot fixtures containing agent frontmatter will need updating.
- **Integration test:** Compile a `.prs` file with agent definitions and verify the output parses as valid YAML with array-typed tools.

### Section Ordering

- **Unit tests:** Add a test per formatter that verifies section heading order in the main output file matches the documented standard.
- **Snapshot tests:** Update any affected snapshots after reordering GitHub sections.

## Migration / Breaking Changes

### Agent Frontmatter (tools format)

This is a **bug fix**. The previous output (`tools: Read, Grep, Glob`) was invalid for Claude Code agent files. Users who have already compiled and manually adjusted their agent files may see diffs on recompile. The new format is the correct one per Claude Code documentation.

### Section Ordering

Reordering sections in the GitHub formatter output is a **cosmetic change**. It does not affect how GitHub Copilot reads the instructions (Copilot reads the entire file, not by section). Users will see a diff on recompile but no behavioral change.

Neither change requires a migration step. Both are safe to ship as a patch release.

## Open Questions

1. **Quote style for Claude tools:** Claude Code documentation shows `tools: ["Read", "Grep"]` with double quotes. Should we use double quotes (matching docs) or single quotes (matching GitHub/Factory formatters)? Recommendation: use double quotes for Claude since that matches their docs exactly.

2. **Should `skills` array in Claude agent frontmatter also use inline array format?** Currently it uses the block sequence style (`skills:\n  - skill1\n  - skill2`). Block style is valid YAML and more readable for longer lists -- keep as-is.

3. **GitHub section ordering -- is `shortcuts` distinct from `commands`?** The GitHub formatter renders both. Should they be merged into a single "Commands & Shortcuts" section, or kept separate? Recommendation: keep separate for now; shortcuts are inline summaries while commands come from knowledge blocks.
