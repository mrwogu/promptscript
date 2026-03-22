# Agent Auto-Discovery & Migration Tooling

## Problem Statement

Three related gaps were discovered during the ECC migration, which involves 28
agent markdown files with YAML frontmatter living in an `agents/` directory:

1. **No agent auto-discovery.** Skills are auto-discovered from
   `<universalDir>/skills/` and commands from `<universalDir>/commands/`, but
   agents are not. Projects must manually duplicate agent definitions into
   `@agents` blocks.

2. **No bulk import.** `prs import` operates on a single file. Migrating a
   directory of 28 agents requires running the command once per file and
   manually assembling the output.

3. **No source comparison.** `prs diff` compares compiled output with the
   target path. During migration you need to compare compiled output with the
   *original* source files to measure fidelity loss introduced by the
   PromptScript compilation pipeline.

## Goals

- Enable agent auto-discovery from the universal directory (`agents/`).
- Support bulk import of an entire agent directory into a single `.prs` file.
- Add a `--source` flag to `prs diff` for migration fidelity measurement.

## Non-Goals

- Auto-discovery of other file types (rules, hooks, etc.).
- Automatic migration without user review.
- Real-time fidelity monitoring.
- Changes to the `@agents` block syntax itself.

## Design

### 1. Universal Directory Agent Discovery

#### Discovery Mechanism

The resolver already walks `<universalDir>/skills/` and
`<universalDir>/commands/` to collect files. Agent discovery follows the same
pattern:

1. Read `agents/` (or a configured path) inside the universal directory.
2. For each `.md` file, parse YAML frontmatter and the markdown body.
3. Build an in-memory agent definition equivalent to an `@agents` block entry.
4. Pass discovered agents into the compiler alongside parsed `.prs` content.

#### Agent File Format

```yaml
---
name: planner
description: Expert planning specialist
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are an expert planning specialist...
```

Required frontmatter fields: `name`.
Optional frontmatter fields: `description`, `tools`, `model`.
The markdown body (everything after the closing `---`) becomes the agent's
`content` value.

#### Merge Behavior

When both a discovered agent file and an `@agents` block define an agent with
the same name, the `@agents` block wins. This follows the existing precedent
where explicit `.prs` declarations override auto-discovered content, giving
authors full control.

#### Config Changes

Add an optional `agentsPath` field to the universal directory configuration in
`prs.config.yaml`:

```yaml
universalDir:
  path: .promptscript
  agentsPath: agents  # default
```

#### Files Affected

| File | Change |
|------|--------|
| `packages/core/src/types/config.ts` | Add `agentsPath` to universal dir config type |
| `packages/resolver/src/discovery/` | New `agent-discovery.ts` module (parallel to skill discovery) |
| `packages/resolver/src/universal-dir.ts` | Wire agent discovery into the universal dir resolver |
| `packages/compiler/src/compiler.ts` | Merge discovered agents with `@agents` blocks before compilation |

### 2. Bulk Agent Import

#### CLI Interface

```bash
# Import all agents from a directory
prs import agents/

# Import with explicit output path
prs import agents/ -o agents.prs
```

When the argument to `prs import` is a directory (instead of a file), the
command switches to bulk mode.

#### Parsing Logic

For each `.md` file in the directory:

1. Split content at the second `---` to separate YAML frontmatter from body.
2. Parse frontmatter with the existing YAML parser.
3. Trim the markdown body.

Files without valid YAML frontmatter are skipped with a warning.

#### Output Format

A single `.prs` file containing one `@agents` block with all discovered agents:

```promptscript
@agents {
  planner {
    description: "Expert planning specialist"
    tools: ["Read", "Grep", "Glob"]
    model: opus
    content: """
      You are an expert planning specialist...
    """
  }

  reviewer {
    description: "Code review specialist"
    tools: ["Read", "Grep"]
    model: sonnet
    content: """
      You are a code review specialist...
    """
  }
}
```

#### Mapping Rules

