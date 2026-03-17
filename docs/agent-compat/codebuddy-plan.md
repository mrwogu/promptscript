# CodeBuddy — Implementation Plan

## Research Validation

### Output Path

The research reports `.codebuddy/rules/project.md` as the primary output path. The current formatter
(`packages/formatters/src/formatters/codebuddy.ts`) sets `outputPath: '.codebuddy/rules/project.md'`
and `dotDir: '.codebuddy'`. This is correct and confirmed.

### Main File Header

The research states rules files are plain Markdown with no required frontmatter. The formatter uses
`mainFileHeader: '# Project Rules'`, which is consistent with the platform's documentation and
conventions. No change needed.

### Feature Gaps Confirmed Against Code

The current formatter is created via `createSimpleMarkdownFormatter` with no `hasAgents`,
`hasCommands`, or `hasSkills` flags set. Looking at the factory defaults in
`packages/formatters/src/create-simple-formatter.ts`:

- `hasAgents` defaults to `false`
- `hasCommands` defaults to `false`
- `hasSkills` defaults to `true`

This means `hasSkills` is effectively `true` in the current formatter, but skills are only generated
in `full` mode (via `formatFull`) inside `MarkdownInstructionFormatter`. Since the formatter uses
the factory's default `SimpleFormatter` class with no overrides, skill file generation via
`formatFull` is actually wired up by the base class already for `hasSkills: true`. However, the
`CodeBuddyVersion` type exports `'simple' | 'multifile' | 'full'` without any documentation or
tests exercising the full mode for CodeBuddy specifically, and there are no CodeBuddy-specific
adaptations for the platform's YAML frontmatter fields (`user-invocable`, `disable-model-invocation`,
`context`, `agent`).

The research correctly identifies the following gaps:

| Gap                                                   | Research Assessment                 | Code Validation                                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sub-agent files (`.codebuddy/agents/<name>.md`)       | Missing                             | Confirmed: `hasAgents: false` (default)                                                                                                                                                    |
| Skill files (`.codebuddy/skills/<name>/SKILL.md`)     | Missing (not generated in practice) | Partially wired: `hasSkills: true` by default; base `generateSkillFile` runs in full mode but outputs generic frontmatter (`name`, `description` only) — missing CodeBuddy-specific fields |
| Slash command files (`.codebuddy/commands/<name>.md`) | Missing                             | Confirmed: `hasCommands: false` (default)                                                                                                                                                  |
| Multifile rules mode                                  | Missing                             | Confirmed: multifile mode produces no additional files (no `hasCommands` or `skillsInMultifile` enabled)                                                                                   |
| `CODEBUDDY.md` alternative output                     | Missing                             | Confirmed: not implemented                                                                                                                                                                 |

### Excess / Incorrect Output

The research concludes there is no incorrect or excess output. This is validated: the factory
produces a plain Markdown file with `# Project Rules` header and standard sections. No unsupported
fields or conventions are emitted.

### Research Accuracy Rating

The research report is accurate. One nuance not mentioned in the research: skill file generation is
partially wired through the base class (because `hasSkills` defaults to `true`), but the generated
frontmatter does not include CodeBuddy-specific fields (`user-invocable`, `disable-model-invocation`,
`context`, `agent`). This is a fidelity gap within the "skills" feature, not a complete absence.

---

## Changes Required

### Priority 1 — Enable agents (High)

**File:** `packages/formatters/src/formatters/codebuddy.ts`

Set `hasAgents: true` in the `createSimpleMarkdownFormatter` call. The base class
`generateAgentFile` in `MarkdownInstructionFormatter` already emits:

```yaml
---
description: <description>
mode: subagent
---
```

The CodeBuddy agent frontmatter schema (`name`, `description`, `tools`, `model`, `permissionMode`,
`skills`) differs from the base class output (`description`, `mode: subagent`). This requires a
custom `generateAgentFile` override rather than merely flipping the flag.

