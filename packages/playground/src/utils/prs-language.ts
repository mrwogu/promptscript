/**
 * Monaco language definition for PromptScript (.prs) files.
 */

import type * as Monaco from 'monaco-editor';

export const PRS_LANGUAGE_ID = 'promptscript';

/**
 * PRS language tokens configuration for Monaco editor.
 */
export const prsLanguageDefinition: Monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.prs',

  keywords: ['true', 'false', 'null'],

  // Directive names
  directives: [
    '@meta',
    '@inherit',
    '@extend',
    '@use',
    '@identity',
    '@context',
    '@standards',
    '@restrictions',
    '@guardrails',
    '@shortcuts',
    '@tools',
    '@skills',
    '@knowledge',
    '@examples',
    '@output',
    '@behavior',
    '@memory',
  ],

  // Operators and symbols
  operators: [':'],
  symbols: /[=><!~?:&|+\-*/^%]+/,

  // Escapes in strings
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // Tokenizer rules
  tokenizer: {
    root: [
      // Comments
      [/#.*$/, 'comment'],

      // Directives
      [
        /@\w+/,
        {
          cases: {
            '@directives': 'keyword.directive',
            '@default': 'keyword.directive',
          },
        },
      ],

      // Identifiers and keywords
      [
        /[a-zA-Z_][\w-]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/:/, 'delimiter'],
      [/,/, 'delimiter'],

      // Numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],

      // Strings
      [/"""/, 'string', '@multilineString'],
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/#.*$/, 'comment'],
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],

    multilineString: [
      [/[^"]+/, 'string'],
      [/"""/, 'string', '@pop'],
      [/"/, 'string'],
    ],
  },
};

/**
 * PRS language configuration for Monaco editor.
 */
export const prsLanguageConfiguration: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
  folding: {
    markers: {
      start: /^\s*@\w+\s*\{/,
      end: /^\s*\}/,
    },
  },
};

/**
 * PRS theme rules for proper syntax highlighting.
 */
export const prsThemeRules: Monaco.editor.ITokenThemeRule[] = [
  { token: 'keyword.directive', foreground: '818cf8', fontStyle: 'bold' },
  { token: 'keyword', foreground: '93c5fd' },
  { token: 'string', foreground: 'a3e635' },
  { token: 'string.escape', foreground: 'facc15' },
  { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
  { token: 'number', foreground: 'f472b6' },
  { token: 'identifier', foreground: 'f8fafc' },
  { token: 'delimiter', foreground: '94a3b8' },
];

/**
 * Register the PRS language with Monaco editor.
 */
export function registerPrsLanguage(monaco: typeof Monaco): void {
  // Check if already registered
  const languages = monaco.languages.getLanguages();
  if (languages.some((l: { id: string }) => l.id === PRS_LANGUAGE_ID)) {
    return;
  }

  // Register the language
  monaco.languages.register({
    id: PRS_LANGUAGE_ID,
    extensions: ['.prs'],
    aliases: ['PromptScript', 'prs'],
    mimetypes: ['text/x-promptscript'],
  });

  // Set language tokens
  monaco.languages.setMonarchTokensProvider(PRS_LANGUAGE_ID, prsLanguageDefinition);

  // Set language configuration
  monaco.languages.setLanguageConfiguration(PRS_LANGUAGE_ID, prsLanguageConfiguration);

  // Define custom theme with PRS-specific rules
  monaco.editor.defineTheme('prs-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: prsThemeRules,
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#f8fafc',
      'editor.lineHighlightBackground': '#1e293b',
      'editorCursor.foreground': '#6366f1',
      'editor.selectionBackground': '#334155',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94a3b8',
    },
  });
}

/**
 * Get autocomplete suggestions for PRS.
 */
export function createPrsCompletionProvider(
  monaco: typeof Monaco
): Monaco.languages.CompletionItemProvider {
  return {
    provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: Monaco.languages.CompletionItem[] = [
        // Directives
        {
          label: '@meta',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@meta {\n  id: "$1"\n  syntax: "1.0.0"\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define metadata for the PromptScript file',
          range,
        },
        {
          label: '@inherit',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@inherit $1',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Inherit from another PromptScript file',
          range,
        },
        {
          label: '@use',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@use $1',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Import and merge directives from another file',
          range,
        },
        {
          label: '@identity',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@identity {\n  """\n  $1\n  """\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define the AI identity/persona',
          range,
        },
        {
          label: '@context',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@context {\n  """\n  $1\n  """\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Provide contextual information',
          range,
        },
        {
          label: '@standards',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@standards {\n  $1: [$2]\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define coding standards and guidelines',
          range,
        },
        {
          label: '@restrictions',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@restrictions {\n  - "$1"\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define things the AI should NOT do',
          range,
        },
        {
          label: '@shortcuts',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@shortcuts {\n  "/$1": "$2"\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define custom command shortcuts',
          range,
        },
        {
          label: '@tools',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: '@tools {\n  $1: {\n    description: "$2"\n  }\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define available tools',
          range,
        },
        {
          label: '@examples',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText:
            '@examples {\n  $1: {\n    input: """\n    $2\n    """\n    output: """\n    $3\n    """\n  }\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Provide example interactions',
          range,
        },
      ];

      return { suggestions };
    },
  };
}
