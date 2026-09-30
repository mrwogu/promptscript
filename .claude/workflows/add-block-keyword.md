# add-block-keyword

<!-- PromptScript 2026-09-30T14:16:51.158Z | source: .promptscript/project.prs | target: claude - do not edit -->

> Add or rename a PromptScript block keyword without desynchronizing tooling

A block keyword is referenced in more places than the parser. Update all of
them in the same change.

1. Lexer and grammar: `packages/parser/src/grammar/`.
2. Block shape contract: `packages/core/src/block-shapes.ts`.
3. Section contract, if the block renders a section:
   `packages/core/src/section-registry.ts`.

4. Syntax version gate, if the keyword is new:
   `packages/core/src/syntax-versions.ts`.

5. Formatters that render the block, plus their golden files.
6. Both syntax highlighters: `apps/vscode/syntaxes/promptscript.tmLanguage.json`
   (VS Code and the docs site) and
   `packages/playground/src/utils/prs-language.ts`.

7. Reference docs under `docs/reference/`.

`pnpm grammar:check` catches a missed TextMate grammar entry and a
missed Monaco directive. Other Monaco rules are not checked, so verify
those by reading.