**Required approach:** Extend `MarkdownInstructionFormatter` in a dedicated class (replacing the
factory-produced anonymous `SimpleFormatter`) and override `generateAgentFile` to emit the correct
CodeBuddy frontmatter:

```yaml
---
name: <name>
description: <description>
tools: <tool1>, <tool2> # optional
model: <model> # optional
permissionMode: <mode> # optional
skills: # optional
  - <skill-name>
---
```

Output path: `.codebuddy/agents/<name>.md` — same path convention as the base class, which already
uses `${this.config.dotDir}/agents/${config.name}.md`. No path change needed.

### Priority 2 — Fix skill frontmatter fidelity (High)

**File:** `packages/formatters/src/formatters/codebuddy.ts`

The base `generateSkillFile` outputs only `name` and `description` in frontmatter. CodeBuddy
supports additional YAML fields: `allowed-tools`, `disable-model-invocation`, `user-invocable`,
`context`, `agent`. These map to existing PromptScript skill properties (`allowedTools`,
`userInvocable`, `context`, `agent`) already parsed by the Claude formatter's `extractSkills`.

The CodeBuddy class needs to override `generateSkillFile` to emit:

```yaml
---
name: <name>
description: <description>
allowed-tools: # optional
  - <tool>
disable-model-invocation: true # optional, when userInvocable is false
user-invocable: true # optional
context: fork # optional
agent: <agent-name> # optional
---
```

Note the field name difference: `allowed-tools` (kebab-case) in CodeBuddy vs `allowedTools` in the
Claude formatter. The base `extractSkills` in `MarkdownInstructionFormatter` extracts `resources`
but not `allowedTools`, `userInvocable`, `context`, or `agent`. These are extracted by the Claude
formatter's private `extractSkills` override. A CodeBuddy-specific `extractSkills` override must be
added to parse these fields.

Skill output path: `.codebuddy/skills/<name>/SKILL.md` — already correct via
`${this.config.dotDir}/skills/${config.name}/${this.config.skillFileName}` with
`skillFileName: 'SKILL.md'`.

### Priority 3 — Enable commands (Medium)

**File:** `packages/formatters/src/formatters/codebuddy.ts`

Set `hasCommands: true`. The base `generateCommandFile` already emits:

```yaml
---
description: <description>
argument-hint: <hint> # optional
---
```

The CodeBuddy command frontmatter also supports `model`, `allowed-tools`, and
`disable-model-invocation`. For an initial implementation, the base output (description +
argument-hint) is valid and sufficient. A follow-up enhancement could add these extra fields via a
`generateCommandFile` override.

Output path: `.codebuddy/commands/<name>.md` — already correct via base class.

Commands are generated in `multifile` and `full` modes via the base `formatMultifile` and
`formatFull` implementations. Setting `hasCommands: true` is sufficient for the initial cut.

### Priority 4 — Multifile mode (Low)

No additional work beyond enabling commands (Priority 3) and skills in multifile mode. If desired,
set `skillsInMultifile: true` so that skill files are also emitted in `multifile` mode (not just
`full`). The research rates this Low; defer unless requested.

### Priority 5 — `CODEBUDDY.md` alternative output target (Low)

Not implemented in any existing formatter. Would require either a new `version` value (e.g.,
`'memory-file'`) or a separate formatter registration. Defer; research rates this Low.

---

## Complexity Assessment

| Change                                 | Complexity | Rationale                                                                                                                                                                |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Enable agents with correct frontmatter | Medium     | Requires converting from factory to class-based formatter and overriding `generateAgentFile`; agent frontmatter differs from base class output                           |
| Fix skill frontmatter fidelity         | Medium     | Requires overriding both `extractSkills` (to parse `allowedTools`, `userInvocable`, `context`, `agent`) and `generateSkillFile` (to emit CodeBuddy-specific YAML fields) |
| Enable commands                        | Low        | `hasCommands: true` is sufficient for a valid initial implementation; base class handles the rest                                                                        |
| Multifile rules splitting              | Low        | Setting `skillsInMultifile: true` is a one-liner; no logic changes required                                                                                              |
| `CODEBUDDY.md` memory file output      | High       | No existing pattern; new version type or formatter variant required                                                                                                      |

