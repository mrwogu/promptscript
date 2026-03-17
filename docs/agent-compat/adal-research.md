# AdaL Agent Compatibility Research

**Platform:** AdaL (SylphAI)
**Registry name:** `adal`
**Formatter file:** `packages/formatters/src/formatters/adal.ts`
**Output path:** `.adal/rules/project.md`
**Tier:** 3
**Research date:** 2026-03-17

---

## Summary

AdaL is "The Self-Evolving AI Coding Agent for Teams & Power Developers" developed by SylphAI. It is available as both a CLI tool (`adal-cli`) and a local web UI ("AdaL Web"). AdaL positions itself as an autonomous coding agent that learns from the team's codebase, integrates with CI/CD pipelines, and can run multiple AI agents in parallel across branches. It also connects to MCP servers.

No official public documentation was found describing AdaL's instruction or rules file format in detail. The PromptScript formatter for AdaL (`adal.ts`) writes to `.adal/rules/project.md` using the `createSimpleMarkdownFormatter` factory, outputting a plain Markdown file with a `# Project Rules` header. This follows the same convention used by other Tier 3 formatters in this codebase (e.g., Junie, Windsurf).

Because AdaL's configuration format is unconfirmed, all findings below are based on: (a) web search and publicly available materials, (b) the PromptScript formatter source, and (c) inference from AdaL's positioning as a CLI coding agent that stores project-level rules in a dotfile directory.

---

## Official Documentation

No stable, publicly accessible documentation site was found for AdaL's instruction file format as of 2026-03-17. The following sources were consulted:

- SylphAI main site: https://www.sylph.ai/
- AdaL CLI GitHub (SylphAI org): https://github.com/sylphai-inc/adal-cli
- SylphAI GitHub org: https://github.com/sylphai-inc
- AdaL CLI LinkedIn announcement: https://www.linkedin.com/posts/sylphai_machinelearning-artificialintelligence-activity-7391164463527190528-V6ml
- AdaL Web (Hacker News launch): https://news.ycombinator.com/item?id=46739802
- AdaL waitlist (redirects to sylph.ai): https://adal.ml/waitlist

The `adal-cli` repository exists on GitHub under the SylphAI organization (55 stars as of research date) but its README and configuration file documentation were not publicly accessible via web fetch.

---

## Instruction File Format

### Primary file

| Property     | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| Filename     | `project.md` (inferred from formatter; unconfirmed by platform)   |
| Format       | Plain Markdown                                                    |
| Location     | `.adal/rules/` (inferred from formatter; unconfirmed by platform) |
| Schema       | None documented — assumed free-form Markdown                      |
| Front matter | Not documented                                                    |

The `.adal/` directory structure mirrors the convention used by tools such as Windsurf (`.windsurf/rules/project.md`) and other dotfile-based coding agents. Whether AdaL discovers `.adal/rules/project.md` automatically or requires explicit configuration is unconfirmed.

### File discovery

No documented file discovery chain was found. Based on the formatter's configuration and the CLI's described capabilities (team codebase learning, CI/CD integration), it is likely that:

- The `.adal/` directory is the primary workspace for AdaL configuration files.
- The `rules/project.md` path is a project-level instruction file loaded at agent startup.
- A user-global equivalent (e.g., `~/.adal/rules/project.md`) may exist but is unconfirmed.

---

## Supported Features

| Feature                  | Platform support | Currently implemented | Notes                                           |
| ------------------------ | ---------------- | --------------------- | ----------------------------------------------- |
| Single file output       | Likely yes       | Yes                   | `.adal/rules/project.md`                        |
| Multi-file rules         | Unknown          | Yes (full mode)       | `.adal/skills/<name>/SKILL.md`                  |
| YAML front matter        | Unknown          | No                    | Not produced by `createSimpleMarkdownFormatter` |
| Slash commands           | Unknown          | No                    | `hasCommands: false`                            |
| Skills                   | Unknown          | Yes (default)         | `.adal/skills/<name>/SKILL.md`                  |
| Agent sub-files          | Unknown          | No                    | `hasAgents: false`                              |
| MCP server config        | Yes (announced)  | No                    | Out of scope for text guidelines                |
| CI/CD integration        | Yes (announced)  | No                    | Out of scope for text guidelines                |
| Parallel agent branching | Yes (announced)  | No                    | Platform-level feature, not in rules            |

---

## Conventions and Best Practices

Because AdaL's documentation is not publicly available, no platform-specific best practices for the rules file format could be confirmed. The following are inferred from AdaL's public positioning and from the analogous Windsurf and Junie formatter conventions:

