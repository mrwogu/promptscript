# PromptScript for VS Code

Syntax highlighting and language support for [PromptScript](https://getpromptscript.dev/) `.prs` files.

## Features

- Syntax highlighting for all PromptScript constructs
- Bracket matching and auto-closing for `{}`, `[]`, `()`, `""`, `''`, `{{}}`
- Code folding for `@block { }` directives
- Comment toggling with `Cmd+/` / `Ctrl+/`
- Auto-indentation inside blocks
- File icon for `.prs` files in the explorer

## Highlighted Elements

| Element               | Example                                                  |
| --------------------- | -------------------------------------------------------- |
| Directives            | `@meta`, `@inherit`, `@use`, `@extend`                   |
| Block names           | `@identity`, `@standards`, `@restrictions`               |
| Imports               | `@org/path`, `./relative`, `domain.tld/path`             |
| Strings               | `"double"`, `'single'`, `"""triple"""`                   |
| Template variables    | `{{variable}}`                                           |
| Environment variables | `${NODE_ENV}`, `${PORT:-3000}`                           |
| Constants             | `true`, `false`, `null`                                  |
| Types                 | `string`, `number`, `boolean`, `enum(...)`, `range(...)` |
| Comments              | `# line comment`                                         |

## Learn More

- [PromptScript Documentation](https://getpromptscript.dev/latest/)
- [Language Reference](https://getpromptscript.dev/latest/reference/language/)
- [GitHub Repository](https://github.com/mrwogu/promptscript)
