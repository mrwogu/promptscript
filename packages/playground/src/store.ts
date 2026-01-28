import { create } from 'zustand';
import type { CompileResult, CompileError } from '@promptscript/browser-compiler';
import type { FormatterOutput } from '@promptscript/formatters';

export type FormatterName = 'github' | 'claude' | 'cursor' | 'antigravity';

export interface FileState {
  path: string;
  content: string;
}

/**
 * Output convention type.
 */
export type ConventionType = 'markdown' | 'xml';

/**
 * Target-specific configuration.
 */
export interface TargetSettings {
  enabled: boolean;
  version?: string;
  convention?: ConventionType;
}

/**
 * Formatting options for output.
 */
export interface FormattingSettings {
  tabWidth: 2 | 4;
  proseWrap: 'always' | 'never' | 'preserve';
  printWidth: number;
}

/**
 * Playground configuration state.
 */
export interface PlaygroundConfig {
  targets: Record<FormatterName, TargetSettings>;
  formatting: FormattingSettings;
}

export interface PlaygroundState {
  // Files
  files: FileState[];
  activeFile: string;

  // Compilation
  isCompiling: boolean;
  compileResult: CompileResult | null;
  lastCompileTime: number | null;

  // Configuration
  config: PlaygroundConfig;

  // UI
  activeFormatter: FormatterName;
  showErrors: boolean;
  showExamples: boolean;
  showConfig: boolean;

  // File actions
  setActiveFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  addFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  setFiles: (files: FileState[]) => void;

  // Compile actions
  setCompiling: (isCompiling: boolean) => void;
  setCompileResult: (result: CompileResult | null) => void;

  // Config actions
  setTargetEnabled: (target: FormatterName, enabled: boolean) => void;
  setTargetVersion: (target: FormatterName, version: string | undefined) => void;
  setTargetConvention: (target: FormatterName, convention: ConventionType | undefined) => void;
  setFormatting: (formatting: Partial<FormattingSettings>) => void;
  setConfig: (config: PlaygroundConfig) => void;

  // UI actions
  setActiveFormatter: (formatter: FormatterName) => void;
  setShowErrors: (show: boolean) => void;
  setShowExamples: (show: boolean) => void;
  setShowConfig: (show: boolean) => void;
}

const DEFAULT_FILE = `@meta {
  id: "skills-example"
  syntax: "1.0.0"
}

@identity {
  """
  You are a development assistant with custom skills and commands.
  You help developers write better code through reviews and testing.
  """
}

@context {
  languages: ["TypeScript", "JavaScript"]
  runtime: "Node.js 20+"
  frameworks: ["React", "Vite"]
}

@skills {
  review: {
    description: "Review code for bugs and improvements"
    content: """
    When reviewing code:
    1. Check for potential bugs and edge cases
    2. Suggest performance improvements
    3. Verify error handling is complete
    4. Check for security vulnerabilities
    """
  }
  test: {
    description: "Run tests and analyze coverage"
    content: """
    When running tests:
    1. Execute the test suite with coverage
    2. Report failures clearly with context
    3. Suggest missing test cases
    4. Verify edge cases are covered
    """
  }
  refactor: {
    description: "Refactor code for better maintainability"
    content: """
    When refactoring:
    1. Identify code smells and duplication
    2. Apply SOLID principles
    3. Improve naming and readability
    4. Ensure tests still pass
    """
  }
}

@shortcuts {
  "/review": "Run the review skill on current file"
  "/test": "Run the test skill"
  "/refactor": "Refactor the selected code"
  "/docs": "Generate documentation for current file"
}

@standards {
  code: {
    languages: ["TypeScript"]
    testing: ["Vitest", "Testing Library"]
  }
  git: {
    format: "Conventional Commits"
    types: ["feat", "fix", "docs", "refactor", "test"]
  }
}

@restrictions {
  - "Always explain your reasoning before making changes"
  - "Ask for clarification when requirements are unclear"
  - "Never skip writing tests for new functionality"
}
`;

