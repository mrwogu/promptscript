# Plan: Agent Formatters Expansion

## Context

The skills.sh ecosystem now supports 40+ AI coding agents. PromptScript currently supports 7 formatters (GitHub Copilot, Claude Code, Cursor, Antigravity, Factory AI, OpenCode, Gemini CLI). This plan adds formatters for the remaining agents from the skills.sh registry.

## Key Insight: MarkdownInstructionFormatter Base Class

The recent refactor (commit `1fbb71a`) extracted `MarkdownInstructionFormatter`, making new formatters trivial to add. Most agents follow the same pattern:
- Main instruction file (e.g., `AGENTS.md`, `INSTRUCTIONS.md`, or similar)
- Skills directory: `.<dotDir>/skills/<name>/SKILL.md`
- Commands directory: `.<dotDir>/commands/<name>.md`
- Optional agents directory

For agents that use the same markdown-based format, each formatter is just a constructor call (~15 lines).

## Agent Classification

### Tier 1 — High Priority (popular, well-documented agents)

| Agent | `--agent` ID | dotDir | Skills Path | Main File | Notes |
|-------|-------------|--------|-------------|-----------|-------|
| Windsurf | `windsurf` | `.windsurf` | `.windsurf/skills/` | `.windsurfrules` | Already in ROADMAP as planned |
| Cline | `cline` | `.agents` | `.agents/skills/` | `.clinerules` | Uses shared `.agents/` |
| Roo Code | `roo` | `.roo` | `.roo/skills/` | `.roorules` | Fork of Cline |
| Codex | `codex` | `.agents` | `.agents/skills/` | `AGENTS.md` | OpenAI agent |
| Continue | `continue` | `.continue` | `.continue/skills/` | `.continue/rules/` | Medium priority in ROADMAP |
| Cursor (skills.sh) | `cursor` | `.agents` | `.agents/skills/` | `.cursor/rules/` | Already implemented, verify path alignment |

### Tier 2 — Medium Priority (growing adoption)

| Agent | `--agent` ID | dotDir | Skills Path | Main File | Notes |
|-------|-------------|--------|-------------|-----------|-------|
| Augment | `augment` | `.augment` | `.augment/skills/` | `.augment/rules/` | |
| GitHub Copilot (skills.sh) | `github-copilot` | `.agents` | `.agents/skills/` | `.github/copilot-instructions.md` | Already implemented as `github` |
| Goose | `goose` | `.goose` | `.goose/skills/` | `.goose/rules/` | |
| Kilo Code | `kilo` | `.kilocode` | `.kilocode/skills/` | `.kilocode/rules/` | |
| Amp | `amp` | `.agents` | `.agents/skills/` | `.amp/rules/` | |
| Trae | `trae` | `.trae` | `.trae/skills/` | `.trae/rules/` | ByteDance agent |
| Junie | `junie` | `.junie` | `.junie/skills/` | `.junie/rules/` | JetBrains agent |
| Kiro CLI | `kiro-cli` | `.kiro` | `.kiro/skills/` | `.kiro/rules/` | AWS/Amazon agent |

### Tier 3 — Lower Priority (newer/niche agents)

| Agent | `--agent` ID | dotDir | Skills Path | Notes |
|-------|-------------|--------|-------------|-------|
| Cortex Code | `cortex` | `.cortex` | `.cortex/skills/` | Snowflake |
| Crush | `crush` | `.crush` | `.crush/skills/` | |
| Droid | `droid` | `.factory` | `.factory/skills/` | Same as Factory? Verify |
| Command Code | `command-code` | `.commandcode` | `.commandcode/skills/` | |
| Kode | `kode` | `.kode` | `.kode/skills/` | |
| MCPJam | `mcpjam` | `.mcpjam` | `.mcpjam/skills/` | |
| Mistral Vibe | `mistral-vibe` | `.vibe` | `.vibe/skills/` | |
| Mux | `mux` | `.mux` | `.mux/skills/` | |
| OpenHands | `openhands` | `.openhands` | `.openhands/skills/` | |
| Pi | `pi` | `.pi` | `.pi/skills/` | |
| Qoder | `qoder` | `.qoder` | `.qoder/skills/` | |
| Qwen Code | `qwen-code` | `.qwen` | `.qwen/skills/` | |
| Zencoder | `zencoder` | `.zencoder` | `.zencoder/skills/` | |
| Neovate | `neovate` | `.neovate` | `.neovate/skills/` | |
| Pochi | `pochi` | `.pochi` | `.pochi/skills/` | |
| AdaL | `adal` | `.adal` | `.adal/skills/` | |
| iFlow CLI | `iflow-cli` | `.iflow` | `.iflow/skills/` | |
| OpenClaw | `openclaw` | `skills` | `skills/` | No dot prefix |
| CodeBuddy | `codebuddy` | `.codebuddy` | `.codebuddy/skills/` | |
| Kimi Code CLI | `kimi-cli` | `.agents` | `.agents/skills/` | |
| Replit | `replit` | `.agents` | `.agents/skills/` | |
| Universal | `universal` | `.agents` | `.agents/skills/` | |
| Trae CN | `trae-cn` | `.trae` | `.trae/skills/` | Chinese variant |

