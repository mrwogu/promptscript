# MCPJam Implementation Plan

**Platform:** MCPJam
**Registry Name:** `mcpjam`
**Formatter File:** `packages/formatters/src/formatters/mcpjam.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Formatter Implementation Match

The research report accurately describes the current formatter. The file at
`packages/formatters/src/formatters/mcpjam.ts` matches the documented configuration
exactly:

| Parameter        | Research Claims            | Actual Code                      | Match |
| ---------------- | -------------------------- | -------------------------------- | ----- |
| `name`           | `mcpjam`                   | `mcpjam`                         | Yes   |
| `outputPath`     | `.mcpjam/rules/project.md` | `.mcpjam/rules/project.md`       | Yes   |
| `description`    | `MCPJam rules (Markdown)`  | `MCPJam rules (Markdown)`        | Yes   |
| `mainFileHeader` | `# Project Rules`          | `# Project Rules`                | Yes   |
| `dotDir`         | `.mcpjam`                  | `.mcpjam`                        | Yes   |
| `hasAgents`      | `false` (default)          | not set (defaults to `false`)    | Yes   |
| `hasCommands`    | `false` (default)          | not set (defaults to `false`)    | Yes   |
| `hasSkills`      | `true` (default)           | not set (defaults to `true`)     | Yes   |
| `skillFileName`  | `SKILL.md` (default)       | not set (defaults to `SKILL.md`) | Yes   |

### Output Path Validation

The output path `.mcpjam/rules/project.md` is internally consistent with the
`dotDir` value of `.mcpjam`. The `buildVersions` function in
`create-simple-formatter.ts` detects that the output path starts with `dotDir + '/'`
(`isNested = true`) and generates version descriptions accordingly:

- **simple**: `Single .mcpjam/rules/project.md file`
- **multifile**: `Single .mcpjam/rules/project.md file (skills via full mode)`
- **full**: `.mcpjam/rules/project.md + .mcpjam/skills/<name>/SKILL.md`

This is correct. The `multifile` mode description accurately reflects that
`skillsInMultifile` is not set (defaults to `false`), so skills only appear in
`full` mode.

### Feature Table Validation

The research feature table is accurate against the `MarkdownInstructionFormatter`
base class behavior:

- All common sections (project, techStack, architecture, codeStandards, gitCommits,
  configFiles, commands, postWork, documentation, diagrams, knowledgeContent,
  restrictions) are rendered via `addCommonSections` — confirmed correct.
- Skill files use YAML frontmatter with `name:` and `description:` fields, generated
  by `generateSkillFile` — confirmed correct.
- No command files are generated (`hasCommands: false`) — confirmed correct.
- No agent files are generated (`hasAgents: false`) — confirmed correct.
- Skills are emitted only in `full` mode because `skillsInMultifile` is not set —
  confirmed correct.

### Gap Analysis Validation

The research gap analysis is accurate. The two structural gaps identified are
platform-level, not formatter-level:

1. MCPJam has no publicly documented project-rules file format. The
   `.mcpjam/rules/project.md` path is a PromptScript-defined convention.
2. The `.mcpjam/skills/<name>/SKILL.md` skill path is likewise unconfirmed upstream.

No formatter-level gaps were found. The formatter implementation is complete relative
to all known MCPJam behavior.

---

## Changes Required

### Code Changes

**None.** The formatter is fully implemented and correct. No source file
modifications are needed.

The `packages/formatters/src/formatters/mcpjam.ts` file requires no changes.
The `createSimpleMarkdownFormatter` factory call already expresses all configuration
correctly using factory defaults for optional parameters.

### Test Coverage

No new tests are required as a result of this plan. The formatter is covered by the
shared `createSimpleMarkdownFormatter` factory test suite, which validates the
three output modes (simple, multifile, full) and skill file generation generically
across all Tier 3 formatters.

If a formatter-specific test fixture is desired in the future (e.g., to lock in the
exact output path and header), it can be added as a snapshot test in
`packages/formatters/src/formatters/mcpjam.spec.ts` without any source changes.

### Documentation / Registry

No registry or documentation updates are required as part of this plan. The research
document (`docs/agent-compat/mcpjam-research.md`) already records the current state
accurately.

---

## Complexity Assessment

**Complexity: Minimal (no changes required)**

| Dimension              | Assessment                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Source changes         | None                                                       |
| New files              | None                                                       |
| Test changes           | None required                                              |
| Infrastructure changes | None                                                       |
| Risk                   | None — formatter is already complete                       |
| Upstream uncertainty   | Medium — MCPJam has no formal rules-file spec; conventions |
|                        | may need revision if MCPJam publishes a native format      |

The only future complexity would arise if MCPJam publishes a formal project-rules
file specification. In that case the scope of change would be a single-line update
to the `outputPath`, `mainFileHeader`, and/or `dotDir` parameters in the formatter
factory call — still Tier 3 minimal complexity.

---

## Implementation Notes

### No Action Required

The MCPJam formatter reached full implementation at Tier 3 via the
`createSimpleMarkdownFormatter` factory. This plan serves as a validation checkpoint,
not a task list.

### Monitoring Trigger

Re-evaluate this plan and update the formatter if any of the following occur:

1. **MCPJam publishes a native project-rules file format.** Check
   `https://docs.mcpjam.com` for a file-discovery spec equivalent to `AGENTS.md` or
   `.cursorrules`. If found, update `outputPath`, `mainFileHeader`, and `dotDir` to
   match. If frontmatter is required, the formatter will need to be promoted from a
   factory call to a hand-written subclass of `MarkdownInstructionFormatter`.

2. **MCPJam ships a slash-command mechanism.** If MCPJam defines a command file
   format, set `hasCommands: true` and verify the command directory path matches
   `${dotDir}/commands/<name>.md` (the default generated by `generateCommandFile`).
   If the path differs, a hand-written override of `generateCommandFile` will be
   required.

3. **MCPJam documents agent-definition files.** If MCPJam adds support for
   sub-agent definitions, set `hasAgents: true` and verify the agent directory path
   matches `${dotDir}/agents/<name>.md` (the default generated by
   `generateAgentFile`).

4. **MCPJam documents a skills convention.** If MCPJam confirms or amends the
   `.mcpjam/skills/<name>/SKILL.md` path, update the formatter accordingly. If the
   skill file does not use YAML frontmatter, `generateSkillFile` will need to be
   overridden.

### Factory Call Reference

The current factory call that would be the target of any future change:

```ts
// packages/formatters/src/formatters/mcpjam.ts
export const { Formatter: McpjamFormatter, VERSIONS: MCPJAM_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'mcpjam',
    outputPath: '.mcpjam/rules/project.md',
    description: 'MCPJam rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.mcpjam',
  });
```

To promote to a custom subclass (if upstream format requires it), extend
`MarkdownInstructionFormatter` directly, mirroring the pattern used by
`packages/formatters/src/formatters/claude.ts` or
`packages/formatters/src/formatters/github.ts`.
