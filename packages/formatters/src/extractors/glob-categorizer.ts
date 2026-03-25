import type { BlockContent } from '@promptscript/core';
import { StandardsExtractor } from './standards-extractor.js';
import type { StandardsEntry } from './types.js';
import { getSectionTitle } from './types.js';

export interface CategorizedGlobs {
  readonly name: string;
  readonly patterns: string[];
  readonly content: string;
  readonly description: string;
}

export const CATEGORY_GLOB_HINTS: Readonly<Record<string, readonly string[]>> = {
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
  vue: ['.vue'],
  svelte: ['.svelte'],
  astro: ['.astro'],
  angular: ['.component.ts', '.module.ts', '.service.ts', '.directive.ts', '.pipe.ts'],
  blade: ['.blade.php'],
  heex: ['.heex'],
  razor: ['.razor', '.cshtml'],
  haml: ['.haml'],
  css: ['.css'],
  scss: ['.scss', '.sass'],
  less: ['.less'],
  stylus: ['.styl'],
  html: ['.html', '.htm'],
  markdown: ['.md', '.mdx'],
  xml: ['.xml', '.xsl', '.xsd'],
  terraform: ['.tf', '.tfvars', '.hcl'],
  puppet: ['.pp'],
  saltstack: ['.sls'],
  graphql: ['.graphql', '.gql'],
  protobuf: ['.proto'],
  prisma: ['.prisma'],
  thrift: ['.thrift'],
  avro: ['.avsc'],
  jupyter: ['.ipynb'],
  verilog: ['.sv', '.svh'],
  vhdl: ['.vhd', '.vhdl'],
  testing: ['test', 'spec', '__tests__'],
  gherkin: ['.feature'],
  storybook: ['.stories.ts', '.stories.tsx', '.stories.js', '.stories.jsx', '.stories.mdx'],
};

export class GlobCategorizer {
  constructor(private readonly standardsExtractor: StandardsExtractor) {}

  categorize(globs: string[], standardsContent: BlockContent | null): CategorizedGlobs[] {
    if (!standardsContent || globs.length === 0) return [];

    const extracted = this.standardsExtractor.extract(standardsContent);
    const { codeStandards } = extracted;
    if (codeStandards.size === 0) return [];

    const buckets = new Map<string, string[]>();

    for (const glob of globs) {
      const winner = this.findBestMatch(glob, codeStandards);
      if (winner) {
        const existing = buckets.get(winner) ?? [];
        existing.push(glob);
        buckets.set(winner, existing);
      }
    }

    const results: CategorizedGlobs[] = [];
    for (const [category, patterns] of buckets) {
      const entry = codeStandards.get(category);
      if (!entry || entry.items.length === 0) continue;

      const content = entry.items.map((item) => `- ${item}`).join('\n');
      const title = getSectionTitle(category);

      results.push({
        name: category,
        patterns,
        content,
        description: `${title}-specific rules`,
      });
    }

    return results;
  }

  private findBestMatch(glob: string, codeStandards: Map<string, StandardsEntry>): string | null {
    let bestCategory: string | null = null;
    let bestLength = 0;
    let bestIsPattern = false;

    for (const [category, hints] of Object.entries(CATEGORY_GLOB_HINTS)) {
      if (!codeStandards.has(category)) continue;

      for (const hint of hints) {
        if (!this.hintMatchesGlob(hint, glob)) continue;

        const isPattern = !hint.startsWith('.');
        const length = hint.length;

        if (length > bestLength || (length === bestLength && isPattern && !bestIsPattern)) {
          bestCategory = category;
          bestLength = length;
          bestIsPattern = isPattern;
        }
      }
    }

    return bestCategory;
  }

  private hintMatchesGlob(hint: string, glob: string): boolean {
    let searchFrom = 0;
    while (searchFrom < glob.length) {
      const idx = glob.indexOf(hint, searchFrom);
      if (idx === -1) return false;

      const charBefore = idx > 0 ? glob[idx - 1] : undefined;
      const charAfter = idx + hint.length < glob.length ? glob[idx + hint.length] : undefined;

      const beforeOk = !charBefore || !this.isLetter(charBefore);
      const afterOk = !charAfter || !this.isLetter(charAfter);

      if (beforeOk && afterOk) return true;

      searchFrom = idx + 1;
    }
    return false;
  }

  private isLetter(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }
}