## Implementation Steps

### Phase 1: Infrastructure (prep work)

#### Step 1.1: Research agent output formats
- [ ] For each Tier 1 agent, verify the exact main instruction file format by checking their official documentation
- [ ] Confirm whether each agent reads a single main file or directory-based rules
- [ ] Verify SKILL.md vs skill.md (case sensitivity) per agent
- [ ] Document which agents share the `.agents/` universal directory

#### Step 1.2: Update `TargetName` type and `DEFAULT_OUTPUT_PATHS`
**File:** `packages/core/src/types/config.ts`
- [ ] Add all new agent IDs to the `TargetName` union type
- [ ] Add all new default output paths to `DEFAULT_OUTPUT_PATHS`

#### Step 1.3: Update `FormatterName` and `ToolName` types
**Files:**
- `packages/formatters/src/parity-matrix.ts` — Add to `FormatterName`
- `packages/formatters/src/feature-matrix.ts` — Add to `ToolName`

### Phase 2: Tier 1 Formatters

#### Step 2.1: Windsurf formatter
**File:** `packages/formatters/src/formatters/windsurf.ts`
```typescript
export class WindsurfFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'windsurf',
      outputPath: '.windsurf/rules/project.md',
      description: 'Windsurf instructions (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Windsurf Rules',
      dotDir: '.windsurf',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: true,
      hasSkills: true,
    });
  }
}
```

#### Step 2.2: Cline formatter
**File:** `packages/formatters/src/formatters/cline.ts`
- dotDir: `.agents` (shared universal dir)
- Main file: `.clinerules` or `.cline/rules/`
- Skills: `.agents/skills/`

#### Step 2.3: Roo Code formatter
**File:** `packages/formatters/src/formatters/roo.ts`
- dotDir: `.roo`
- Skills: `.roo/skills/`

#### Step 2.4: Codex formatter
**File:** `packages/formatters/src/formatters/codex.ts`
- dotDir: `.agents` (shared universal dir)
- Skills: `.agents/skills/`

#### Step 2.5: Continue formatter
**File:** `packages/formatters/src/formatters/continue.ts`
- dotDir: `.continue`
- Skills: `.continue/skills/`

#### Step 2.6: Register Tier 1 formatters
**File:** `packages/formatters/src/index.ts`
- Import and register all Tier 1 formatters
- Export formatter classes and version types

### Phase 3: Tier 2 Formatters

Repeat the same pattern for: Augment, Goose, Kilo Code, Amp, Trae, Junie, Kiro CLI.
Each is a simple `MarkdownInstructionFormatter` subclass with appropriate config.

### Phase 4: Tier 3 Formatters (bulk add)

Many Tier 3 agents follow an identical pattern. Consider:
- [ ] A generic/configurable formatter factory for agents with standard markdown format
- [ ] Or individual tiny files (each ~15 lines) for each agent

The individual file approach is preferred for discoverability and type safety.

### Phase 5: Tests

#### Step 5.1: Unit tests per formatter
**Files:** `packages/formatters/src/__tests__/<agent>.spec.ts`
- [ ] Test simple, multifile, and full versions
- [ ] Verify output paths, headers, dotDir
- [ ] Test skill/command file generation

#### Step 5.2: Golden files
**Dir:** `packages/formatters/src/__tests__/__golden__/`
- [ ] Generate golden files for each new formatter (at least simple version)
- [ ] Add to `golden-files.spec.ts`

