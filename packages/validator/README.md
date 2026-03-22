# @promptscript/validator

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

AST validation rules for PromptScript files.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## Validation Rules

| Code  | Rule name               | Severity | Description                                                                             |
| :---- | :---------------------- | :------- | :-------------------------------------------------------------------------------------- |
| PS001 | missing-meta            | error    | Every `.prs` file must declare a `@meta` block                                          |
| PS002 | duplicate-block         | error    | Block type may only appear once per file (unless the block explicitly allows multiples) |
| PS003 | invalid-block-field     | error    | Field name or value type does not match the block's schema                              |
| PS004 | missing-required-field  | error    | A required field is absent from a block                                                 |
| PS005 | invalid-syntax-version  | error    | The `syntax` field in `@meta` is not a valid semver string                              |
| PS006 | circular-inheritance    | error    | `@inherit` chain forms a cycle                                                          |
| PS007 | unresolved-import       | error    | `@use` or `@inherit` target cannot be resolved                                          |
| PS008 | unknown-registry        | warning  | Registry prefix is not declared in `promptscript.yaml`                                  |
| PS009 | deprecated-block        | warning  | Block type has been deprecated; a replacement is suggested                              |
| PS010 | empty-block             | warning  | Block contains no fields or content                                                     |
| PS011 | unknown-tool            | warning  | Tool name in `allowedTools` / `blockedTools` is not a recognised AI tool identifier     |
| PS012 | duplicate-shortcut-key  | error    | Two shortcuts share the same trigger key                                                |
| PS013 | duplicate-skill-id      | error    | Two skills share the same identifier within a resolved file                             |
| PS014 | invalid-url             | warning  | A field that expects a URL contains a value that does not parse as a valid URL          |
| PS015 | missing-skill-file      | error    | A skill references a `SKILL.md` path that does not exist on disk                        |
| PS016 | parameter-name-conflict | error    | A template parameter name shadows a built-in field name                                 |
| PS017 | unused-parameter        | warning  | A declared template parameter is never referenced in the file body                      |
| PS018 | syntax-version-compat   | warning  | Warns if declared syntax version is unknown; otherwise checks block compatibility       |
| PS019 | unknown-block-name      | warning  | Detects unknown block type names with typo suggestions (Levenshtein fuzzy matching)     |

## License

MIT