- **Location:** `.adal/rules/project.md` in the project root, committed to version control so all team members share the same rules automatically.
- **Format:** Plain Markdown with no special syntax or required front matter.
- **Content:** Likely consistent with other agents — project description, tech stack, architecture, coding standards, git commit conventions, post-work verification steps, and restrictions.
- **Team learning:** AdaL's self-evolution feature suggests rules may be augmented or generated from observed codebase patterns. The static `project.md` would serve as the baseline policy.

---

## Gap Analysis vs Current Implementation

### Correct (what we do right)

- Generates a single Markdown file with a `# Project Rules` header — a sensible default consistent with other Tier 3 formatters.
- Uses `.adal/` as the dot directory, which aligns with AdaL's branding and the convention used by the CLI.
- Skills are enabled by default (`hasSkills: true`), producing `.adal/skills/<name>/SKILL.md` in full mode.
- Uses `createSimpleMarkdownFormatter`, keeping the implementation minimal and consistent with the factory pattern.

### Unverified (could not confirm against platform documentation)

- **Output path correctness:** `.adal/rules/project.md` may or may not be auto-discovered by AdaL CLI. No documentation confirms this path. If AdaL uses a flat `.adal/rules.md` or `.adalrc.md` instead, the formatter would write to an ignored location.
- **Skill file consumption:** Whether AdaL reads `.adal/skills/<name>/SKILL.md` is unconfirmed. The path follows the open SKILL.md standard, so it is a reasonable default.
- **Front matter requirements:** Some agents require YAML front matter in rule files. Whether AdaL requires or benefits from front matter is unknown.

### Missing (features platform may support but we don't implement)

- **MCP server configuration:** AdaL announces MCP server integration via CLI. This is a platform-level feature and out of scope for the text rules formatter.
- **CI/CD rule injection:** AdaL integrates with CI/CD pipelines. Rules relevant to CI agents might warrant a separate CI-scoped file, but this is speculative without documentation.

### Excess (features we generate but platform may not support)

- None identified. The plain Markdown output is a safe, universally ingestible format.

---

## PromptScript Formatter Assessment

### Current implementation

```typescript
// packages/formatters/src/formatters/adal.ts
export type AdalVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: AdalFormatter, VERSIONS: ADAL_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'adal',
  outputPath: '.adal/rules/project.md',
  description: 'AdaL rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.adal',
});
```

### Assessment

| Aspect                      | Status          | Notes                                                                                 |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| Output filename             | Unverified      | `.adal/rules/project.md` is a reasonable convention; not confirmed by platform docs   |
| Format (Markdown)           | Likely correct  | AdaL is a Markdown-based agent; no alternative format documented                      |
| Dot directory               | Likely correct  | `.adal/` matches the product name and CLI branding                                    |
| Skill file support          | Unverified      | `.adal/skills/<name>/SKILL.md` is a reasonable default; platform support unconfirmed  |
| Main file header            | Acceptable      | `# Project Rules` is a neutral header; platform has no documented heading requirement |
| `hasSkills` default         | Correct         | Skills enabled by default; consistent with other simple formatters                    |
| `hasAgents` / `hasCommands` | Default (false) | No platform documentation found to justify enabling either                            |

### Potential improvements

- **Verify output path:** The single most important action is to confirm with AdaL documentation or community resources that `.adal/rules/project.md` is the path AdaL auto-discovers. If the discovered path differs, the `outputPath` must be updated.
- **Consider flat output path:** If AdaL (like some agents) uses a top-level file such as `.adal/rules.md` or `.adal/project.md`, the formatter's nested `rules/` subdirectory would need adjusting.
- **CI/CD-scoped rule files:** Once platform documentation becomes available, evaluate whether AdaL benefits from environment-scoped rule files (e.g., `.adal/rules/ci.md`) in `full` mode.

---

## Language Extension Requirements

None identified. AdaL appears to consume plain Markdown, which the existing `createSimpleMarkdownFormatter` factory already produces. No new PromptScript language constructs are needed for this formatter.

---

## Conclusion

The AdaL formatter is implemented as a minimal, conservative Tier 3 formatter using the `createSimpleMarkdownFormatter` factory. The output path (`.adal/rules/project.md`), format (plain Markdown), and dot directory (`.adal/`) are internally consistent and follow the conventions established by similar tools. However, because AdaL's official documentation is not publicly accessible, the correctness of the output path cannot be confirmed. The formatter should be treated as a best-effort implementation pending official documentation or community validation. No changes to the formatter source are recommended at this time; the primary follow-up action is to verify the auto-discovered rules file path against AdaL CLI documentation or source code when it becomes available.
