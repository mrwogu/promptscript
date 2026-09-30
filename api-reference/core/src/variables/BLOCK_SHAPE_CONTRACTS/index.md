# BLOCK_SHAPE_CONTRACTS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: BLOCK\_SHAPE\_CONTRACTS

> `const` **BLOCK\_SHAPE\_CONTRACTS**: `object`

Defined in: [core/src/block-shapes.ts:31](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/block-shapes.ts#L31)

Canonical and compatibility shapes for every built-in block.

Custom blocks intentionally remain open-world and are absent from this registry.

## Type Declaration

### agents

> `readonly` **agents**: `object`

#### agents.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### agents.example

> `readonly` **example**: "@agents \{ reviewer: \{ description: \"Review code\" content: \"\"\"Review changes.\"\"\" \} \}" = `'@agents { reviewer: { description: "Review code" content: """Review changes.""" } }'`

#### agents.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### agents.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### commands

> `readonly` **commands**: `object`

#### commands.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### commands.example

> `readonly` **example**: "@commands \{ \"/test\": \{ content: \"\"\"Run tests.\"\"\" \} \}" = `'@commands { "/test": { content: """Run tests.""" } }'`

#### commands.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### commands.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### context

> `readonly` **context**: `object`

#### context.canonicalShape

> `readonly` **canonicalShape**: `"mixed"` = `'mixed'`

#### context.example

> `readonly` **example**: "@context \{ project: \"Example\" \"\"\"Additional project context.\"\"\" \}" = `'@context { project: "Example" """Additional project context.""" }'`

#### context.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### context.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"text"`, `"object"`, `"mixed"`\]

### examples

> `readonly` **examples**: `object`

#### examples.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### examples.example

> `readonly` **example**: "@examples \{ basic: \{ input: \"Before\" output: \"After\" \} \}" = `'@examples { basic: { input: "Before" output: "After" } }'`

#### examples.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### examples.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### guards

> `readonly` **guards**: `object`

#### guards.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### guards.example

> `readonly` **example**: "@guards \{ globs: \[\"\*\*/\*.ts\"\] \}" = `'@guards { globs: ["**/*.ts"] }'`

#### guards.legacyShapes

> `readonly` **legacyShapes**: readonly \[`"mixed"`\]

#### guards.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`, `"mixed"`\]

### hooks

> `readonly` **hooks**: `object`

#### hooks.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### hooks.example

> `readonly` **example**: "@hooks \{ validate: \{ event: \"pre-tool-use\" command: \[\"pnpm\", \"test\"\] \} \}" = `'@hooks { validate: { event: "pre-tool-use" command: ["pnpm", "test"] } }'`

#### hooks.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### hooks.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### identity

> `readonly` **identity**: `object`

#### identity.canonicalShape

> `readonly` **canonicalShape**: `"text"` = `'text'`

#### identity.example

> `readonly` **example**: "@identity \{ \"\"\"You are a helpful assistant.\"\"\" \}" = `'@identity { """You are a helpful assistant.""" }'`

#### identity.legacyShapes

> `readonly` **legacyShapes**: readonly \[`"object"`, `"mixed"`\]

#### identity.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"text"`, `"object"`, `"mixed"`\]

### knowledge

> `readonly` **knowledge**: `object`

#### knowledge.canonicalShape

> `readonly` **canonicalShape**: `"text"` = `'text'`

#### knowledge.example

> `readonly` **example**: "@knowledge \{ \"\"\"Project reference material.\"\"\" \}" = `'@knowledge { """Project reference material.""" }'`

#### knowledge.legacyShapes

> `readonly` **legacyShapes**: readonly \[`"object"`, `"mixed"`\]

#### knowledge.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"text"`, `"object"`, `"mixed"`\]

### local

> `readonly` **local**: `object`

#### local.canonicalShape

> `readonly` **canonicalShape**: `"text"` = `'text'`

#### local.example

> `readonly` **example**: "@local \{ \"\"\"Private project instructions.\"\"\" \}" = `'@local { """Private project instructions.""" }'`

#### local.legacyShapes

> `readonly` **legacyShapes**: readonly \[`"object"`, `"mixed"`\]

#### local.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"text"`, `"object"`, `"mixed"`\]

### mcpServers

> `readonly` **mcpServers**: `object`

#### mcpServers.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### mcpServers.example

> `readonly` **example**: "@mcpServers \{ local: \{ transport: \"stdio\" command: \[\"node\", \"server.mjs\"\] \} \}" = `'@mcpServers { local: { transport: "stdio" command: ["node", "server.mjs"] } }'`

#### mcpServers.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### mcpServers.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### params

> `readonly` **params**: `object`

#### params.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### params.example

> `readonly` **example**: `"@params { strictness: range(1..5) = 3 }"` = `'@params { strictness: range(1..5) = 3 }'`

#### params.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### params.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### plugins

> `readonly` **plugins**: `object`

#### plugins.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### plugins.example

> `readonly` **example**: "@plugins \{ quality: \{ skills: \[\"review\"\] \} \}" = `'@plugins { quality: { skills: ["review"] } }'`

#### plugins.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### plugins.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### prompts

> `readonly` **prompts**: `object`

#### prompts.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### prompts.example

> `readonly` **example**: "@prompts \{ review: \{ content: \"\"\"Review changes.\"\"\" \} \}" = `'@prompts { review: { content: """Review changes.""" } }'`

#### prompts.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### prompts.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### restrictions

> `readonly` **restrictions**: `object`

#### restrictions.canonicalShape

> `readonly` **canonicalShape**: `"array"` = `'array'`

#### restrictions.example

> `readonly` **example**: "@restrictions \{ - \"Never expose secrets\" \}" = `'@restrictions { - "Never expose secrets" }'`

#### restrictions.legacyShapes

> `readonly` **legacyShapes**: readonly \[`"text"`, `"object"`, `"mixed"`\]

#### restrictions.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"array"`, `"text"`, `"object"`, `"mixed"`\]

### shortcuts

> `readonly` **shortcuts**: `object`

#### shortcuts.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### shortcuts.example

> `readonly` **example**: "@shortcuts \{ \"/test\": \{ content: \"\"\"Run tests.\"\"\" \} \}" = `'@shortcuts { "/test": { content: """Run tests.""" } }'`

#### shortcuts.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### shortcuts.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### skills

> `readonly` **skills**: `object`

#### skills.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### skills.example

> `readonly` **example**: "@skills \{ review: \{ description: \"Review code\" content: \"\"\"Review changes.\"\"\" \} \}" = `'@skills { review: { description: "Review code" content: """Review changes.""" } }'`

#### skills.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### skills.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`

### standards

> `readonly` **standards**: `object`

#### standards.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### standards.example

> `readonly` **example**: "@standards \{ code: \[\"Use strict TypeScript\"\] \}" = `'@standards { code: ["Use strict TypeScript"] }'`

#### standards.legacyShapes

> `readonly` **legacyShapes**: readonly \[`"mixed"`, `"text"`\]

#### standards.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`, `"mixed"`, `"text"`\]

### workflows

> `readonly` **workflows**: `object`

#### workflows.canonicalShape

> `readonly` **canonicalShape**: `"object"` = `'object'`

#### workflows.example

> `readonly` **example**: "@workflows \{ release: \{ description: \"Prepare release\" content: \"\"\"Run checks.\"\"\" \} \}" = `'@workflows { release: { description: "Prepare release" content: """Run checks.""" } }'`

#### workflows.legacyShapes

> `readonly` **legacyShapes**: readonly \[\] = `[]`

#### workflows.supportedShapes

> `readonly` **supportedShapes**: readonly \[`"object"`\] = `OBJECT_ONLY_SHAPES`