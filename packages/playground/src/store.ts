import { create } from 'zustand';
import type { CompileResult, CompileError } from '@promptscript/browser-compiler';
import type { FormatterOutput } from '@promptscript/formatters';

export type FormatterName =
  | 'github'
  | 'claude'
  | 'cursor'
  | 'antigravity'
  | 'factory'
  | 'opencode'
  | 'gemini'
  | 'windsurf'
  | 'cline'
  | 'roo'
  | 'codex'
  | 'continue'
  | 'augment'
  | 'goose'
  | 'kilo'
  | 'amp'
  | 'trae'
  | 'junie'
  | 'kiro'
  | 'cortex'
  | 'crush'
  | 'command-code'
  | 'kode'
  | 'mcpjam'
  | 'mistral-vibe'
  | 'mux'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'zencoder'
  | 'neovate'
  | 'pochi'
  | 'adal'
  | 'iflow'
  | 'openclaw'
  | 'codebuddy'
  | 'droid';

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
  /**
   * Simulated environment variables for interpolation.
   * These are used to replace ${VAR} and ${VAR:-default} syntax in source files.
   */
  envVars: Record<string, string>;
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
  showEnvVars: boolean;

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

  // Env vars actions
  setEnvVar: (name: string, value: string) => void;
  deleteEnvVar: (name: string) => void;
  setEnvVars: (vars: Record<string, string>) => void;

  // UI actions
  setActiveFormatter: (formatter: FormatterName) => void;
  setShowErrors: (show: boolean) => void;
  setShowExamples: (show: boolean) => void;
  setShowConfig: (show: boolean) => void;
  setShowEnvVars: (show: boolean) => void;
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
    factory: { enabled: false, version: 'simple' },
    opencode: { enabled: false, version: 'full' },
    gemini: { enabled: false, version: 'full' },
    windsurf: { enabled: false, version: 'simple' },
    cline: { enabled: false, version: 'simple' },
    roo: { enabled: false, version: 'simple' },
    codex: { enabled: false, version: 'simple' },
    continue: { enabled: false, version: 'simple' },
    augment: { enabled: false, version: 'simple' },
    goose: { enabled: false, version: 'simple' },
    kilo: { enabled: false, version: 'simple' },
    amp: { enabled: false, version: 'simple' },
    trae: { enabled: false, version: 'simple' },
    junie: { enabled: false, version: 'simple' },
    kiro: { enabled: false, version: 'simple' },
    cortex: { enabled: false, version: 'simple' },
    crush: { enabled: false, version: 'simple' },
    'command-code': { enabled: false, version: 'simple' },
    kode: { enabled: false, version: 'simple' },
    mcpjam: { enabled: false, version: 'simple' },
    'mistral-vibe': { enabled: false, version: 'simple' },
    mux: { enabled: false, version: 'simple' },
    openhands: { enabled: false, version: 'simple' },
    pi: { enabled: false, version: 'simple' },
    qoder: { enabled: false, version: 'simple' },
    'qwen-code': { enabled: false, version: 'simple' },
    zencoder: { enabled: false, version: 'simple' },
    neovate: { enabled: false, version: 'simple' },
    pochi: { enabled: false, version: 'simple' },
    adal: { enabled: false, version: 'simple' },
    iflow: { enabled: false, version: 'simple' },
    openclaw: { enabled: false, version: 'simple' },
    codebuddy: { enabled: false, version: 'simple' },
    droid: { enabled: false, version: 'simple' },
  },
  formatting: {
    tabWidth: 2,
    proseWrap: 'preserve',
    printWidth: 80,
  },
  envVars: {},
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
  showEnvVars: false,

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

  // Env vars actions
  setEnvVar: (name, value) =>
    set((state) => ({
      config: {
        ...state.config,
        envVars: { ...state.config.envVars, [name]: value },
      },
    })),

  deleteEnvVar: (name) =>
    set((state) => {
      const { [name]: _deleted, ...rest } = state.config.envVars;
      void _deleted; // Intentionally unused - destructuring to remove key
      return {
        config: {
          ...state.config,
          envVars: rest,
        },
      };
    }),

  setEnvVars: (vars) =>
    set((state) => ({
      config: {
        ...state.config,
        envVars: vars,
      },
    })),

  // UI actions
  setActiveFormatter: (formatter) => set({ activeFormatter: formatter }),
  setShowErrors: (show) => set({ showErrors: show }),
  setShowExamples: (show) => set({ showExamples: show }),
  setShowConfig: (show) => set({ showConfig: show }),
  setShowEnvVars: (show) => set({ showEnvVars: show }),
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
    factory: [/^AGENTS\.md$/, /\.factory\/skills\/.*\/SKILL\.md$/],
    opencode: [
      /^OPENCODE\.md$/,
      /\.opencode\/commands\/.*\.md$/,
      /\.opencode\/skills\/.*\/SKILL\.md$/,
      /\.opencode\/agents\/.*\.md$/,
    ],
    gemini: [/^GEMINI\.md$/, /\.gemini\/commands\/.*\.toml$/, /\.gemini\/skills\/.*\/skill\.md$/],
    windsurf: [/^\.windsurf\/rules\/.*\.md$/, /^\.windsurf\/skills\/.*\.md$/],
    cline: [/^\.clinerules$/, /^\.agents\/skills\/.*\.md$/],
    roo: [/^\.roorules$/, /^\.roo\/skills\/.*\.md$/],
    codex: [/^AGENTS\.md$/, /^\.agents\/skills\/.*\.md$/],
    continue: [/^\.continue\/rules\/.*\.md$/, /^\.continue\/skills\/.*\.md$/],
    augment: [/^\.augment\/rules\/.*\.md$/, /^\.augment\/skills\/.*\.md$/],
    goose: [/^\.goose\/rules\/.*\.md$/, /^\.goose\/skills\/.*\.md$/],
    kilo: [/^\.kilocode\/rules\/.*\.md$/, /^\.kilocode\/skills\/.*\.md$/],
    amp: [/^AGENTS\.md$/, /^\.agents\/skills\/.*\.md$/],
    trae: [/^\.trae\/rules\/.*\.md$/, /^\.trae\/skills\/.*\.md$/],
    junie: [/^\.junie\/rules\/.*\.md$/, /^\.junie\/skills\/.*\.md$/],
    kiro: [/^\.kiro\/rules\/.*\.md$/, /^\.kiro\/skills\/.*\.md$/],
    cortex: [/^\.cortex\/rules\/.*\.md$/, /^\.cortex\/skills\/.*\.md$/],
    crush: [/^\.crush\/rules\/.*\.md$/, /^\.crush\/skills\/.*\.md$/],
    'command-code': [/^\.commandcode\/rules\/.*\.md$/, /^\.commandcode\/skills\/.*\.md$/],
    kode: [/^\.kode\/rules\/.*\.md$/, /^\.kode\/skills\/.*\.md$/],
    mcpjam: [/^\.mcpjam\/rules\/.*\.md$/, /^\.mcpjam\/skills\/.*\.md$/],
    'mistral-vibe': [/^\.vibe\/rules\/.*\.md$/, /^\.vibe\/skills\/.*\.md$/],
    mux: [/^\.mux\/rules\/.*\.md$/, /^\.mux\/skills\/.*\.md$/],
    openhands: [/^\.openhands\/rules\/.*\.md$/, /^\.openhands\/skills\/.*\.md$/],
    pi: [/^\.pi\/rules\/.*\.md$/, /^\.pi\/skills\/.*\.md$/],
    qoder: [/^\.qoder\/rules\/.*\.md$/, /^\.qoder\/skills\/.*\.md$/],
    'qwen-code': [/^\.qwen\/rules\/.*\.md$/, /^\.qwen\/skills\/.*\.md$/],
    zencoder: [/^\.zencoder\/rules\/.*\.md$/, /^\.zencoder\/skills\/.*\.md$/],
    neovate: [/^\.neovate\/rules\/.*\.md$/, /^\.neovate\/skills\/.*\.md$/],
    pochi: [/^\.pochi\/rules\/.*\.md$/, /^\.pochi\/skills\/.*\.md$/],
    adal: [/^\.adal\/rules\/.*\.md$/, /^\.adal\/skills\/.*\.md$/],
    iflow: [/^\.iflow\/rules\/.*\.md$/, /^\.iflow\/skills\/.*\.md$/],
    openclaw: [/^INSTRUCTIONS\.md$/, /^skills\/.*\.md$/],
    codebuddy: [/^\.codebuddy\/rules\/.*\.md$/, /^\.codebuddy\/skills\/.*\.md$/],
    droid: [/^AGENTS\.md$/, /^\.factory\/skills\/.*\.md$/],
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
    factory: 'AGENTS.md',
    opencode: 'OPENCODE.md',
    gemini: 'GEMINI.md',
    windsurf: 'project.md',
    cline: '.clinerules',
    roo: '.roorules',
    codex: 'AGENTS.md',
    continue: 'project.md',
    augment: 'project.md',
    goose: 'project.md',
    kilo: 'project.md',
    amp: 'AGENTS.md',
    trae: 'project.md',
    junie: 'project.md',
    kiro: 'project.md',
    cortex: 'project.md',
    crush: 'project.md',
    'command-code': 'project.md',
    kode: 'project.md',
    mcpjam: 'project.md',
    'mistral-vibe': 'project.md',
    mux: 'project.md',
    openhands: 'project.md',
    pi: 'project.md',
    qoder: 'project.md',
    'qwen-code': 'project.md',
    zencoder: 'project.md',
    neovate: 'project.md',
    pochi: 'project.md',
    adal: 'project.md',
    iflow: 'project.md',
    openclaw: 'INSTRUCTIONS.md',
    codebuddy: 'project.md',
    droid: 'AGENTS.md',
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