const DEFAULT_CONFIG: PlaygroundConfig = {
  targets: {
    github: { enabled: true, version: 'full' },
    claude: { enabled: true, version: 'full' },
    cursor: { enabled: true, version: 'standard' },
    antigravity: { enabled: true, version: 'frontmatter' },
  },
  formatting: {
    tabWidth: 2,
    proseWrap: 'preserve',
    printWidth: 80,
  },
};

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  // Initial state
  files: [{ path: 'project.prs', content: DEFAULT_FILE }],
  activeFile: 'project.prs',
  isCompiling: false,
  compileResult: null,
  lastCompileTime: null,
  config: DEFAULT_CONFIG,
  activeFormatter: 'github',
  showErrors: false,
  showExamples: false,
  showConfig: false,

  // File actions
  setActiveFile: (path) => set({ activeFile: path }),

  updateFile: (path, content) =>
    set((state) => ({
      files: state.files.map((f) => (f.path === path ? { ...f, content } : f)),
    })),

  addFile: (path, content) =>
    set((state) => ({
      files: [...state.files, { path, content }],
      activeFile: path,
    })),

  deleteFile: (path) =>
    set((state) => {
      const newFiles = state.files.filter((f) => f.path !== path);
      const newActiveFile =
        state.activeFile === path ? (newFiles[0]?.path ?? 'project.prs') : state.activeFile;
      return { files: newFiles, activeFile: newActiveFile };
    }),

  renameFile: (oldPath, newPath) =>
    set((state) => ({
      files: state.files.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f)),
      activeFile: state.activeFile === oldPath ? newPath : state.activeFile,
    })),

  setFiles: (files) =>
    set({
      files,
      activeFile: files[0]?.path ?? 'project.prs',
    }),

  // Compile actions
  setCompiling: (isCompiling) => set({ isCompiling }),

  setCompileResult: (result) =>
    set({
      compileResult: result,
      lastCompileTime: Date.now(),
      showErrors: result !== null && !result.success,
    }),

  // Config actions
  setTargetEnabled: (target, enabled) =>
    set((state) => ({
      config: {
        ...state.config,
        targets: {
          ...state.config.targets,
          [target]: { ...state.config.targets[target], enabled },
        },
      },
    })),

  setTargetVersion: (target, version) =>
    set((state) => ({
      config: {
        ...state.config,
        targets: {
          ...state.config.targets,
          [target]: { ...state.config.targets[target], version },
        },
      },
    })),

  setTargetConvention: (target, convention) =>
    set((state) => ({
      config: {
        ...state.config,
        targets: {
          ...state.config.targets,
          [target]: { ...state.config.targets[target], convention },
        },
      },
    })),

  setFormatting: (formatting) =>
    set((state) => ({
      config: {
        ...state.config,
        formatting: { ...state.config.formatting, ...formatting },
      },
    })),

  setConfig: (config) => set({ config }),

  // UI actions
  setActiveFormatter: (formatter) => set({ activeFormatter: formatter }),
  setShowErrors: (show) => set({ showErrors: show }),
  setShowExamples: (show) => set({ showExamples: show }),
  setShowConfig: (show) => set({ showConfig: show }),
}));

// Selectors
export const selectActiveFileContent = (state: PlaygroundState) =>
  state.files.find((f) => f.path === state.activeFile)?.content ?? '';

export const selectFilesAsMap = (state: PlaygroundState) => {
  const map: Record<string, string> = {};
  for (const file of state.files) {
    map[file.path] = file.content;
  }
  return map;
};

/**
 * Get all output files for a formatter.
 * Each formatter can produce multiple files (main + additional).
 */
export const selectOutputsForFormatter = (
  state: PlaygroundState,
  formatter: FormatterName
): FormatterOutput[] => {
  if (!state.compileResult?.outputs) return [];

  const outputMap = state.compileResult.outputs;
  const results: FormatterOutput[] = [];

  // Patterns to identify which formatter produced each file
  const formatterPatterns: Record<FormatterName, RegExp[]> = {
    claude: [
      /CLAUDE\.md$/,
      /\.claude\/rules\/.*\.md$/,
      /\.claude\/skills\/.*\.md$/,
      /\.claude\/memories\/.*\.md$/,
    ],
    github: [
      /\.github\/copilot-instructions\.md$/,
      /copilot-instructions\.md$/,
      /\.github\/instructions\/.*\.instructions\.md$/,
      /\.github\/prompts\/.*\.prompt\.md$/,
      /\.github\/skills\/.*\/SKILL\.md$/,
      /\.github\/agents\/.*\.md$/,
      /^AGENTS\.md$/,
    ],
    cursor: [/\.cursor\/rules\/.*\.mdc$/, /\.cursorrules$/],
    antigravity: [/\.agent\/rules\/.*\.md$/, /\.agent\/workflows\/.*\.md$/],
  };

  const patterns = formatterPatterns[formatter];
  for (const [path, output] of outputMap) {
    if (patterns.some((pattern) => pattern.test(path))) {
      results.push(output);
    }
  }

  // Sort: main file first, then alphabetically
  const mainFilePatterns: Record<FormatterName, string> = {
    claude: 'CLAUDE.md',
    github: 'copilot-instructions.md',
    cursor: 'instructions.mdc',
    antigravity: 'project.md',
  };

  const mainPattern = mainFilePatterns[formatter];
  results.sort((a, b) => {
    const aIsMain = a.path.endsWith(mainPattern);
    const bIsMain = b.path.endsWith(mainPattern);
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;
    return a.path.localeCompare(b.path);
  });

  return results;
};

/**
 * Get single output for a formatter (legacy selector for compatibility).
 */
export const selectOutputForFormatter = (
  state: PlaygroundState,
  formatter: FormatterName
): FormatterOutput | undefined => {
  const outputs = selectOutputsForFormatter(state, formatter);
  return outputs[0];
};

export const selectErrors = (state: PlaygroundState): CompileError[] =>
  state.compileResult?.errors ?? [];

export const selectHasErrors = (state: PlaygroundState): boolean =>
  (state.compileResult?.errors?.length ?? 0) > 0;

export const selectEnabledTargets = (state: PlaygroundState): FormatterName[] =>
  (Object.entries(state.config.targets) as [FormatterName, TargetSettings][])
    .filter(([, settings]) => settings.enabled)
    .map(([name]) => name);