#### Step 5.3: Parity tests
**File:** `packages/formatters/src/__tests__/parity.spec.ts`
- [ ] Add new formatters to parity matrix
- [ ] Verify section extraction consistency

#### Step 5.4: Feature coverage matrix
**File:** `packages/formatters/src/feature-matrix.ts`
- [ ] Add feature specs for each new tool/agent

### Phase 6: Documentation Updates

#### Step 6.1: Formatter architecture guide
**File:** `docs/guides/formatter-architecture.md`
- [ ] Update Mermaid diagram to include new formatters
- [ ] Update the "Adding a New Formatter" section
- [ ] Add note about `MarkdownInstructionFormatter` making new agents trivial

#### Step 6.2: README / marketing
**File:** `README.md`
- [ ] Update the supported targets count (7 → 40+)
- [ ] Add a "Supported AI Agents" section or table
- [ ] Update the value proposition with the expanded agent count

#### Step 6.3: ROADMAP update
**File:** `ROADMAP.md`
- [ ] Move Windsurf, Cline, Continue from "Planned" to "Done"
- [ ] Add Tier 2/3 agents to the platform support table
- [ ] Update the status of platform support expansion

#### Step 6.4: Agents example docs
**File:** `docs/examples/agents.md`
- [ ] Add examples for new formatters
- [ ] Show how to target multiple agents in `promptscript.yaml`

#### Step 6.5: Package README
**File:** `packages/formatters/README.md`
- [ ] Update the list of supported formatters

### Phase 7: Playground Updates

#### Step 7.1: Add targets to playground store
**File:** `packages/playground/src/store.ts`
- [ ] Add new agents to the `FormatterName` type
- [ ] Add default target settings for each new agent
- [ ] Add file path patterns for output matching

#### Step 7.2: Update ConfigPanel
**File:** `packages/playground/src/components/ConfigPanel.tsx`
- [ ] Add new agents to the target selector with appropriate labels
- [ ] Group agents by tier/popularity for UX

#### Step 7.3: Update OutputPanel
**File:** `packages/playground/src/components/OutputPanel.tsx`
- [ ] Add output tabs for new formatters
- [ ] Consider a tab overflow/dropdown for 40+ targets

### Phase 8: Schema & Validation

#### Step 8.1: JSON Schema update
**File:** `schema/config.json`
- [ ] Add new agent names to the targets enum
- [ ] Add default output paths

#### Step 8.2: Skill sync check
- [ ] Run `pnpm skill:check` to verify SKILL.md copies are in sync
- [ ] Update skills compatibility list to include new agents

### Phase 9: Verification Pipeline

Run the full verification pipeline:
```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

## Suggested Implementation Order

1. **Phase 1** (Infrastructure) — Must be first
2. **Phase 2** (Tier 1) — 5 formatters, highest user impact
3. **Phase 5.1-5.3** (Tests for Tier 1) — Test before expanding
4. **Phase 9** (Verify) — Ensure pipeline passes
5. **Phase 3** (Tier 2) — 8 more formatters
6. **Phase 4** (Tier 3) — Remaining ~20 formatters
7. **Phase 5.4** (Feature matrix) — After all formatters done
8. **Phase 6** (Documentation) — Update docs
9. **Phase 7** (Playground) — Update UI
10. **Phase 8** (Schema) — Update schema
11. **Phase 9** (Final verify) — Full pipeline pass

## Risks & Considerations

1. **Agent format verification**: Some agents' exact file formats are undocumented. Need to verify by testing with actual agents or checking their source code.
2. **Shared `.agents/` directory**: Multiple agents (Amp, Kimi CLI, Replit, Universal, Cline, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode) share `.agents/skills/`. Need to handle this correctly — one compilation may need to write to both agent-specific AND shared directories.
3. **Playground UX**: With 40+ formatters, the ConfigPanel needs grouping or filtering. A dropdown/search or categorized view may be needed.
4. **Parity testing scale**: 40+ formatters in parity matrix means O(n²) test combinations. Consider testing parity within tier groups instead of all-against-all.
5. **Factory vs Droid**: Factory AI uses `.factory/` directory, and Droid also uses `.factory/`. Need to verify if these are the same tool or aliases.
6. **Trae vs Trae CN**: Same project path `.trae/skills/` but different global paths. May need a single formatter with locale config.