| Frontmatter field | `@agents` property |
|-------------------|--------------------|
| `name`            | Agent key (block name) |
| `description`     | `description` property |
| `tools`           | `tools` property (array) |
| `model`           | `model` property |
| markdown body     | `content` property (triple-quoted text) |

#### Files Affected

| File | Change |
|------|--------|
| `packages/cli/src/commands/import.ts` | Detect directory argument, invoke bulk import |
| `packages/importer/src/agents/` | New `agent-importer.ts` with frontmatter parsing and PRS generation |
| `packages/importer/src/agents/frontmatter-parser.ts` | YAML frontmatter extraction utility |

### 3. Source Comparison Diff

#### CLI Interface

```bash
# Compare compiled agents with original source files
prs diff --source agents/

# With explicit compile target
prs diff --source agents/ --target .claude/agents/
```

#### Matching Algorithm

1. Compile the project to produce output agent files.
2. List all `.md` files in the `--source` directory.
3. For each source file, find the corresponding compiled output by matching the
   agent name (derived from the source file's frontmatter `name` field) to the
   compiled output filename.
4. Run a text diff between the source markdown body and the compiled agent
   content.

#### Fidelity Summary Output

```
Agent Fidelity Report
=====================
planner.md        : 100% match (identical)
reviewer.md       :  98% match (whitespace normalization)
architect.md      :  95% match (3 lines differ)
-----------------------------------------------------
Overall fidelity  :  97.6% (28 agents)
```

The fidelity percentage is computed as:
`(1 - changed_lines / total_lines) * 100`

Lines that differ only in whitespace normalization are reported separately from
semantic changes.

#### Files Affected

| File | Change |
|------|--------|
| `packages/cli/src/commands/diff.ts` | Add `--source` flag, source comparison mode |
| `packages/compiler/src/diff/` | New `source-comparator.ts` with matching and fidelity logic |

## Testing Strategy

### Unit Tests

- **Agent discovery:** Fixture directory with valid/invalid agent `.md` files.
  Verify correct parsing, graceful handling of malformed frontmatter, and
  proper merge with `@agents` blocks (explicit wins).
- **Bulk import:** Fixture directory with multiple agent files. Verify output
  `.prs` matches expected structure. Cover edge cases: empty body, missing
  optional fields, files without frontmatter (should skip).
- **Source diff:** Mock compiled output and source files. Verify matching by
  name, correct fidelity calculation, and whitespace-only change detection.

### Integration Tests

- End-to-end: place agent `.md` files in a universal directory, compile, and
  verify agents appear in output.
- End-to-end: run `prs import agents/` on a fixture directory and verify the
  generated `.prs` file compiles successfully.
- End-to-end: compile a project, run `prs diff --source`, and verify the
  fidelity report is accurate.

## Migration / Breaking Changes

All three features are additive. No breaking changes are introduced:

- Agent discovery is opt-in via the presence of an `agents/` directory (or
  configured path). Existing projects without this directory are unaffected.
- Bulk import is a new code path triggered only when a directory is passed to
  `prs import`. Single-file import behavior is unchanged.
- The `--source` flag is a new option on `prs diff`. Existing `prs diff`
  behavior is unchanged.

## Open Questions

1. **Subdirectory support:** Should agent discovery recurse into subdirectories
   of `agents/`, or only scan the top level? Skill discovery currently does not
   recurse. Recommendation: start flat, add recursion later if needed.

2. **Frontmatter schema validation:** Should we validate frontmatter fields
   strictly (error on unknown fields) or leniently (ignore unknown fields)?
   Recommendation: lenient with warnings, to avoid blocking migration of files
   that have extra metadata.

3. **Agent file extensions:** Should we support only `.md` files, or also
   `.txt` and `.yaml`? Recommendation: `.md` only for the initial
   implementation, matching the convention observed in ECC and other projects.

4. **Fidelity threshold:** Should `prs diff --source` support a
   `--fail-below <percent>` flag for CI use? Recommendation: yes, add in
   follow-up work.
