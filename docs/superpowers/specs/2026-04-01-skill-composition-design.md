# Skill Composition — Design Spec

**Date:** 2026-04-01
**Status:** Draft
**Issue:** #200
**Depends on:** #199 (skill overlay/extends — Phase 1 MVP, implemented)
**Version:** 2.0 (po 10 iteracjach weryfikacji)

---

## Table of Contents

1. [Problem](#1-problem)
2. [Design Decisions Summary](#2-design-decisions-summary)
3. [Solution Overview](#3-solution-overview)
4. [Syntax](#4-syntax)
5. [Sub-Skill File Format](#5-sub-skill-file-format)
6. [Resolution Semantics](#6-resolution-semantics)
7. [Resulting AST](#7-resulting-ast)
8. [Contract Validation (Hybrid)](#8-contract-validation-hybrid)
9. [Parser Changes](#9-parser-changes)
10. [Core Type Changes](#10-core-type-changes)
11. [Resolver Changes](#11-resolver-changes)
12. [Validator Changes](#12-validator-changes)
13. [Compiler Changes](#13-compiler-changes)
14. [Formatter Changes](#14-formatter-changes)
15. [Syntax Highlighter Changes](#15-syntax-highlighter-changes)
16. [Playground Changes](#16-playground-changes)
17. [SKILL.md / Native Skill Support](#17-skillmd--native-skill-support)
18. [CLI Changes](#18-cli-changes)
19. [Security Constraints](#19-security-constraints)
20. [Edge Cases](#20-edge-cases)
21. [Interaction with Existing Features](#21-interaction-with-existing-features)
22. [Error Handling](#22-error-handling)
23. [Backward Compatibility](#23-backward-compatibility)
24. [Testing Strategy](#24-testing-strategy)
25. [Examples](#25-examples)
26. [Implementation Phases](#26-implementation-phases)
27. [Glossary](#27-glossary)

---

## 1. Problem

Complex enterprise skills have distinct operational phases (e.g., a production ops skill with health scan, triage, diagnosis, and code fix phases). Today, all logic must live in a single `.prs` file or `SKILL.md`, which becomes unwieldy as complexity grows. There is no mechanism to:

- Compose a skill from multiple sub-skill files
- Let each phase define its own context blocks (`@knowledge`, `@restrictions`, `@standards`)
- Reuse phases across multiple parent skills
- Test phases independently
- Assign phase ownership to different teams

### Real-World Use Case

An `/ops` skill for production triage with:

1. **Health Scan** — runs 5 MCP tool checks in parallel
2. **Triage & Diagnosis** — classifies and groups findings
3. **Code Fix** — locates code, creates branch, writes fix, creates PR
4. **Mode switching** — manual (interactive) vs cron (unattended) behavior

Each phase has its own logic, thresholds, decision trees, allowed tools, and security boundaries.

### Relationship to Existing Features

| Feature | Axis | Relationship |
|---|---|---|
| Skill overlay/extends (#199) | Layers across registries | Complementary — overlays layer across org levels, composition assembles within one skill |
| Skill folders (#117) | Shared resources | Complementary — folders share static files, composition imports behavior |
| Recursive skill discovery (#162) | Discovery | Related — discovery finds skills, composition explicitly imports parts |

---

## 2. Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Composition model | Orchestrator of sub-phases | Enterprise: independent testing, team ownership, security boundaries, reusability |
| Contracts | Hybrid (optional `inputs`/`outputs`) | Progressive adoption — simple skills stay simple, complex get safety |
| Syntax | `@use` inside `@skill` block | Reuses existing primitive, consistent language, no new keywords |
| Sub-skill format | Full `.prs` file | Self-contained, independently testable, compilable, validatable |
| Implementation | Resolver flat + `composedFrom` metadata | Minimal changes, preserves phase provenance, upgrade path to first-class phases |

---

## 3. Solution Overview

Allow `@use` directives inside `@skills` block entries. Each `@use` imports a full `.prs` file, extracts its skill definition and context blocks, and flattens them into the parent skill as labeled phases. The resolver produces a flat skill with `composedFrom` metadata tracking phase provenance.

```
┌─────────────────────────────────────────────┐
│ ops.prs (@skills block)                     │
│                                             │
│  @use ./phases/health-scan ─────────────┐   │
│  @use ./phases/triage(severity: "crit") │   │
│  @use ./phases/code-fix as autofix ─────┘   │
│                                             │
│  (parent description, orchestration logic)  │
└─────────────────────────────────────────────┘
          │ Resolver flattens
          ▼
┌─────────────────────────────────────────────┐
│ Flat Skill AST                              │
│                                             │
│  description: "Production triage..."        │
│  content: [phase headers + instructions]    │
│  allowedTools: [union of all phases]        │
│  composedFrom: [phase1, phase2, phase3]     │
└─────────────────────────────────────────────┘
```

---

## 4. Syntax

### 4.1 `@use` Inside `@skills` Block

```text
@meta {
  id: "ops"
  syntax: "1.1.0"
}

@skills {
  ops: {
    description: "Production triage for Chmurka.pl"
    content: """
      You are a production triage orchestrator. Follow the phases below
      in order. Switch between manual and cron mode based on context.
    """

    @use ./phases/health-scan
    @use ./phases/triage(severity: "critical")
    @use ./phases/code-fix as autofix
  }
}
```

### 4.2 `@use` Variants Inside Skills

All existing `@use` features work inside skill blocks:

```text
@skills {
  ops: {
    description: "..."

    # Relative path
    @use ./phases/health-scan

    # With parameters
    @use ./phases/triage(severity: "critical", timeout: 30)

    # With alias (used in phase naming)
    @use ./phases/code-fix as autofix

    # Registry path
    @use @shared/phases/monitoring

    # With block filtering
    @use ./phases/health-scan(only: [skills, knowledge])
  }
}
```

### 4.3 What `@use` Does NOT Support Inside Skills

- **`@use` cannot import non-skill files** — the target `.prs` must contain a `@skills` block with at least one skill definition. Files with only `@standards` or `@knowledge` are not valid sub-skills.
- **`@extend` inside skill blocks** — not supported. Use `@extend` at top level to modify composed skills after resolution.
- **Nested `@use` depth > 3** — prevented by recursion limit (see [Security Constraints](#19-security-constraints)).

---

## 5. Sub-Skill File Format

A sub-skill is a **standard `.prs` file** — independently compilable, testable, and validatable.

### 5.1 Minimal Sub-Skill

```text
# ./phases/health-scan.prs
@meta {
  id: "health-scan"
  syntax: "1.1.0"
}

@skills {
  health-scan: {
    description: "Run MCP health checks in parallel"
    allowedTools: ["mcp__monitoring__check_cpu", "mcp__monitoring__check_memory"]
    content: """
      Run all health checks in parallel. Report structured findings.
    """
  }
}
```

### 5.2 Sub-Skill with Context Blocks

```text
# ./phases/triage.prs
@meta {
  id: "triage"
  syntax: "1.1.0"
  params: {
    severity: string = "all"
  }
}

@knowledge {
  thresholds: {
    cpu_critical: 90
    memory_critical: 95
    error_rate_critical: 10
  }
  severity_levels: ["info", "warning", "critical", "fatal"]
}

@restrictions {
  - "Never escalate without evidence from at least 2 independent checks"
  - "Never classify severity higher than {{severity}} threshold"
}

@standards {
  classification: {
    """
    Always group findings by service, then by severity.
    Use structured output for downstream phases.
    """
  }
}

@skills {
  triage: {
    description: "Classify and group health findings by severity"
    inputs: {
      findings: { type: "string", description: "Health check findings from scan phase" }
    }
    outputs: {
      classification: { type: "string", description: "Grouped findings by severity" }
    }
    content: """
      Classify all findings. Group by service, then by severity.
      Only include findings at or above {{severity}} level.
    """
  }
}
```

### 5.3 Sub-Skill Selection Rule

When a sub-skill file contains multiple skill definitions in `@skills`, the resolver uses:

1. **Exact name match** — if the filename (without extension) matches a skill name, use that
2. **First skill** — if no name match, use the first skill defined in the `@skills` block
3. **Error** — if `@skills` block is empty or missing, emit `ResolveError`

### 5.4 Context Block Extraction

The following blocks are extracted from sub-skill files and composed into the parent:

| Block | Behavior |
|---|---|
| `@knowledge` | Content appended under phase section header |
| `@restrictions` | Items appended under phase section header |
| `@standards` | Content appended under phase section header |
| `@context` | Merged into parent `@context` (if parent has one) |
| `@identity` | **Ignored** — parent skill defines identity |
| `@guards` | **Ignored** — guards operate at project level, not per-phase |
| `@shortcuts` | **Ignored** — shortcuts are UI-level, not phase-level |
| `@commands` | **Ignored** — commands are separate from skill composition |
| `@agents` | **Ignored** — agents are separate from skill composition |

**Rationale for ignored blocks:** Composition is about assembling skill *behavior*, not redefining project-level configuration. A sub-skill's `@identity` would conflict with the parent's identity. Guards, shortcuts, commands, and agents are orthogonal concerns.

---

## 6. Resolution Semantics

### 6.1 Phase Ordering

Phases are resolved in **declaration order** (top to bottom in the parent skill). This order is:

- Deterministic (same input → same output)
- Reflected in the flattened `content` (phase sections appear in order)
- Reflected in `composedFrom` array (index = declaration position)

### 6.2 Property Merging Strategy

When composing phases into the parent skill:

| Property | Strategy | Details |
|---|---|---|
| `content` | **Append** | Each phase's content becomes a labeled section; parent content appears first as orchestration instructions |
| `description` | **Parent wins** | Parent description is authoritative (it's the orchestrator) |
| `allowedTools` | **Union** | Tools from all phases + parent combined (deduplicated) |
| `references` | **Concat** | All phase references concatenated with parent's |
| `examples` | **Concat** | All phase examples concatenated |
| `requires` | **Concat** | All phase requirements concatenated (deduplicated) |
| `params` | **Ignore** | Phase params are consumed during resolution (via `@use` param args); not merged into parent |
| `inputs` | **First phase inputs** | Phase 1 inputs become parent inputs (entry point) |
| `outputs` | **Last phase outputs** | Last phase outputs become parent outputs (exit point) |
| `trigger` | **Parent wins** | Only parent defines trigger |
| `userInvocable` | **Parent wins** | Only parent defines invocability |
| `disableModelInvocation` | **Parent wins** | Only parent defines this |
| `context` | **Parent wins** | Only parent defines context mode |
| `agent` | **Parent wins** | Only parent defines agent |

### 6.3 Content Flattening

The resolver produces a single `content` TextContent by concatenating:

```
[Parent content - orchestration instructions]

---

## Phase 1: health-scan
<!-- composed-from: ./phases/health-scan.prs -->

### Knowledge
[content from @knowledge block]

### Restrictions
[items from @restrictions block]

### Standards
[content from @standards block]

### Instructions
[content from skill definition]

---

## Phase 2: triage
<!-- composed-from: ./phases/triage.prs -->
...

---

## Phase 3: autofix
<!-- composed-from: ./phases/code-fix.prs -->
...
```

Phase name is determined by:
1. Alias (if `@use ... as alias`) → alias name
2. Skill name from the sub-skill file → skill name

### 6.4 Parameter Resolution

Parameters passed via `@use ./phases/triage(severity: "critical")` are resolved **before** composition:

1. Resolver loads `./phases/triage.prs`
2. Applies parameter binding: `{{severity}}` → `"critical"` in all content
3. Extracts the resolved skill definition and context blocks
4. Composes into parent

This reuses the existing `bindParams()` infrastructure.

---

## 7. Resulting AST

### 7.1 ComposedPhase Type

```typescript
interface ComposedPhase {
  /** Phase name (alias or skill name) */
  name: string;
  /** Source file path */
  source: string;
  /** Alias if @use ... as alias was used */
  alias?: string;
  /** Extracted inputs contract (if defined) */
  inputs?: Record<string, SkillContractField>;
  /** Extracted outputs contract (if defined) */
  outputs?: Record<string, SkillContractField>;
  /** Context blocks that were composed */
  composedBlocks: string[];
}
```

### 7.2 Extended SkillDefinition

```typescript
export interface SkillDefinition {
  // ... existing properties unchanged ...

  /** Metadata about composed phases (set by resolver, not by user) */
  composedFrom?: ComposedPhase[];
}
```

### 7.3 Example Resolved AST

After resolving the `/ops` example, the AST contains:

```typescript
{
  // Standard skill properties
  description: "Production triage for Chmurka.pl",
  content: {
    type: "TextContent",
    value: "You are a production triage orchestrator...\n\n---\n\n## Phase 1: health-scan\n..."
  },
  allowedTools: [
    "mcp__monitoring__check_cpu",
    "mcp__monitoring__check_memory",
    "mcp__triage__classify",
    "Bash", "Read", "Write"
  ],
  inputs: {
    services: { type: "string", description: "Services to check" }
  },
  outputs: {
    pr_url: { type: "string", description: "URL of the created PR" }
  },
  references: [
    "./phases/references/runbooks.md",
    "./phases/references/architecture.md"
  ],

  // Composition metadata
  composedFrom: [
    {
      name: "health-scan",
      source: "./phases/health-scan.prs",
      inputs: {},
      outputs: { findings: { type: "string", description: "Health findings" } },
      composedBlocks: ["knowledge"]
    },
    {
      name: "triage",
      source: "./phases/triage.prs",
      inputs: { findings: { type: "string", description: "Health check findings" } },
      outputs: { classification: { type: "string", description: "Grouped findings" } },
      composedBlocks: ["knowledge", "restrictions", "standards"]
    },
    {
      name: "autofix",
      source: "./phases/code-fix.prs",
      alias: "autofix",
      inputs: { classification: { type: "string", description: "Classified findings" } },
      outputs: { pr_url: { type: "string", description: "URL of created PR" } },
      composedBlocks: ["restrictions"]
    }
  ]
}
```

---

## 8. Contract Validation (Hybrid)

### 8.1 Design Philosophy

Contracts in LLM skill context are **documentation, not runtime enforcement**. Skills produce natural language, not typed data. The value of contracts is:

1. **Team communication** — contract = interface spec between phase owners
2. **Compilation warnings** — "phase X outputs `findings`, but phase Y doesn't declare input `findings`"
3. **Self-documentation** — new dev reads contract and understands phase expectations

### 8.2 Behavior

Contracts are **optional**. When defined:

- **Matched by name** — output `findings` from phase 1 matches input `findings` of phase 2
- **Chain validation** — validator checks sequential pairs (phase N outputs → phase N+1 inputs)
- **Unmatched warning** — unused output or unmatched input emits `warning` (not error)
- **Type mismatch warning** — output type `string` vs input type `number` emits `warning`
- **No contracts** — no warnings, skill composes normally

### 8.3 Contract Chain Example

```
health-scan
  outputs: { findings: string }
      │
      ▼ match by name ✓
triage
  inputs:  { findings: string }
  outputs: { classification: string }
      │
      ▼ match by name ✓
code-fix
  inputs:  { classification: string }
  outputs: { pr_url: string }
```

Warnings emitted:
- None — all contracts match

If `triage` didn't declare `inputs.findings`:
- `⚠ PS028: Phase 'triage' does not declare input 'findings' which is output by preceding phase 'health-scan'`

### 8.4 When Contracts Don't Apply

- Single-phase skill → no chain to validate
- Phase without `inputs`/`outputs` → treated as uncontracted, no warnings for that link
- Non-sequential composition (future) → contract validation skipped

---

## 9. Parser Changes

### 9.1 Grammar Modification

The `blockContent` rule must allow `@use` directives alongside existing content types. Current rule:

```typescript
// Current (parser.ts:141-149)
private blockContent = this.RULE('blockContent', () => {
  this.MANY(() =>
    this.OR([
      { ALT: () => this.CONSUME(TextBlock) },
      { ALT: () => this.SUBRULE(this.restrictionItem) },
      { ALT: () => this.SUBRULE(this.field) },
    ])
  );
});
```

Modified rule:

```typescript
// New
private blockContent = this.RULE('blockContent', () => {
  this.MANY(() =>
    this.OR([
      { ALT: () => this.CONSUME(TextBlock) },
      { ALT: () => this.SUBRULE(this.restrictionItem) },
      { ALT: () => this.SUBRULE(this.inlineUse) },
      { ALT: () => this.SUBRULE(this.field) },
    ])
  );
});
```

### 9.2 New `inlineUse` Rule

```typescript
/**
 * inlineUse
 *   : '@' 'use' pathRef paramCallList? ('as' Identifier)?
 *
 * Same syntax as top-level useDecl but allowed within block content.
 */
private inlineUse = this.RULE('inlineUse', () => {
  this.CONSUME(At);
  this.CONSUME(Use);
  this.SUBRULE(this.pathRef);
  this.OPTION(() => this.SUBRULE(this.paramCallList));
  this.OPTION2(() => {
    this.CONSUME(As);
    this.CONSUME(Identifier);
  });
});
```

### 9.3 CST Visitor Changes

The CST visitor must recognize `inlineUse` nodes within `blockContent` and produce `InlineUseDeclaration` AST nodes.

### 9.4 AST Node

```typescript
interface InlineUseDeclaration {
  type: 'InlineUse';
  path: PathReference;
  params?: ParamArgument[];
  alias?: string;
  loc: SourceLocation;
}
```

This node is stored on `ObjectContent` (skill body) as a new property:

```typescript
interface ObjectContent {
  type: 'ObjectContent';
  properties: Record<string, Value>;
  inlineUses?: InlineUseDeclaration[];  // NEW
  loc: SourceLocation;
}
```

### 9.5 Language Extension Note

This feature introduces a genuinely **new syntactic form** — directives inside block content. Today, no `@` directive (`@inherit`, `@use`, `@extend`) appears inside block bodies; they are all top-level. The `inlineUse` rule shares the `@use` keyword but is a separate parser rule producing a different AST node (`InlineUseDeclaration` vs `UseDeclaration`). The CST visitor needs a new `inlineUse()` method, and the `BlockContentCstCtx` type needs `inlineUse?: CstNode[]` added.

### 9.6 Disambiguation: `@use` vs `@` field key

In `blockContent`, the parser encounters `@` and must decide between `inlineUse` and a regular `field`. The disambiguation uses GATE:

- If `@` is followed by `Use` token → `inlineUse`
- Otherwise → fall through to `field`

This is unambiguous because `@` followed by `Use` can only be `@use` — there is no field syntax that starts with `@use`.

**Note:** Actually, `blockContent` alternatives start with different tokens: `TextBlock`, `Dash` (restriction), `@` + `Use` (inlineUse), and `Identifier`/`StringLiteral`/etc. (field). The `@` token is not currently a valid start for `field`, so there's no ambiguity. The `inlineUse` alternative should be placed **before** `field` in the OR to ensure correct matching.

**Correction:** Looking at the grammar more carefully, `blockContent` currently has three alternatives: `TextBlock`, `restrictionItem` (starts with `Dash`), and `field` (starts with `Identifier`/`StringLiteral`/`StringType`/`NumberType`/`BooleanType`). None of these start with `At`. So adding `inlineUse` (which starts with `At`) introduces zero ambiguity — Chevrotain's LL(k) lookahead resolves it trivially by the first token.

---

## 10. Core Type Changes

### 10.1 New Types in `packages/core/src/types/ast.ts`

```typescript
/** Inline @use declaration within a skill block body */
export interface InlineUseDeclaration {
  type: 'InlineUse';
  /** Path to the sub-skill file */
  path: PathReference;
  /** Template parameters */
  params?: ParamArgument[];
  /** Alias for the phase */
  alias?: string;
  /** Source location */
  loc: SourceLocation;
}

/** Metadata about a composed phase in a skill */
export interface ComposedPhase {
  /** Phase name (alias or skill name) */
  name: string;
  /** Source file path */
  source: string;
  /** Alias if provided */
  alias?: string;
  /** Inputs contract */
  inputs?: Record<string, SkillContractField>;
  /** Outputs contract */
  outputs?: Record<string, SkillContractField>;
  /** Which context blocks were composed from this phase */
  composedBlocks: string[];
}
```

### 10.2 Modified Types

```typescript
// ObjectContent — add optional inlineUses
export interface ObjectContent {
  type: 'ObjectContent';
  properties: Record<string, Value>;
  inlineUses?: InlineUseDeclaration[];  // NEW
  loc: SourceLocation;
}

// SkillDefinition — add optional composedFrom
export interface SkillDefinition {
  // ... existing properties ...
  composedFrom?: ComposedPhase[];  // NEW
}
```

**Design notes:**

- `inlineUses` is intentionally unrestricted at the type level — it lives on `ObjectContent` which is shared across all block types (`@skills`, `@standards`, etc.) because the parser's `blockContent` rule is shared. The **validator** (PS027) enforces the semantic constraint that inline `@use` is only meaningful within `@skills` blocks.
- `inlineUses` is an **ephemeral property** consumed by `resolveSkillComposition()`. After resolution, the property is deleted from the `ObjectContent` node. The `deepClone()` utility handles it transparently via generic object-key iteration.
- `composedFrom` is **resolver-generated metadata**, not user-authored content. It is analogous to how `references` paths are resolved. Formatters should NOT serialize `composedFrom` into output — it is internal metadata for validator and debugging use.
- `interpolateContent()` in `template.ts` uses spread-based cloning for `ObjectContent`, which naturally carries `inlineUses` through. However, template variable interpolation must also process `inlineUses[].params` values — the implementation should apply `bindParams()` to inline use parameters during template resolution.

### 10.3 Exports

New types must be exported from `packages/core/src/types/index.ts` and `packages/core/src/index.ts`.

---

## 11. Resolver Changes

### 11.1 New Function: `resolveSkillComposition()`

**Location:** `packages/resolver/src/skill-composition.ts` (new file)

```typescript
/**
 * Resolve inline @use declarations within skill definitions.
 *
 * For each @skills block entry that contains InlineUseDeclaration nodes:
 * 1. Load and parse each referenced .prs file
 * 2. Apply parameter bindings
 * 3. Extract skill definition + context blocks
 * 4. Flatten into parent skill content with phase headers
 * 5. Merge allowedTools (union), references (concat), etc.
 * 6. Build composedFrom metadata
 *
 * @param ast - Program AST with potential inline uses in skill blocks
 * @param loadFile - File loader function
 * @param options - Resolution options (base path, registry config, etc.)
 * @returns Program with compositions resolved
 */
export function resolveSkillComposition(
  ast: Program,
  loadFile: FileLoader,
  options: ResolveOptions
): Program;
```

### 11.2 Composition Pipeline

```
1. Find @skills blocks in AST
2. For each skill definition:
   a. Check for inlineUses[]
   b. If empty → skip (no composition)
   c. For each inlineUse:
      i.   Resolve path (relative / registry)
      ii.  Load and parse .prs file
      iii. Check recursion depth (max 3)
      iv.  Recursively resolve composition in sub-skill (sub-skills can compose too)
      v.   Apply parameter bindings
      vi.  Extract: skill definition, @knowledge, @restrictions, @standards, @context
      vii. Generate phase content section
   d. Flatten all phases into parent skill
   e. Build composedFrom metadata
   f. Remove inlineUses from ObjectContent (they're consumed)
3. Return modified AST
```

### 11.3 Integration Point in Resolver Pipeline

```
normalizeBlockAliases()    → block alias normalization
resolveInherit()           → parent template binding
resolveImports()           → top-level @use (block imports)
resolveSkillComposition()  → NEW: inline @use within skills
applyExtends()             → @extend blocks (can modify composed skills)
resolveGuardRequires()     → guard dependency resolution
resolveNativeSkills()      → SKILL.md loading + reference resolution
resolveNativeCommands()    → command auto-discovery
resolveNativeAgents()      → agent auto-discovery
```

**Critical ordering:** `resolveSkillComposition()` must run AFTER `resolveImports()` (because a skill might import phases from registries via top-level `@use`) and BEFORE `applyExtends()` (because `@extend` should be able to modify composed skills). The function needs access to the `Resolver` instance's caching and resolution infrastructure — it should be implemented as a method on the `Resolver` class (or receive the resolver as a dependency) to enable recursive `this.resolve()` calls for sub-skill files.

### 11.4 File Loading and Caching

Sub-skill files are loaded using the same `FileLoader` interface as top-level `@use`. File loading is cached — if the same sub-skill is used by multiple parent skills, it's parsed once.

### 11.5 Cycle Detection

The resolver maintains a **resolution stack** (set of file paths currently being resolved). If a sub-skill's path is already on the stack, emit `ResolveError`:

```
ResolveError: Circular skill composition detected: ops.prs → health-scan.prs → ops.prs
```

---

## 12. Validator Changes

### 12.1 New Rule: `PS027: valid-skill-composition`

**Location:** `packages/validator/src/rules/valid-skill-composition.ts`

**Important:** Some composition checks happen at **resolve time** (resolver errors), others at **validate time** (validator warnings on the resolved AST). The table below marks the responsible component.

| Check | Severity | Owner | Message |
|---|---|---|---|
| Sub-skill file not found | error | **Resolver** | `ResolveError: Sub-skill file not found: {path}` |
| Sub-skill file missing `@skills` block | error | **Resolver** | `ResolveError: Sub-skill '{path}' does not contain a @skills block` |
| Sub-skill file has empty `@skills` block | error | **Resolver** | `ResolveError: Sub-skill '{path}' has no skill definitions` |
| Circular composition | error | **Resolver** | `ResolveError: Circular skill composition: {chain}` |
| Depth > 3 levels | error | **Resolver** | `ResolveError: Composition depth exceeds maximum of 3 levels at '{path}'` |
| Total content > 256KB | error | **Resolver** | `ResolveError: Composed content exceeds 256KB limit` |
| Duplicate phase name | error | **Validator** | `Duplicate phase name 'health-scan' in skill 'ops'` |
| Phase name conflicts with parent skill name | error | **Validator** | `Phase name 'ops' conflicts with parent skill name` |
| `@use` in non-skills block | warning | **Validator** | `Inline @use is only supported within @skills blocks; ignored in @standards` |
| Phase count > 20 (final flattened count) | warning | **Validator** | `Skill 'ops' composes 25 phases; maximum recommended is 20` |
| Phase adds tools not in parent | warning | **Validator** | `Phase 'autofix' adds tool 'Bash' not declared by parent skill 'ops'` |
| Empty phase (no content or context) | info | **Validator** | `Phase 'x' from './x.prs' has no content or context blocks` |

### 12.2 New Rule: `PS028: skill-contract-chain`

**Location:** `packages/validator/src/rules/skill-contract-chain.ts`

| Check | Severity | Message |
|---|---|---|
| Output name unmatched by next phase input | warning | `Phase 'health-scan' output 'findings' is not declared as input by next phase 'triage'` |
| Input name unmatched by previous phase output | warning | `Phase 'triage' input 'findings' is not provided by previous phase 'health-scan'` |
| Type mismatch in chain | warning | `Phase 'triage' input 'count' expects type 'number' but 'health-scan' output 'count' is type 'string'` |
| First phase has inputs without parent providing them | info | `Phase 'health-scan' declares inputs; these become the composed skill's inputs` |
| Last phase has outputs | info | `Phase 'code-fix' declares outputs; these become the composed skill's outputs` |

### 12.3 Modified Rule: `PS021: valid-use-params`

Must recognize that `@use` inside skill blocks uses the same parameter validation as top-level `@use`.

---

## 13. Compiler Changes

**No changes required.** The compiler operates on the resolved AST, which is a flat skill after composition. The `composedFrom` metadata is pass-through — the compiler doesn't need to interpret it.

The compilation pipeline remains:

```
parse → resolve (includes composition) → validate → format
```

---

## 14. Formatter Changes

### 14.1 Provenance Comments

Formatters that support provenance can use `composedFrom` metadata to emit composition info:

```markdown
<!-- skill: ops -->
<!-- composed from: ./phases/health-scan.prs, ./phases/triage.prs, ./phases/code-fix.prs -->
```

This is **optional** and non-breaking — formatters that don't check `composedFrom` still work because the skill content is already flattened.

### 14.2 References from Sub-Skills

References declared in sub-skill files are already concatenated into the parent's `references` array during resolution. Formatters emit them using existing `references/` infrastructure (directory or inline mode). Each reference retains provenance via the standard `<!-- from: ... -->` comment.

### 14.3 Formatter-Specific Behavior

| Formatter | Behavior |
|---|---|
| Claude (directory) | Emits composed skill as single SKILL.md with phase sections |
| GitHub (multifile) | Same — single instruction file with phase sections |
| Cursor (single-file) | Phase sections inline in `.cursorrules` |
| All others | Phase sections inline in output — no formatter-specific changes needed |

**No formatter interface changes required.** Composition is transparent to formatters.

---

## 15. Syntax Highlighter Changes

Per CLAUDE.md `keepInSync` rule, all three syntax highlighters must be updated to recognize `@use` within block content (not just at top-level):

### 15.1 Pygments Lexer

**File:** `docs_extensions/promptscript_lexer.py`

**Change required.** The Pygments lexer uses state-based tokenization. The `@use` pattern is matched in the `root` state but NOT in the `block` state. Inside `{...}` content, `@use` would be treated as generic text rather than a directive. The `block` state must be updated to include a `@use` pattern matching the root-level pattern.

### 15.2 VS Code TextMate Grammar

**File:** `apps/vscode/syntaxes/promptscript.tmLanguage.json`

Verify that the `@use` pattern is not anchored to line-start or top-level scope. If it is, add a pattern within the block-content scope that matches `@use`.

### 15.3 Playground Monaco Language

**File:** `packages/playground/src/utils/prs-language.ts`

The Monaco tokenizer rules for `@use` should already work inside blocks since Monaco typically tokenizes by pattern, not by structural position. **Verify** this.

---

## 16. Playground Changes

### 16.1 New Example

Add a "Skill Composition" example to the playground dropdown (`packages/playground/src/store.ts`):

```text
@meta {
  id: "ops-example"
  syntax: "1.1.0"
}

@skills {
  ops: {
    description: "Production triage orchestrator"
    userInvocable: true
    content: """
      You orchestrate production triage in three phases:
      1. Health Scan - check all services
      2. Triage - classify findings by severity
      3. Code Fix - create automated fixes

      Run phases in order. In cron mode, skip interactive prompts.
    """

    @use ./phases/health-scan
    @use ./phases/triage(severity: "critical")
    @use ./phases/code-fix as autofix
  }
}
```

**Note:** The playground compiles in-browser and may not support file-system `@use` resolution. Options:
1. Show composition syntax with a note "requires file system" (simplest)
2. Implement mock file resolution in playground for predefined examples
3. Defer playground support to Phase 2

**Recommendation:** Option 1 for MVP — show the syntax, note the limitation.

---

## 17. SKILL.md / Native Skill Support

> **Implementation: Phase 2.** This section specifies the design for native SKILL.md composition. It is documented here for completeness but is NOT part of Phase 1 scope. See section 26 for phase breakdown.

### 17.1 Composition in SKILL.md Frontmatter

Native skills (SKILL.md) can declare composition via a `phases` frontmatter field:

```yaml
---
name: ops
description: Production triage orchestrator
phases:
  - path: ./phases/health-scan.md
  - path: ./phases/triage.md
    params:
      severity: critical
  - path: ./phases/code-fix.md
    alias: autofix
---

Orchestration instructions here...
```

**Phase files** referenced from SKILL.md are themselves SKILL.md files (not `.prs`), following the same resolution semantics.

### 17.2 Resolution in `resolveNativeSkills()`

When `parseFrontmatterFields()` encounters a `phases` field:

1. Parse each phase entry (path, optional params, optional alias)
2. Load and parse each referenced SKILL.md
3. Apply same composition logic as `.prs` inline `@use`
4. Build `composedFrom` metadata

### 17.3 Phase Path Resolution

Phase paths in SKILL.md are resolved relative to the SKILL.md file location:

```
.promptscript/skills/ops/
  SKILL.md                    ← parent
  phases/
    health-scan/SKILL.md      ← phase (./phases/health-scan.md resolves here)
    triage/SKILL.md
    code-fix/SKILL.md
```

---

## 18. CLI Changes

### 18.1 `prs validate`

No CLI changes — composition validation happens automatically via PS027 and PS028 rules.

**`--strict` mode:** Under `prs validate --strict`, all composition warnings (PS027 phase count >20, PS027 `@use` in non-skills block, PS028 contract chain mismatches) are promoted to errors and block compilation. This is consistent with existing `--strict` behavior where all warnings become errors.

### 18.2 `prs compile`

No CLI changes — composition is resolved transparently by the resolver.

### 18.3 `prs inspect` (Phase 2)

Future command for debugging composition:

```bash
prs inspect ops --phases
# Output:
# Skill: ops (3 phases)
#   Phase 1: health-scan (./phases/health-scan.prs)
#     allowedTools: mcp__monitoring__check_cpu, mcp__monitoring__check_memory
#     outputs: findings
#   Phase 2: triage (./phases/triage.prs)
#     inputs: findings
#     outputs: classification
#   Phase 3: autofix (./phases/code-fix.prs)
#     inputs: classification
#     outputs: pr_url
```

---

## 19. Security Constraints

### 19.1 Recursion Depth Limit

**Maximum composition depth: 3 levels.**

```
ops.prs → health-scan.prs → sub-check.prs → leaf.prs    ✓ (depth 3)
ops.prs → health-scan.prs → sub.prs → deep.prs → x.prs  ✗ (depth 4)
```

### 19.2 Cycle Detection

Maintained via resolution stack. Cycles are hard errors (`ResolveError`).

### 19.3 Phase Count Limit

**Maximum 20 phases per skill.** Exceeding emits a warning (PS027), not an error, because legitimate use cases (large orchestration) may exceed this.

### 19.4 Path Traversal Protection

Reuses existing `isSafeRelativePath()` from the resolver. Sub-skill paths must not contain `..` segments that escape the project root.

### 19.5 Resource Budgets

Sub-skill reference files count toward the parent skill's resource budget:
- `MAX_RESOURCE_SIZE` (1MB/file)
- `MAX_TOTAL_RESOURCE_SIZE` (10MB total across all phases)
- `MAX_RESOURCE_COUNT` (100 files total across all phases)

### 19.6 Trust Model

**Sub-skill files are trusted code.** The parent skill author trusts all composed sub-skills to declare their own tools, restrictions, and content. Only compose from registries you control or have reviewed.

Implications:
- A sub-skill can introduce `allowedTools` that the parent didn't explicitly list (union semantics). The validator emits an **audit warning** (PS027): `"Phase 'autofix' adds tool 'Bash' not declared by parent skill 'ops'"` to surface this.
- A sub-skill's content could theoretically contain prompt injection ("ignore previous instructions"). This is mitigated by the trust boundary: sub-skills come from controlled registries.
- Content safety rules (PS026) apply only to `references` files, not to `.prs` phase files (which are code, not data).

### 19.7 Restriction Precedence

Parent restrictions always take precedence over phase restrictions. To enforce this in the flattened output, the resolver emits content in this order:

```
[Parent content - orchestration instructions]
[Parent @restrictions - repeated at top as "Global Restrictions"]

---
## Phase 1: ...
### Phase Restrictions
[phase-specific restrictions]
### Instructions
[phase content]

---
## Phase 2: ...
...

---
## Global Restrictions (repeated at end for emphasis)
[Parent @restrictions again]
```

The parent's restrictions appear **both before and after** all phase content, giving them first-and-last-position authority in the prompt. This prevents a phase from overriding parent restrictions with its own content.

### 19.8 Total Composed Content Limit

**Maximum flattened content size: 256KB.** After resolving all phases and flattening content, if the total text exceeds 256KB, emit `ResolveError`. This prevents adversarial composition (20 phases × 3 depth = up to 400 phase sections) from producing unusably large prompts.

### 19.9 Content Safety

Sub-skill `.prs` files are parsed as PRS — they're code, not data. Content safety rules (PS026) apply only to `references` files, not to `.prs` phase files.

---

## 20. Edge Cases

### 20.1 Empty Parent Content

Parent skill has no `content`, only `@use` phases:

```text
@skills {
  ops: {
    description: "Production triage"
    @use ./phases/health-scan
    @use ./phases/triage
  }
}
```

**Behavior:** Valid. Flattened content starts with phase sections directly (no orchestration preamble). `composedFrom` is set normally.

### 20.2 Single Phase

```text
@skills {
  ops: {
    description: "Wrapper around health scan"
    @use ./phases/health-scan
  }
}
```

**Behavior:** Valid. Effectively a wrapper skill. Phase headers still emitted for provenance. Contract chain validation skipped (single phase, no chain).

### 20.3 Phase with Parameters That Don't Exist

```text
@use ./phases/triage(nonexistent: "value")
```

**Behavior:** Existing `PS021: valid-use-params` catches this — `UnknownParamError`.

### 20.4 Phase File That Is Also Used at Top Level

```text
@use ./shared/standards

@skills {
  ops: {
    description: "..."
    @use ./phases/health-scan
  }
}
```

Where `./shared/standards.prs` and `./phases/health-scan.prs` are different files.

**Behavior:** Valid. Top-level `@use` imports blocks into the program. Inline `@use` imports into the skill. No interaction between them.

### 20.5 Same Phase Used Twice

```text
@skills {
  ops: {
    description: "..."
    @use ./phases/health-scan
    @use ./phases/health-scan
  }
}
```

**Behavior:** Error — duplicate phase name `health-scan`. User can alias:

```text
@use ./phases/health-scan as initial-scan
@use ./phases/health-scan as final-scan
```

### 20.6 Phase Used Twice with Different Params

```text
@skills {
  ops: {
    description: "..."
    @use ./phases/triage(severity: "warning") as warning-triage
    @use ./phases/triage(severity: "critical") as critical-triage
  }
}
```

**Behavior:** Valid. Same file, different parameter bindings, different aliases. Two distinct phases in output.

### 20.7 Sub-Skill with Its Own `@use` at Top Level

```text
# ./phases/health-scan.prs
@use @shared/monitoring-knowledge

@skills {
  health-scan: { ... }
}
```

**Behavior:** Valid. The sub-skill's top-level `@use` is resolved first (brings in blocks from the shared registry), then the resolved sub-skill is composed into the parent.

### 20.8 Sub-Skill That Composes Other Sub-Skills

```text
# ./phases/health-scan.prs
@skills {
  health-scan: {
    description: "..."
    @use ./checks/cpu-check
    @use ./checks/memory-check
  }
}
```

**Behavior:** Valid (up to depth limit). Recursive composition. The inner composition is resolved first, producing a flat `health-scan` skill, which is then composed into the outer skill.

### 20.9 Phase File Not Found

```text
@use ./phases/nonexistent
```

**Behavior:** `ResolveError: Sub-skill file not found: ./phases/nonexistent.prs`

### 20.10 Phase File Is Not Valid PRS

```text
@use ./phases/broken
```

Where `broken.prs` has syntax errors.

**Behavior:** Parse errors from the sub-skill file are reported with the sub-skill's file path and location. The parent composition fails.

### 20.11 @extend on a Composed Skill

```text
@use @registry/skills/ops

@extend skills.ops {
  allowedTools: ["additional-tool"]
}
```

**Behavior:** Valid. `@extend` runs after composition (per pipeline order). The extension modifies the already-composed skill using existing skill-aware merge semantics. `allowedTools` has `replace` semantics in extend.

### 20.12 Phase with `references` That Collide with Parent's

Parent has `references: [./docs/arch.md]`. Phase also references `./docs/arch.md` (different file, different base path).

**Behavior:** Both files are included. References are identified by their resolved absolute path, not basename. If they resolve to the same absolute path, deduplicated. If different files with same basename, both included — the formatter generates unique paths (e.g., `references/arch.md` and `references/health-scan/arch.md`).

### 20.13 Composition + Overlay Interaction

```text
# Layer 3: BU overlay on a composed skill from Layer 2
@use @product/skills/ops as base

@extend base.skills.ops {
  # Adds BU-specific references to the already-composed skill
  references: [./references/bu-runbooks.md]
}
```

**Behavior:** Valid. Composition resolves at Layer 2 (product registry). Overlay applies at Layer 3. The BU sees the full composed skill and can extend it.

### 20.14 `@use` with `only`/`exclude` Filters Inside Skills

```text
@skills {
  ops: {
    @use ./phases/health-scan(only: [skills])
  }
}
```

**Behavior:** The `only` filter restricts which blocks are extracted from the sub-skill. `only: [skills]` means only the skill definition is imported, context blocks (`@knowledge`, `@restrictions`) are excluded.

### 20.15 SKILL.md Phase That References Another SKILL.md Phase

```yaml
# ops/SKILL.md
---
phases:
  - path: ./phases/health-scan
---
```

```yaml
# ops/phases/health-scan/SKILL.md
---
phases:
  - path: ./checks/cpu
---
```

**Behavior:** Valid (recursive SKILL.md composition, up to depth limit). Same rules as `.prs` composition.

### 20.16 Mixed PRS and SKILL.md in Composition

A `.prs` skill composing SKILL.md phases or vice versa.

**Behavior:** Not supported in MVP. `.prs` inline `@use` loads `.prs` files. SKILL.md `phases` loads SKILL.md files. Cross-format composition is Phase 2.

### 20.17 Sub-Skill Params with Defaults (No Args Passed)

```text
# triage.prs has params: { severity: string = "all" }
@use ./phases/triage
```

**Behavior:** The default value `"all"` is applied via existing `bindParams()` infrastructure. `{{severity}}` in sub-skill content resolves to `"all"`. If a param has NO default and is not passed, existing `PS021` validation catches it as a missing required parameter.

### 20.18 Sub-Skill with Different `@meta.syntax` Version

Parent uses `syntax: "1.1.0"`, sub-skill uses `syntax: "1.0.0"`.

**Behavior:** Each file is parsed independently with its declared syntax version. The parser validates syntax compatibility during parse (not during composition). If the sub-skill uses features not available in its declared syntax version, the parser catches it. The resolver does NOT validate cross-file syntax version consistency — this is a parser concern. Emit a `warning` if major versions differ: `"Sub-skill './phases/triage.prs' uses syntax 2.0.0 which differs from parent syntax 1.1.0"`.

### 20.19 Empty Phase (No Content, No Context Blocks)

```text
# empty.prs
@skills { x: { description: "placeholder" } }
```

**Behavior:** Valid. Produces a minimal phase section:

```markdown
## Phase N: x
<!-- composed-from: ./empty.prs -->

### Instructions
(no content)
```

Validator emits `info`: `"Phase 'x' from './empty.prs' has no content or context blocks."` The `composedFrom` entry has `composedBlocks: []`.

### 20.20 Sub-Skill `@context` Block Without Parent `@context`

Section 5.4 says `@context` is "Merged into parent `@context` (if parent has one)."

**Behavior when parent has no `@context`:** The sub-skill's `@context` block is **silently dropped**. Rationale: `@context` is a project-level block that sets global context. A phase should not create a project-level block as a side effect of composition. If the user wants the sub-skill's context, they should declare it at the project level.

### 20.21 Sub-Skill Fully Resolved Before Extraction

Each sub-skill file goes through the **full resolution pipeline** before its skill definition is extracted:

```
parse → normalizeBlockAliases → resolveInherit → resolveImports →
resolveSkillComposition (recursive) → applyExtends → extract skill + context blocks
```

This means a sub-skill can use `@inherit`, top-level `@use` with aliases, `@extend`, and even compose its own sub-skills — all resolved before being flattened into the parent.

### 20.22 Diamond Content Duplication

Skill A composes Phase X from `./x.prs`. Skill B also composes Phase X from `./x.prs`. Skill C composes both A and B.

**Behavior:** Content from `x.prs` appears **twice** in Skill C's output (once under the "A" phase section, once under the "B" phase section). This is by design — each phase is self-contained. File loading is cached (parsed once), but content is duplicated in output. No deduplication across phases.

---

## 21. Interaction with Existing Features

### 21.1 @inherit

`@inherit` in a sub-skill file is resolved normally before composition. The sub-skill can inherit from a parent template — the resolved result is what gets composed.

### 21.2 @extend (Top-Level)

Top-level `@extend` runs after composition. It can target composed skills:

```text
@extend skills.ops {
  content: """
    Override the entire composed content with custom instructions.
  """
}
```

This replaces the flattened content (all phase sections) because `content` has `replace` semantics in `@extend`.

**`composedFrom` preservation:** The `composedFrom` metadata must survive `applyExtends()`. The implementation must add `'composedFrom'` to a `SKILL_PRESERVE_PROPERTIES` set (or equivalent) in `extensions.ts` so that `mergeSkillValue()` never overwrites it. Since `composedFrom` is not in any of the three existing strategy sets (`REPLACE`, `APPEND`, `MERGE`), it would currently fall through to `deepMerge` — which could accidentally clobber it if the extend payload touches the same object path.

**Limitation:** There is no mechanism to extend a *specific phase* within a composed skill. To modify Phase 2 of a composed skill, the user must either (a) replace the entire content or (b) wait for Phase 3 (section 26, item 17: "Phase-level `@extend`").

**`allowedTools` gotcha:** When using `@extend` on a composed skill, `allowedTools` has **replace** semantics (not union). This means the extend must re-declare ALL desired tools, not just additions. The union semantics from composition are already applied before `@extend` runs.

### 21.3 Skill Parameters (`@meta params`)

Parent skill can have parameters that are interpolated in its own content but NOT passed to phases:

```text
@meta {
  id: "ops"
  params: {
    mode: string = "manual"
  }
}

@skills {
  ops: {
    content: """
      Operating in {{mode}} mode.
    """
    @use ./phases/health-scan
  }
}
```

Phase parameters are separate — passed via `@use ./phases/triage(severity: "critical")`.

### 21.4 Skill Examples

Phase examples are concatenated into the parent skill's examples. Each example retains provenance through a naming convention:

```
examples: {
  "health-scan:basic": { input: "...", output: "..." },
  "triage:critical": { input: "...", output: "..." }
}
```

### 21.5 allowedTools Interaction

If the parent skill defines `allowedTools`, the final set is the **union** of parent + all phases. This is important for security — a phase cannot remove tools that the parent grants (that would require `@extend` with `replace` semantics).

### 21.6 Lock Scanner

`prs lock` must discover sub-skill files referenced by inline `@use` and add them to the dependency graph. The current lock scanner only iterates `ast.uses` (top-level `UseDeclaration[]`) and does NOT look inside block content.

**Phase 1 limitation:** Inline `@use` dependencies from remote registries will NOT be captured by `prs lock` in Phase 1. This is a known gap. Local file references are unaffected (they don't need locking). Phase 2 (section 26, item 14) adds inline `@use` scanning to the lock scanner.

---

## 22. Error Handling

### 22.1 Errors (Block Compilation)

| Error | Code | Message |
|---|---|---|
| Sub-skill file not found | PS027 | `Sub-skill file not found: {path}` |
| Sub-skill has no @skills block | PS027 | `Sub-skill '{path}' does not contain a @skills block` |
| Sub-skill @skills block is empty | PS027 | `Sub-skill '{path}' has no skill definitions` |
| Circular composition | PS027 | `Circular skill composition: {chain}` |
| Depth exceeds limit | PS027 | `Composition depth exceeds maximum of 3 levels at '{path}'` |
| Duplicate phase name | PS027 | `Duplicate phase name '{name}' in skill '{skill}'` |
| Phase name = parent name | PS027 | `Phase name '{name}' conflicts with parent skill name` |
| Parse error in sub-skill | — | Standard parse error with sub-skill file path |
| Parameter not found in sub-skill | PS021 | Standard param validation error |

### 22.2 Warnings

| Warning | Code | Message |
|---|---|---|
| Phase count > 20 | PS027 | `Skill '{name}' composes {n} phases; maximum recommended is 20` |
| Unmatched output in chain | PS028 | `Phase '{phase}' output '{name}' not consumed by next phase` |
| Unmatched input in chain | PS028 | `Phase '{phase}' input '{name}' not provided by previous phase` |
| Type mismatch in chain | PS028 | `Type mismatch: '{phase1}' outputs '{name}' as {type1}, '{phase2}' expects {type2}` |
| `@use` in non-skills block | PS027 | `Inline @use only supported in @skills blocks; ignored in @{block}` |

### 22.3 Error Location

All errors include the location of the `@use` directive in the parent file, plus (where applicable) the path of the sub-skill file. Example:

```
PS027: Sub-skill file not found: ./phases/nonexistent.prs
  at ops.prs:12:5 (@use ./phases/nonexistent)
```

---

## 23. Backward Compatibility

### 23.1 Parser

Adding `inlineUse` to `blockContent` is backward-compatible: existing `.prs` files don't contain `@use` inside blocks. The parser produces identical output for existing files.

### 23.2 AST

Adding `inlineUses?: InlineUseDeclaration[]` to `ObjectContent` is backward-compatible: the property is optional and `undefined` for existing ASTs. Adding `composedFrom?: ComposedPhase[]` to `SkillDefinition` is also optional.

### 23.3 Resolver

`resolveSkillComposition()` is a new step that is a no-op when no inline `@use` exists. Existing resolution behavior unchanged.

### 23.4 Formatters

Formatters don't know about composition — they see a flat skill. No breaking changes.

### 23.5 Validator

New rules (PS027, PS028) only fire when composition is detected. Existing validations unaffected.

### 23.6 Test Impact

Existing tests must pass unchanged. New tests added for composition-specific behavior.

---

## 24. Testing Strategy

### 24.1 Parser Tests (`packages/parser`)

| Test | Description |
|---|---|
| `inlineUse` in skill body | Parse `@use ./path` inside `@skills { name: { @use ./x } }` |
| `inlineUse` with params | Parse `@use ./path(key: "value")` inside skill |
| `inlineUse` with alias | Parse `@use ./path as alias` inside skill |
| `inlineUse` with params + alias | Full syntax inside skill |
| Multiple `inlineUse` | Several `@use` in one skill |
| `inlineUse` mixed with fields | `@use` alongside `description`, `content`, etc. |
| `inlineUse` in non-skill block | `@use` inside `@standards` (parsed, validated as warning) |
| No `inlineUse` (regression) | Existing blockContent without `@use` parses identically |

### 24.2 Resolver Tests (`packages/resolver`)

| Test | Description |
|---|---|
| Basic composition | Single phase, flat output |
| Multi-phase composition | Three phases in order |
| Phase with parameters | Parameter binding before composition |
| Phase with alias | Alias reflected in phase name and content |
| Context block extraction | @knowledge, @restrictions, @standards from sub-skill |
| Ignored blocks | @identity, @guards, @shortcuts from sub-skill not composed |
| allowedTools union | Tools from all phases + parent combined |
| references concat | References from phases concatenated |
| inputs/outputs chain | First phase inputs, last phase outputs |
| composedFrom metadata | Correct metadata structure |
| Recursive composition | Phase that composes other phases |
| Depth limit | 4-level composition fails |
| Cycle detection | A → B → A fails |
| Duplicate phase name | Error on duplicate |
| Phase name = parent name | Error on conflict |
| Empty sub-skill | Error on missing @skills block |
| Sub-skill with top-level @use | Sub-skill imports resolved before composition |
| Sub-skill with @inherit | Inheritance resolved before composition |
| Phase with `only` filter | Block filtering in sub-skill import |
| Same phase, different params | Two instances with aliases |
| Single phase (no chain) | Valid, contract validation skipped |
| No phases (regression) | Skills without @use unchanged |

### 24.3 Validator Tests (`packages/validator`)

| Test | Description |
|---|---|
| PS027: valid file | No warnings |
| PS027: missing file | Error |
| PS027: no @skills block | Error |
| PS027: circular | Error with chain |
| PS027: depth exceeded | Error |
| PS027: duplicate phase | Error |
| PS027: phase count > 20 | Warning |
| PS027: @use in non-skills | Warning |
| PS028: matched contracts | No warnings |
| PS028: unmatched output | Warning |
| PS028: unmatched input | Warning |
| PS028: type mismatch | Warning |
| PS028: no contracts defined | No warnings |
| PS028: partial contracts | Only warned where defined |

### 24.4 Integration Tests

| Test | Description |
|---|---|
| Full pipeline | Parse → resolve → validate → compile a composed skill |
| Composition + overlay | Compose at L2, extend at L3, consume at L4 |
| Composition + references | Phase references emitted in output |
| Compilation targets | Claude, Cursor, GitHub output for composed skill |

### 24.5 Fixture Files

```
packages/resolver/src/__tests__/__fixtures__/skill-composition/
  parent.prs                    # Parent skill with @use
  phases/
    health-scan.prs             # Simple phase
    triage.prs                  # Phase with params and contracts
    code-fix.prs                # Phase with alias, references
  circular/
    a.prs                       # Circular: a → b → a
    b.prs
  deep/
    l1.prs → l2.prs → l3.prs → l4.prs   # Depth limit test
  empty-skills.prs              # File with empty @skills block
  no-skills.prs                 # File without @skills block
```

---

## 25. Examples

### 25.1 Production Ops Skill (Full Example)

**`ops.prs`** — orchestrator:

```text
@meta {
  id: "ops"
  syntax: "1.1.0"
}

@skills {
  ops: {
    description: "Production triage for Chmurka.pl"
    userInvocable: true
    trigger: "/ops"
    context: "fork"
    agent: "general-purpose"

    content: """
      You are a production triage orchestrator. Execute the phases below
      in order. After each phase, summarize findings before proceeding.

      ## Mode Selection
      - If running via cron: skip interactive confirmations, auto-approve safe fixes
      - If running manually: prompt for confirmation at each phase transition
    """

    @use ./phases/health-scan
    @use ./phases/triage(severity: "critical")
    @use ./phases/code-fix as autofix
  }
}
```

**`phases/health-scan.prs`**:

```text
@meta {
  id: "health-scan"
  syntax: "1.1.0"
}

@knowledge {
  thresholds: {
    cpu_warning: 70
    cpu_critical: 90
    memory_warning: 80
    memory_critical: 95
    error_rate_warning: 2
    error_rate_critical: 5
  }
}

@restrictions {
  - "Never restart services without explicit confirmation"
  - "Never modify production configuration"
  - "Always run checks in parallel to minimize scan time"
}

@skills {
  health-scan: {
    description: "Run comprehensive health checks across all services"
    allowedTools: [
      "mcp__monitoring__check_cpu",
      "mcp__monitoring__check_memory",
      "mcp__monitoring__check_error_rate",
      "mcp__monitoring__check_disk",
      "mcp__monitoring__check_latency"
    ]
    outputs: {
      findings: {
        type: "string"
        description: "Structured health findings per service with severity levels"
      }
    }
    content: """
      Run ALL 5 health checks in parallel:
      1. CPU utilization per service
      2. Memory usage per service
      3. Error rate (5-minute window)
      4. Disk usage on critical partitions
      5. P95 latency per endpoint

      Compare each metric against thresholds from @knowledge.
      Report findings as a structured list grouped by service.
    """
  }
}
```

**`phases/triage.prs`**:

```text
@meta {
  id: "triage"
  syntax: "1.1.0"
  params: {
    severity: string = "all"
  }
}

@knowledge {
  severity_order: ["info", "warning", "critical", "fatal"]
  escalation_rules: {
    """
    - fatal: Immediate page to on-call
    - critical: Create P1 ticket, notify team lead
    - warning: Create P2 ticket
    - info: Log only
    """
  }
}

@restrictions {
  - "Never escalate without evidence from at least 2 independent metrics"
  - "Never classify severity above the configured threshold: {{severity}}"
}

@skills {
  triage: {
    description: "Classify and prioritize health findings"
    inputs: {
      findings: {
        type: "string"
        description: "Health check findings from scan phase"
      }
    }
    outputs: {
      classification: {
        type: "string"
        description: "Findings grouped by service and severity with recommended actions"
      }
    }
    content: """
      Analyze the health findings from the previous phase.

      1. Group findings by service
      2. Within each service, sort by severity (highest first)
      3. Filter: only include findings at or above "{{severity}}" level
      4. For each finding, recommend an action per escalation rules
      5. Output a structured classification for the next phase
    """
  }
}
```

**`phases/code-fix.prs`**:

```text
@meta {
  id: "code-fix"
  syntax: "1.1.0"
}

@restrictions {
  - "Never push directly to main branch"
  - "Always create a feature branch with prefix 'auto-fix/'"
  - "Never modify more than 3 files in a single fix"
  - "Always include the finding ID in the commit message"
}

@skills {
  code-fix: {
    description: "Create automated code fixes for classified findings"
    allowedTools: ["Bash", "Read", "Write", "Edit"]
    inputs: {
      classification: {
        type: "string"
        description: "Classified findings with recommended actions"
      }
    }
    outputs: {
      pr_url: {
        type: "string"
        description: "URL of the pull request with the fix"
      }
    }
    references: [
      ./references/fix-patterns.md
    ]
    content: """
      For each actionable finding in the classification:

      1. Locate the relevant code using the service and metric info
      2. Create branch: auto-fix/{finding-id}
      3. Apply the fix (max 3 files)
      4. Commit with message: "fix({service}): {finding description}"
      5. Create a PR with the finding details and fix explanation

      Only fix findings classified as "critical" or higher.
      Skip "warning" findings — they go to the P2 ticket backlog.
    """
  }
}
```

### 25.2 Compiled Output (Claude Target)

After `prs compile --target claude`, the composed skill produces:

```markdown
# .claude/skills/ops/SKILL.md

---
name: ops
description: Production triage for Chmurka.pl
trigger: /ops
---

You are a production triage orchestrator. Execute the phases below
in order. After each phase, summarize findings before proceeding.

## Mode Selection
- If running via cron: skip interactive confirmations, auto-approve safe fixes
- If running manually: prompt for confirmation at each phase transition

---

## Phase 1: health-scan
<!-- composed-from: ./phases/health-scan.prs -->

### Knowledge
thresholds:
  cpu_warning: 70
  cpu_critical: 90
  memory_warning: 80
  memory_critical: 95
  error_rate_warning: 2
  error_rate_critical: 5

### Restrictions
- Never restart services without explicit confirmation
- Never modify production configuration
- Always run checks in parallel to minimize scan time

### Instructions
Run ALL 5 health checks in parallel:
1. CPU utilization per service
2. Memory usage per service
3. Error rate (5-minute window)
4. Disk usage on critical partitions
5. P95 latency per endpoint

Compare each metric against thresholds from Knowledge section above.
Report findings as a structured list grouped by service.

---

## Phase 2: triage
<!-- composed-from: ./phases/triage.prs -->

### Knowledge
severity_order: info, warning, critical, fatal

escalation_rules:
- fatal: Immediate page to on-call
- critical: Create P1 ticket, notify team lead
- warning: Create P2 ticket
- info: Log only

### Restrictions
- Never escalate without evidence from at least 2 independent metrics
- Never classify severity above the configured threshold: critical

### Instructions
Analyze the health findings from the previous phase.

1. Group findings by service
2. Within each service, sort by severity (highest first)
3. Filter: only include findings at or above "critical" level
4. For each finding, recommend an action per escalation rules
5. Output a structured classification for the next phase

---

## Phase 3: autofix
<!-- composed-from: ./phases/code-fix.prs -->

### Restrictions
- Never push directly to main branch
- Always create a feature branch with prefix 'auto-fix/'
- Never modify more than 3 files in a single fix
- Always include the finding ID in the commit message

### Instructions
For each actionable finding in the classification:

1. Locate the relevant code using the service and metric info
2. Create branch: auto-fix/{finding-id}
3. Apply the fix (max 3 files)
4. Commit with message: "fix({service}): {finding description}"
5. Create a PR with the finding details and fix explanation

Only fix findings classified as "critical" or higher.
Skip "warning" findings — they go to the P2 ticket backlog.
```

### 25.3 Reusable Phase Across Skills

The same `health-scan.prs` used by multiple parent skills:

```text
# monitoring.prs
@skills {
  monitoring: {
    description: "Continuous health monitoring"
    @use ./phases/health-scan
  }
}

# ops.prs
@skills {
  ops: {
    description: "Full production triage"
    @use ./phases/health-scan
    @use ./phases/triage
    @use ./phases/code-fix
  }
}

# pre-deploy.prs
@skills {
  pre-deploy: {
    description: "Pre-deployment health gate"
    @use ./phases/health-scan(only: [skills])
  }
}
```

---

## 26. Implementation Phases

### Phase 1 — MVP

1. **Core types** — `InlineUseDeclaration`, `ComposedPhase`, extended `ObjectContent` and `SkillDefinition`
2. **Parser** — `inlineUse` rule in `blockContent`, CST visitor update, `BlockContentCstCtx` type
3. **Resolver** — `resolveSkillComposition()` method on Resolver class, pipeline integration between `resolveImports` and `applyExtends`
4. **Resolver** — `composedFrom` preservation in `extensions.ts` (`SKILL_PRESERVE_PROPERTIES` set)
5. **Validator** — `PS027: valid-skill-composition` rule (post-resolution checks only; resolver handles file-not-found, circular, depth)
6. **Tests** — 24 critical tests: parser (5), resolver (12), validator (6), integration (1)
7. **Fixtures** — composition test fixtures in `packages/resolver/src/__tests__/__fixtures__/skill-composition/`
8. **Syntax highlighters**:
   - Pygments: **update** `block` state to include `@use` pattern
   - TextMate: verify (likely no changes — global pattern matching)
   - Monaco: verify (likely no changes — `root` state handles all `@` directives)
9. **Documentation** — specific files to update:
   - `docs/reference/language.md` — add inline `@use` within `@skills` blocks
   - `docs/guides/building-skills.md` — add skill composition section
   - `docs/guides/import.md` — document inline `@use` variant
10. **Playground** — add composition example as syntax showcase (note: requires parser changes to compile; show with "requires file system" note until file resolution is supported in-browser)
11. **PromptScript skill** — update `packages/cli/skills/promptscript/SKILL.md`:
    - "File Structure" section — mention `@use` inside `@skills`
    - "@skills" section — add inline `@use` as a capability
    - "Inheritance and Composition" section — add inline `@use` subsection
    - "Common Mistakes" section — distinguish top-level vs inline `@use`
12. **Post-work verification** — full pipeline (format, lint, typecheck, test, validate, schema:check, skill:check, grammar:check)

**Known Phase 1 Limitations:**
- Lock scanner does not discover inline `@use` remote dependencies (Phase 2)
- Contract chain validation (PS028) not implemented (Phase 2)
- SKILL.md native composition not supported (Phase 2)
- Cross-format composition (`.prs` ↔ SKILL.md phases) not supported (Phase 2)
- No `prs inspect --phases` debugging command (Phase 2)

### Phase 2 — Enhanced

12. **Contract validation** — `PS028: skill-contract-chain` rule
13. **SKILL.md support** — `phases` frontmatter field, native skill composition
14. **Lock scanner** — inline `@use` dependency discovery
15. **`prs inspect --phases`** — CLI debugging command
16. **Cross-format composition** — `.prs` ↔ SKILL.md phase references

### Phase 3 — Advanced

17. **Phase-level `@extend`** — extend specific phases by name
18. **Conditional phases** — phases enabled/disabled by params
19. **Parallel phase declaration** — explicit parallel execution semantics
20. **Phase output capture** — structured output format for inter-phase data

---

## 27. Glossary

| Term | Definition |
|---|---|
| **Composition** | Assembling a skill from multiple sub-skill files |
| **Phase** | A sub-skill imported into a parent skill via inline `@use` |
| **Orchestrator** | The parent skill that composes phases |
| **Flatten** | Resolving composition into a single skill definition with no inline `@use` |
| **Phase header** | The `## Phase N: name` section in flattened content |
| **Contract** | Optional `inputs`/`outputs` declarations on a phase skill |
| **Contract chain** | Sequential validation of outputs→inputs between adjacent phases |
| **composedFrom** | AST metadata tracking phase provenance after flattening |
| **Inline @use** | `@use` directive within a `@skills` block entry (vs top-level @use) |
| **Sub-skill** | A `.prs` file imported as a phase (must contain `@skills` block) |

---

## Appendix A: Verification Report

10 verification iterations were performed on this spec. Below is a summary of all findings and their resolutions.

### Iteration Summary

| # | Focus | Checks | Pass | Fail | Fixed in v2.0 |
|---|---|---|---|---|---|
| 1 | Internal consistency | 5 | 3 | 2 | Yes |
| 2 | Completeness | 5 | 3 | 2 | Yes |
| 3 | Security & safety | 6 | 2 | 4 | Yes |
| 4 | Edge case exhaustiveness | 8 | 4 | 4 | Yes |
| 5 | Cross-package impact | 7 | 5 | 2 | Yes |
| 6 | Language spec consistency | 4 | 2 | 2 | Yes |
| 7 | Overlay feature consistency | 5 | 4 | 1 | Yes |
| 8 | Documentation & playground | 4 | 0 | 4 | Yes |
| 9 | Implementation feasibility | 5 | 5 | 0 | N/A |
| 10 | Adversarial stress testing | 6 | 4 | 2 | Yes |
| **Total** | | **55** | **32** | **23** | **All resolved** |

### Key Fixes Applied (v1.0 → v2.0)

1. **Pipeline listing** (section 11.3) — updated to include all actual resolver steps (`normalizeBlockAliases`, `resolveGuardRequires`, `resolveNativeCommands`, `resolveNativeAgents`)
2. **ObjectContent design rationale** (section 10.2) — added notes on ephemeral `inlineUses`, `deepClone` behavior, and `interpolateContent` interaction
3. **`--strict` mode** (section 18.1) — documented composition warning promotion to errors
4. **Security trust model** (section 19.6) — added explicit trust boundary documentation and `allowedTools` audit warning
5. **Restriction precedence** (section 19.7) — parent restrictions repeated before and after phases for prompt authority
6. **Total content size limit** (section 19.8) — added 256KB `MAX_COMPOSED_CONTENT_SIZE`
7. **Missing edge cases** (sections 20.17-20.22) — params with defaults, syntax version mismatch, empty phase, `@context` drop, full sub-skill resolution, diamond duplication
8. **`composedFrom` preservation** (section 21.2) — added `SKILL_PRESERVE_PROPERTIES` requirement for `extensions.ts`
9. **`allowedTools` extend gotcha** (section 21.2) — documented replace vs union semantics difference
10. **Lock scanner limitation** (section 21.6) — documented Phase 1 gap for inline `@use` remote deps
11. **Language extension note** (section 9.5) — acknowledged that inline `@use` is a genuinely new syntactic form
12. **Validator vs resolver responsibility** (section 12.1) — clarified which checks are resolve-time vs validate-time
13. **Pygments lexer** (section 15.1) — changed from "verify" to "change required"
14. **Section 17 Phase 2 note** — added implementation phase marker
15. **Documentation scope** (section 26, Phase 1) — enumerated specific files and SKILL.md sections to update
16. **Phase 1 known limitations** (section 26) — explicit list of what Phase 1 does NOT include
