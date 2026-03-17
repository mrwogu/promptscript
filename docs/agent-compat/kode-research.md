# Kode Agent Compatibility Research

**Platform:** Kode
**Registry name:** `kode`
**Formatter file:** `packages/formatters/src/formatters/kode.ts`
**Output path:** `.kode/rules/project.md`
**Tier:** 3
**Research date:** 2026-03-17

---

## Summary

Kode is an AI coding assistant whose public web presence is minimal. The domain `kode.dev` redirects to a domain-parking/for-sale page (Afternic), indicating the tool either operates under a different domain or has not yet launched publicly. No official documentation, GitHub repository, or published specification was found for Kode's rules format via web search or direct URL fetch. The PromptScript formatter for Kode was created using the `createSimpleMarkdownFormatter` factory, producing plain Markdown output at `.kode/rules/project.md` with a `# Project Rules` header — a convention that aligns with the broad ecosystem pattern of dot-directory rule files (e.g., `.windsurf/rules/`, `.cursor/rules/`, `.agent/rules/`).

Because no official documentation could be located, this research documents what is known from the source code, inferred conventions, and ecosystem context.

---

## Official Documentation

No official documentation found. All URLs attempted returned either parking pages or unrelated content:

- `https://kode.dev` — redirects to Afternic domain-for-sale page (as of 2026-03-17)
- `https://kode.dev/lander` — same redirect
- Web searches for "Kode AI coding assistant", "Kode .kode/rules", and related queries returned no results specific to this tool

**Action required:** Official docs must be located before this formatter can be considered production-ready. Possible avenues:

- Search for the tool under alternative names (e.g., "Kode IDE", "Kode agent")
- Check npm (`npm search kode`) and PyPI for a CLI package
- Search GitHub for repositories mentioning `.kode/rules`

---

## Instruction File Format

The following is inferred from the PromptScript source code only. No official schema has been verified.

### Primary file (inferred)

| Property     | Value                             |
| ------------ | --------------------------------- |
| Filename     | `project.md`                      |
| Format       | Plain Markdown                    |
| Location     | `.kode/rules/project.md`          |
| Schema       | Unknown — not publicly documented |
| Front matter | Unknown                           |

### Naming convention

The `.kode/rules/` directory structure follows the same dot-directory pattern used by several other AI coding tools registered in the PromptScript formatter registry:

| Tool        | Rules directory           |
| ----------- | ------------------------- |
| Windsurf    | `.windsurf/rules/`        |
| Antigravity | `.agent/rules/`           |
| Kode        | `.kode/rules/` (inferred) |

This pattern is consistent with the broader ecosystem trend toward versioned, project-scoped rule files stored in a tool-specific hidden directory.

---

## Supported Features

Unknown. No documentation was found. The following assumptions are made based on the factory-generated formatter:

- Plain Markdown is the likely format (consistent with the ecosystem standard)
- Content sections are the standard PromptScript sections: identity, tech stack, architecture, code style, git commits, config files, commands, post-work verification, documentation, diagrams, restrictions
- Skills support: enabled by default (`hasSkills: true` in `createSimpleMarkdownFormatter` default)
- Agents support: disabled (`hasAgents: false` default)
- Commands support: disabled (`hasCommands: false` default)

---

## Multi-File Support

Unknown. The PromptScript `full` version would emit skills at `.kode/skills/<name>/SKILL.md`. Whether Kode natively discovers files outside its primary rules path is not documented.

---

## Skills System

Unknown. No official skills specification found. The formatter uses the default `SKILL.md` skill file name and `.kode` as the dot directory, so skills would be emitted to `.kode/skills/<name>/SKILL.md` in `full` mode.

---

## PromptScript Formatter Assessment

### Current implementation

```typescript
// packages/formatters/src/formatters/kode.ts
export type KodeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: KodeFormatter, VERSIONS: KODE_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kode',
  outputPath: '.kode/rules/project.md',
  description: 'Kode rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kode',
});
```

### Assessment

| Aspect                      | Status          | Notes                                                                                                  |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| Output filename             | Unverified      | `.kode/rules/project.md` follows ecosystem convention but has not been confirmed against official docs |
| Format (Markdown)           | Likely correct  | Plain Markdown is the cross-tool standard; no counter-evidence found                                   |
| Dot directory               | Unverified      | `.kode` is a reasonable convention given the tool name                                                 |
| Main file header            | Unverified      | `# Project Rules` is a generic, safe heading with no known conflicts                                   |
| Skill file support          | Unverified      | Default enabled; path `.kode/skills/<name>/SKILL.md` not confirmed against Kode docs                   |
| `hasAgents` / `hasCommands` | Default (false) | No evidence these are needed; appropriate default                                                      |
| Implementation approach     | Appropriate     | `createSimpleMarkdownFormatter` factory is the correct tier-3 approach                                 |

### Risks

- **Unknown format**: If Kode requires front matter, a specific schema, or a different file name, the current output will not be read correctly.
- **No verification path**: Without official documentation or a working URL, the formatter cannot be end-to-end tested against a real Kode installation.
- **Domain status**: `kode.dev` is parked. The tool may be pre-launch, discontinued, or operating under a different name.

### Potential improvements

Once official documentation is located:

1. Confirm the output path (`.kode/rules/project.md`) is the correct location.
2. Verify whether front matter (YAML, TOML) is required or supported.
3. Confirm whether multi-file/skill discovery is supported and what paths Kode scans.
4. Update `hasAgents` and `hasCommands` if Kode has native equivalents.
5. Add an end-to-end test compiling a `.prs` fixture and verifying the output is accepted by Kode.

---

## Conclusion

The Kode formatter is implemented using the correct tier-3 factory pattern (`createSimpleMarkdownFormatter`) and follows a plausible convention consistent with the broader AI coding tool ecosystem. However, no official documentation for Kode could be found as of 2026-03-17. The `kode.dev` domain is parked, suggesting the tool is either pre-launch or operating under a different identity. The formatter should be considered provisional until official documentation is located and the output path, format, and feature set are verified. No changes to the formatter source are recommended at this time — the implementation is a reasonable placeholder that can be refined once authoritative specifications are available.
