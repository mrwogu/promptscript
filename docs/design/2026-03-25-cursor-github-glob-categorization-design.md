# Standards-Driven Glob Categorization for Cursor and GitHub Formatters

**Issue:** [#165](https://github.com/mrwogu/promptscript/issues/165)
**Date:** 2026-03-25
**Status:** Approved

## Problem

The Cursor formatter's `extractGlobs()` and GitHub formatter's `extractInstructions()` methods use hardcoded string matching to categorize `@guards.globs` patterns into buckets:

- `.ts`/`.tsx` → `typescript` bucket
- `test`/`spec`/`__tests__` → `testing` bucket
- everything else → `files` bucket (Cursor only; GitHub has no `files` bucket)

This causes several issues:

1. **Non-TS languages ignored:** `**/*.py` ends up in a generic `files` bucket with no content
2. **Misclassification:** `**/*.test.tsx` is classified as `testing` (not `typescript`) even though it's both
3. **No extensibility:** Only 2 hardcoded categories exist
4. **Hardcoded content:** The `testing` bucket outputs `"Follow project testing conventions and patterns."` instead of pulling from `@standards.testing`

Both formatters have the same bug (though GitHub lacks the `files` fallback bucket). Named entries (`@guards.security: { applyTo: [...] }`) already bypass the heuristic and work correctly — this fix only affects the `@guards.globs` flat array path.

## Solution: Standards-Category-Driven Auto-Split

Replace the string-matching heuristic with `@standards`-category-driven assignment. Instead of guessing categories from glob patterns, look at what `@standards` categories actually exist in the AST and assign globs to matching categories.

### Category-to-Pattern Mapping

A shared mapping table defines which glob substrings are associated with which `@standards` category. Only categories that exist in the user's `@standards` block are considered during matching. `CATEGORY_GLOB_HINTS` is an exported module-level constant in `glob-categorizer.ts` (exported for testability).

```typescript
export const CATEGORY_GLOB_HINTS: Record<string, string[]> = {
  // === Languages ===
  typescript: ['.ts', '.tsx', '.mts', '.cts'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  python: ['.py', '.pyi', '.pyw'],
  java: ['.java'],
  c: ['.c'],
  cpp: ['.cpp', '.cxx', '.cc', '.hpp'],
  csharp: ['.cs', '.csx'],
  go: ['.go'],
  php: ['.php', '.phtml'],
  sql: ['.sql'],
  r: ['.r', '.R', '.Rmd'],
  swift: ['.swift'],
  rust: ['.rs'],
  kotlin: ['.kt', '.kts'],
  ruby: ['.rb', '.erb', '.rake'],
  perl: ['.pl', '.pm'],
  vb: ['.vb', '.vbs'],
  delphi: ['.pas', '.dpr'],
  fortran: ['.f90', '.f95', '.f03', '.f08'],
  dart: ['.dart'],
  matlab: ['.mlx'],
  scala: ['.scala', '.sc'],
  objectivec: ['.m', '.mm'],
  shell: ['.sh', '.bash', '.zsh', '.fish'],
  powershell: ['.ps1', '.psm1', '.psd1'],
  lua: ['.lua'],
  haskell: ['.hs', '.lhs'],
  julia: ['.jl'],
  groovy: ['.groovy', '.gvy'],
  elixir: ['.ex', '.exs'],
  clojure: ['.clj', '.cljs', '.cljc'],
  fsharp: ['.fs', '.fsi', '.fsx'],
  erlang: ['.erl', '.hrl'],
  cobol: ['.cob', '.cbl'],
  ada: ['.adb', '.ads'],
  lisp: ['.lisp', '.lsp', '.cl'],
  scheme: ['.scm', '.ss'],
  assembly: ['.asm'],
  solidity: ['.sol'],
  zig: ['.zig'],
  nim: ['.nim', '.nims'],
  crystal: ['.cr'],
  elm: ['.elm'],
  ocaml: ['.ml', '.mli'],
  abap: ['.abap'],
  racket: ['.rkt'],
  d: ['.d'],
  hack: ['.hack'],
  coffeescript: ['.coffee'],
  gleam: ['.gleam'],
  mojo: ['.mojo'],
  cairo: ['.cairo'],
  move: ['.move'],
  pony: ['.pony'],
  ballerina: ['.bal'],
  reason: ['.re', '.rei', '.res', '.resi'],

  // === Web / UI frameworks (unique extensions only) ===
  vue: ['.vue'],
  svelte: ['.svelte'],
  astro: ['.astro'],
  angular: ['.component.ts', '.module.ts', '.service.ts', '.directive.ts', '.pipe.ts'],
  blade: ['.blade.php'],
  heex: ['.heex'],
  razor: ['.razor', '.cshtml'],
  haml: ['.haml'],

  // === Styling ===
  css: ['.css'],
  scss: ['.scss', '.sass'],
  less: ['.less'],
  stylus: ['.styl'],

  // === Markup / Data ===
  html: ['.html', '.htm'],
  markdown: ['.md', '.mdx'],
  xml: ['.xml', '.xsl', '.xsd'],

  // === Infrastructure / DevOps ===
  terraform: ['.tf', '.tfvars', '.hcl'],
  puppet: ['.pp'],
  saltstack: ['.sls'],

  // === Schema / API ===
  graphql: ['.graphql', '.gql'],
  protobuf: ['.proto'],
  prisma: ['.prisma'],
  thrift: ['.thrift'],
  avro: ['.avsc'],

  // === Data Science ===
  jupyter: ['.ipynb'],

  // === Hardware description ===
  verilog: ['.sv', '.svh'],
  vhdl: ['.vhd', '.vhdl'],

  // === Testing (pattern-based) ===
  testing: ['test', 'spec', '__tests__'],

  // === Cucumber / BDD ===
  gherkin: ['.feature'],

  // === Storybook ===
  storybook: ['.stories.ts', '.stories.tsx', '.stories.js', '.stories.jsx', '.stories.mdx'],
};
```

**Extension table notes:**

- **Objective-C** includes `.m` (most common) and `.mm`. The `.m` extension conflicts with MATLAB source files. Since only categories present in `@standards` are checked, this is only an issue if both `@standards.objectivec` and `@standards.matlab` exist. In that case, `**/*.m` matches `objectivec` (because MATLAB has no `.m` hint — only `.mlx`). Users needing both should use named entries for disambiguation.
- **MATLAB** uses `.mlx` only (not `.mat` which is a binary data format, nor `.m` which is more commonly associated with Objective-C in coding contexts). Users who want `.m` files matched to MATLAB should use named entries.
- **Fortran** omits bare `.f` to avoid false matches; uses `.f90`+ variants only.
- **Hint matching is case-sensitive.** The R language includes both `.r` and `.R` variants in its hints. Categories for case-sensitive extensions must list all common casing variants explicitly.

### Matching Algorithm

The source of truth for "category exists" is the `StandardsExtractor`: a category is considered to exist only if `standardsExtractor.extract()` returns it in `codeStandards` with non-empty items. An empty `@standards.testing: {}` does not count as an existing category.

```
1. Run standardsExtractor.extract(standardsContent) to get codeStandards map
2. For each glob pattern in the array:
   a. Collect all (category, hint) pairs where:
      - category exists in codeStandards (has non-empty items)
      - category has an entry in CATEGORY_GLOB_HINTS
      - hint appears in the glob string
      - hint passes boundary detection (see below)
   b. From all matching pairs, pick the winner using this priority:
      1. LONGEST hint wins (e.g., ".component.ts" (13 chars) beats ".ts" (3 chars))
      2. If tied on length: pattern-based hints (no leading dot) beat
         extension-based hints (leading dot), so "test" (4 chars) beats
         ".tsx" (4 chars)
      3. If still tied: first category in CATEGORY_GLOB_HINTS iteration order wins
   c. Assign glob to the winning category's bucket
   d. If no category matches -> discard (no "files" bucket in output)
3. For each non-empty bucket:
   - Format codeStandards items as a bullet list ("- item1\n- item2\n...")
   - Return as CategorizedGlobs entry
4. Entries with empty content are excluded from the result array
```

**Tie-breaking examples:**

- `**/*.component.ts` with both `@standards.angular` and `@standards.typescript` → `angular` wins (`.component.ts` is 13 chars vs `.ts` at 3 chars — longest hint)
- `**/*.test.tsx` with both `@standards.testing` and `@standards.typescript` → `testing` wins (`test` at 4 chars ties `.tsx` at 4 chars, but `test` is pattern-based (no dot) which beats extension-based `.tsx`)
- `**/*.spec.js` with both `@standards.testing` and `@standards.javascript` → `testing` wins (`spec` at 4 chars vs `.js` at 3 chars — longest hint)

**Single category assignment:** Each glob is assigned to exactly one category. A `**/*.test.tsx` glob will not appear in both `testing` and `typescript` buckets. This is acceptable because:

- Named entries (`@guards`) provide full control for users who need multi-category assignment
- Duplicating globs across categories would mean the same file triggers multiple rule sets, which may be undesirable

### Boundary Detection

A hint matches a glob if the glob contains the hint and **both** surrounding characters pass boundary checks:

- **Character before the hint** (if any): must NOT be a letter (`[a-zA-Z]`)
- **Character after the hint** (if any): must NOT be a letter (`[a-zA-Z]`)

This prevents false matches in both directions:

| Glob                | Hint            | Before       | After         | Match? |
| ------------------- | --------------- | ------------ | ------------- | ------ |
| `**/*.c`            | `.c`            | `*`          | end-of-string | Yes    |
| `**/*.cpp`          | `.c`            | `*`          | `p` (letter)  | No     |
| `**/*.cs`           | `.c`            | `*`          | `s` (letter)  | No     |
| `**/*.cs`           | `.cs`           | `*`          | end-of-string | Yes    |
| `**/*.component.ts` | `.component.ts` | `*`          | end-of-string | Yes    |
| `**/*.test.ts`      | `test`          | `.`          | `.`           | Yes    |
| `**/attest.ts`      | `test`          | `t` (letter) | `.`           | No     |
| `**/__tests__/**`   | `__tests__`     | `/`          | `/`           | Yes    |
| `**/contest/**`     | `test`          | `n` (letter) | `/`           | No     |

For extension-based hints (starting with `.`), the "before" check naturally passes because the dot itself acts as a non-letter boundary.

For pattern-based hints (`testing` category: `test`, `spec`, `__tests__`), the before-check prevents matching substrings like `attest`, `contest`, `inspect`.

### Content Generation

Replace all hardcoded content with `StandardsExtractor` lookups:

```
For each category bucket:
  1. Look up the category key in extracted.codeStandards map
  2. Format StandardsEntry.items as bullet list ("- item1\n- item2\n...")
  3. This is the content field in CategorizedGlobs
```

The `GlobCategorizer` is responsible for formatting the `StandardsEntry.items` array into a content string (bullet list). The caller receives ready-to-use content. Entries where extraction yields no items are excluded from the result array entirely (the `categorize()` method never returns entries with empty content).

This removes:

- Cursor's hardcoded `if (config.name === 'typescript')` / `if (config.name === 'testing')` in `generateGlobFile()`
- GitHub's `getTypeScriptInstructionContent()` and `getTestingInstructionContent()` methods

## Shared Implementation

Both formatters share the same heuristic bug, so the fix is extracted into a shared utility.

### New file: `packages/formatters/src/extractors/glob-categorizer.ts`

```typescript
export interface CategorizedGlobs {
  /** Category key matching an @standards entry (e.g., "typescript", "testing") */
  name: string;
  /** Glob patterns assigned to this category */
  patterns: string[];
  /** Formatted content from @standards.<category> as bullet list; always non-empty */
  content: string;
  /** Human-readable description (e.g., "TypeScript-specific rules") */
  description: string;
}

export class GlobCategorizer {
  constructor(private standardsExtractor: StandardsExtractor) {}

  /**
   * Categorize glob patterns by matching them against @standards categories.
   *
   * @param globs - flat array of glob pattern strings from @guards.globs
   * @param standardsContent - the BlockContent from the @standards block, or null if no @standards exists
   * @returns array of CategorizedGlobs, one per matched category.
   *         Excludes unmatched globs and categories with empty content.
   *         Returns empty array when standardsContent is null.
   */
  categorize(globs: string[], standardsContent: BlockContent | null): CategorizedGlobs[];
}
```

The `description` field is generated as `"${title}-specific rules"` where `title` comes from the `getSectionTitle()` utility in `extractors/types.ts`. For categories not in `DEFAULT_SECTION_TITLES`, the title is derived by capitalizing the key (e.g., `python` → `Python`, `objectivec` → `Objectivec`). The `DEFAULT_SECTION_TITLES` map should be extended to include common entries from `CATEGORY_GLOB_HINTS` that need custom titles (e.g., `objectivec` → `Objective-C`, `csharp` → `C#`, `cpp` → `C++`, `fsharp` → `F#`).

### Formatter changes

| Formatter                      | Remove                                                                        | Add                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Cursor `extractGlobs()`        | Hardcoded ts/test/other pattern filtering from `globs` array                  | `GlobCategorizer.categorize()` call, convert results to `GlobConfig[]`        |
| Cursor `generateGlobFile()`    | Hardcoded content branches for `typescript` and `testing` names               | Use `config.content` uniformly (already works for named entries)              |
| GitHub `extractInstructions()` | Hardcoded ts/test pattern filtering from `globs` array                        | `GlobCategorizer.categorize()` call, convert results to `InstructionConfig[]` |
| GitHub                         | `getTypeScriptInstructionContent()`, `getTestingInstructionContent()` methods | Removed (dead code)                                                           |

Named entries path (`@guards.key: { applyTo: [...] }`) stays untouched in both formatters.

## Backward Compatibility

This is a behavioral change for users relying on the old heuristic:

**Before:** `@guards.globs: ["**/*.ts", "**/*.spec.ts"]` with `@standards.typescript` but no `@standards.testing` produces both `typescript.mdc` and `testing.mdc` (with hardcoded content).

**After:** Same input produces only `typescript.mdc` (with `.spec.ts` included). No `testing.mdc` because there's no `@standards.testing` key.

This is correct and desirable — the old behavior guessed wrong. Users who want a `testing` file should either:

- Add `@standards.testing: { ... }` (and `.spec.ts` globs will match `testing` first since `testing` hints include `spec`)
- Use named entries in `@guards` for full control

**Note:** The `files` bucket behavior is unchanged — it already produced no output file in the current implementation (Cursor's `generateGlobFile()` returns `null` when `sections.length <= 1`). GitHub never had a `files` bucket.

No deprecation warning needed. The `globs` array still works; it just produces smarter output.

## Test Strategy

### Unit tests: `packages/formatters/src/extractors/__tests__/glob-categorizer.spec.ts`

- Glob with `.ts` extension → `typescript` category (when `@standards.typescript` exists)
- Glob with `.py` extension → `python` category (when `@standards.python` exists)
- Glob with `spec` in path → `testing` category (when `@standards.testing` exists)
- Glob with `.py` but no `@standards.python` → not in any category (unmatched)
- Boundary: `**/*.c` does NOT match `cpp` category
- Boundary: `**/*.cs` matches `csharp`, not `c` or `css`
- Boundary: `**/attest.ts` does NOT match `testing` (letter before `test`)
- Boundary: `**/contest/**` does NOT match `testing` (letter before `test`)
- Longest match: `**/*.component.ts` → `angular` over `typescript`
- Pattern-based tiebreaker: `**/*.test.tsx` → `testing` over `typescript`
- Multiple globs split across different categories
- Empty globs array → empty result
- Null `standardsContent` (no `@standards` block) → empty result
- Empty `@standards.testing: {}` → not treated as existing category
- Content is formatted as bullet list from StandardsEntry items

### Integration tests: Cursor formatter (`cursor.spec.ts`)

- Multifile with `@standards.typescript` + matching globs → `typescript.mdc` with real content
- Multifile with `@standards.testing` → `testing.mdc` with real content (not hardcoded)
- Multifile with `@standards.python` + `**/*.py` → `python.mdc`
- Named entries still work unchanged
- No `@standards` → no glob-specific files generated

### Integration tests: GitHub formatter (`github.spec.ts`)

- Same patterns as Cursor but generating `.instructions.md` files
- Content comes from `StandardsExtractor`, not removed helper methods
