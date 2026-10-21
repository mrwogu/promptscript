# @promptscript/validator

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

AST validation rules for PromptScript files.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## Validation Rules

| Code  | Rule name                    | Severity | Description                                                                             |
| :---- | :--------------------------- | :------- | :-------------------------------------------------------------------------------------- |
| PS001 | required-meta-id             | error    | @meta.id is required                                                                    |
| PS002 | required-meta-syntax         | error    | @meta.syntax is required                                                                |
| PS003 | valid-semver                 | error    | Syntax version must be valid semantic version                                           |
| PS004 | required-guards              | error    | Required guards must be present                                                         |
| PS005 | blocked-patterns             | error    | Content must not contain blocked patterns (prompt injection prevention)                 |
| PS006 | valid-path                   | error    | Path references must be valid                                                           |
| PS007 | deprecated                   | warning  | Warns about deprecated features                                                         |
| PS008 | empty-block                  | warning  | Blocks should have content                                                              |
| PS009 | valid-params                 | error    | Validate parameter definitions in @meta and typed block fields                          |
| PS010 | suspicious-urls              | warning  | Detect suspicious URLs (HTTP, shorteners, credential parameters, IDN homograph attacks) |
| PS011 | authority-injection          | error    | Detect authoritative override phrases that may indicate prompt injection                |
| PS012 | obfuscated-content           | warning  | Detect obfuscated content using sanitization pipeline (decode and check all encodings)  |
| PS013 | path-traversal               | error    | Detect path traversal attacks that could escape the intended directory                  |
| PS014 | unicode-security             | error    | Detect Unicode-based attacks (bidi overrides, zero-width, homoglyphs)                   |
| PS015 | skill-params                 | warning  | Validate parameter definitions in @skills block                                         |
| PS016 | skill-dependencies           | error    | Validate skill dependency declarations (requires)                                       |
| PS017 | skill-contracts              | warning  | Validate skill contract definitions (inputs/outputs)                                    |
| PS018 | syntax-version-compat        | warning  | Check syntax version compatibility with used blocks and features                        |
| PS019 | unknown-block-name           | warning  | Detect unknown block type names with typo suggestions                                   |
| PS020 | duplicate-skills             | error    | Detect duplicate skill names across @use imports                                        |
| PS021 | use-block-filter             | error    | Validate only/exclude/includes/excludes filter parameters on @use directives            |
| PS022 | circular-guard-requires      | warning  | Detect circular dependencies in guard requires chains                                   |
| PS023 | valid-examples               | warning  | Validate that example entries have required input and output fields                     |
| PS024 | valid-guard-requires         | warning  | Validate that guard requires references point to existing guards                        |
| PS025 | valid-skill-references       | warning  | Skill references must have valid paths and allowed file types                           |
| PS026 | safe-reference-content       | warning  | Reference files should contain data, not PRS directives                                 |
| PS027 | valid-skill-composition      | warning  | Skill composition must be valid: no conflicting phase names, no excessive phases        |
| PS028 | valid-append-negation        | warning  | Negation prefix ! in append properties is only effective in @extend blocks              |
| PS029 | valid-sealed-property        | warning  | Sealed property names must be replace-strategy properties                               |
| PS030 | policy-compliance            | error    | Extension compliance policies must be satisfied                                         |
| PS031 | reference-integrity          | warning  | Registry reference files must have integrity hashes in lockfile                         |
| PS032 | valid-skill-resources        | warning  | Skill scripts and references must have safe paths                                       |
| PS033 | valid-agent-config           | warning  | Agent fields must match portable and target-specific schemas                            |
| PS034 | valid-hooks                  | warning  | Hook definitions must match the portable hooks schema                                   |
| PS035 | valid-mcp-servers            | warning  | MCP server definitions must match the portable schema                                   |
| PS036 | valid-plugins                | warning  | Plugin definitions must match the portable schema                                       |
| PS037 | valid-section-headers        | error    | Validate contextual section header overrides                                            |
| PS038 | valid-block-shape            | warning  | Built-in blocks must use supported canonical content shapes                             |
| PS039 | agent-namespaces             | error    | Namespaced agent names must be well-formed and match provenance                         |
| PS040 | import-excludes              | error    | Import validation excludes must match the commit pinned in the lockfile                 |
| PS041 | valid-model-reference        | warning  | Model references must name served models from the project model set                     |
| PS042 | valid-prompt-definition      | error    | Validate @prompts entries, contracts and governance (the parser rejects "**proto**")    |
| PS043 | unresolved-prompt-slot       | error    | Runtime slots in prompt text must name declared inputs                                  |
| PS044 | unused-prompt-declaration    | warning  | Declared prompt inputs should be used in the prompt text                                |
| PS045 | unresolved-template-variable | warning  | Template variables left in resolved text are printed literally                          |
| PS046 | slot-in-system-message       | warning  | Runtime slots belong in the user message, not the system message                        |

The table is taken from `src/rules/index.ts`. PS005, PS010, PS011, PS012 and PS014 also scan the text of `@prompts` entries.

## License

MIT