**Overall:** Medium complexity. The factory pattern must be abandoned in favor of a class-based
formatter (matching the Claude and GitHub formatters) to support the required method overrides.
The core logic for extracting and rendering agents, skills, and commands already exists in the base
class and Claude formatter — the CodeBuddy formatter primarily adapts field names and YAML
structure.

---

## Implementation Notes

### Class Structure

Replace the factory call with a dedicated class extending `MarkdownInstructionFormatter`, following
the same pattern as `ClaudeFormatter` and `GithubFormatter`:

```typescript
export class CodeBuddyFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'codebuddy',
      outputPath: '.codebuddy/rules/project.md',
      description: 'CodeBuddy rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.codebuddy',
      skillFileName: 'SKILL.md',
      hasAgents: true,
      hasCommands: true,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): CodeBuddyVersionMap { ... }

  protected override generateAgentFile(config: MarkdownAgentConfig): FormatterOutput { ... }
  protected override extractSkills(ast: Program): CodeBuddySkillConfig[] { ... }
  protected override generateSkillFile(config: CodeBuddySkillConfig): FormatterOutput { ... }
}
```

### Agent Frontmatter Mapping

The base `MarkdownAgentConfig` only carries `name`, `description`, `content`. A CodeBuddy-specific
`CodeBuddyAgentConfig` interface should extend it with `tools?: string[]`, `model?: string`,
`permissionMode?: string`, `skills?: string[]`. The `extractAgents` override in the base class
already skips agents without a `description`, which is correct for CodeBuddy (description is
required).

### Skill Field Name Differences

| PromptScript / Claude field | CodeBuddy YAML field       |
| --------------------------- | -------------------------- |
| `allowedTools`              | `allowed-tools`            |
| `userInvocable`             | `user-invocable`           |
| `context`                   | `context`                  |
| `agent`                     | `agent`                    |
| (no equivalent)             | `disable-model-invocation` |

The `disable-model-invocation` field can be derived: emit it as `true` when `userInvocable` is
`false` and the skill has non-empty content (i.e., it is a background skill not meant to be called
directly by the user). This matches the platform's documented intent.

### Version Descriptions

Update `CODEBUDDY_VERSIONS` (or its equivalent static map) to accurately describe the modes:

- `simple`: Single `.codebuddy/rules/project.md` file
- `multifile`: `project.md` + `.codebuddy/commands/<name>.md`
- `full`: `project.md` + `.codebuddy/commands/<name>.md` + `.codebuddy/skills/<name>/SKILL.md` + `.codebuddy/agents/<name>.md`

### Testing

Add `packages/formatters/src/formatters/codebuddy.spec.ts` with:

- Simple mode: verify `project.md` content and path
- Full mode with skills: verify `.codebuddy/skills/<name>/SKILL.md` path and frontmatter fields
  (`allowed-tools`, `user-invocable`, `disable-model-invocation`, `context`, `agent`)
- Full mode with agents: verify `.codebuddy/agents/<name>.md` path and frontmatter (`name`,
  `description`, `tools`, `model`, `permissionMode`, `skills`)
- Multifile mode with commands: verify `.codebuddy/commands/<name>.md` path and frontmatter

Follow the AAA pattern and use fixtures consistent with other formatter tests in the package.

### Token Budget Consideration

The research notes a 2,000-token default budget for rules loaded from `.codebuddy/rules/`. No
formatter-level truncation is needed (the research confirms most generated files are well under this
limit), but the implementation notes should document this constraint so future contributors are
aware. No code change required for this item.
