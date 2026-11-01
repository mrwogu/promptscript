# PromptScriptConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptScriptConfig

Defined in: [core/src/types/config.ts:364](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L364)

PromptScript configuration file (promptscript.yaml).

## Properties

### builds?

> `optional` **builds?**: `Record`\<`string`, [`BuildProfileConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/BuildProfileConfig/index.md)\>

Defined in: [core/src/types/config.ts:523](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L523)

Named per-command build profiles.
Profiles let one repository build multiple instruction artifacts to
different target directories without changing the default project compile.

***

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [core/src/types/config.ts:572](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L572)

Custom convention definitions.
Register custom conventions that can be referenced by name in targets.

***

### description?

> `optional` **description?**: `string`

Defined in: [core/src/types/config.ts:372](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L372)

Project description

***

### eval?

> `optional` **eval?**: [`EvalConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalConfig/index.md)

Defined in: [core/src/types/config.ts:598](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L598)

Eval settings: providers and run limits.

#### Example

```ts
eval:
  providers:
    anthropic: { kind: anthropic, apiKeyEnvVar: ANTHROPIC_API_KEY }
```

***

### extends?

> `optional` **extends?**: `string`

Defined in: [core/src/types/config.ts:382](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L382)

Extend another configuration file.
Paths are resolved relative to the current config file.

#### Example

```ts
extends: '../base-config.yaml'
```

***

### formatting?

> `optional` **formatting?**: [`FormattingConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/FormattingConfig/index.md)

Defined in: [core/src/types/config.ts:550](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L550)

Formatting configuration.
Controls how generated markdown files are formatted.

#### Example

```ts
formatting:
  prettier: true  # Auto-detect .prettierrc

formatting:
  tabWidth: 4
  proseWrap: always
```

***

### governance?

> `optional` **governance?**: [`GovernanceConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceConfig/index.md)

Defined in: [core/src/types/config.ts:607](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L607)

Governance settings: admins and approval roles.

#### Example

```ts
governance:
  admins: ['@acme/prompt-platform']
  roles: { legal: ['@acme/legal'] }
```

***

### id

> **id**: `string`

Defined in: [core/src/types/config.ts:366](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L366)

Project identifier

***

### includePromptScriptSkill?

> `optional` **includePromptScriptSkill?**: `boolean`

Defined in: [core/src/types/config.ts:631](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L631)

Include the bundled PromptScript language skill in compilation output.
When enabled, the SKILL.md that teaches AI agents how to work with .prs files
is automatically added to each target's native skill directory.

#### Default

```ts
true
```

***

### inherit?

> `optional` **inherit?**: `string`

Defined in: [core/src/types/config.ts:385](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L385)

Inheritance path

***

### input?

> `optional` **input?**: `object`

Defined in: [core/src/types/config.ts:391](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L391)

Input file configuration.
Controls which PromptScript files to compile.

#### entry?

> `optional` **entry?**: `string`

Entry file path (defaults to '.promptscript/project.prs')

#### exclude?

> `optional` **exclude?**: `string`[]

Glob patterns for files to exclude

#### include?

> `optional` **include?**: `string`[]

Glob patterns for additional files to include

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [core/src/types/config.ts:581](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L581)

Model catalog settings: the model set the instructions are written for
and custom model profiles.

#### Example

```ts
models:
  supported: [claude-opus-5-5, gpt-6-sol]
```

***

### output?

> `optional` **output?**: `object`

Defined in: [core/src/types/config.ts:503](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L503)

Output configuration.
Global output settings applied to all targets.

#### baseDir?

> `optional` **baseDir?**: `string`

Base directory for all output files

#### header?

> `optional` **header?**: `string`

Custom header to prepend to generated files

#### overwrite?

> `optional` **overwrite?**: `boolean`

Whether to overwrite existing files without warning

#### resources?

> `optional` **resources?**: [`OutputResourceKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputResourceKind/index.md)[]

Compile only selected resource kinds (agents, skills, commands, mcp,
hooks, plugins, main). A global install can emit agent and skill
directories without unrelated root instruction files.

***

### policies?

> `optional` **policies?**: [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

Defined in: [core/src/types/config.ts:672](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L672)

Policies for skill extensions and prompts

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [core/src/types/config.ts:482](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L482)

Named registry aliases for multi-source imports.
Maps alias names to Git repository URLs.
Coexists with `registry` - aliases take precedence for matching paths.

***

### registry?

> `optional` **registry?**: `object`

Defined in: [core/src/types/config.ts:401](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L401)

Registry configuration

#### auth?

> `optional` **auth?**: `object`

Authentication for HTTP registries

##### auth.token?

> `optional` **token?**: `string`

Token for bearer auth, or "username:password" for basic auth

##### auth.tokenEnvVar?

> `optional` **tokenEnvVar?**: `string`

Environment variable containing the token (alternative to token)

##### auth.type

> **type**: `"bearer"` \| `"basic"`

Authentication type

#### cache?

> `optional` **cache?**: `object`

Cache settings

##### cache.enabled?

> `optional` **enabled?**: `boolean`

Whether caching is enabled

##### cache.ttl?

> `optional` **ttl?**: `number`

Cache TTL in milliseconds

#### git?

> `optional` **git?**: `object`

Git repository configuration.
When specified, the registry will be cloned from a Git repository.

##### git.auth?

> `optional` **auth?**: `object`

Authentication options for private repositories

##### git.auth.sshKeyPath?

> `optional` **sshKeyPath?**: `string`

Path to SSH key (for SSH auth).

###### Default

```ts
'~/.ssh/id_rsa'
```

##### git.auth.token?

> `optional` **token?**: `string`

Personal access token (for token auth)

##### git.auth.tokenEnvVar?

> `optional` **tokenEnvVar?**: `string`

Environment variable containing the token

##### git.auth.type

> **type**: `"token"` \| `"ssh"`

Authentication type.
- 'token': Use a personal access token (PAT)
- 'ssh': Use SSH key authentication

##### git.fallbackUrl?

> `optional` **fallbackUrl?**: `string`

Fallback Git URL to try when the primary `url` fails with an auth error.
Useful when the registry references an HTTPS URL but the user authenticates
via SSH (or vice versa).

###### Example

```ts
registry:
  git:
    url: 'https://github.com/org/registry.git'
    fallbackUrl: 'git@github.com:org/registry.git'
```

##### git.path?

> `optional` **path?**: `string`

Subdirectory within the repository to use as registry root.

###### Example

```ts
'registry/'
```

##### git.ref?

> `optional` **ref?**: `string`

Git ref to checkout (branch, tag, or commit hash).

###### Default

```ts
'main'
```

##### git.timeout?

> `optional` **timeout?**: `number`

Maximum wall-clock time in milliseconds for each Git operation.
Defaults to 60000; can also be raised globally via PROMPTSCRIPT_GIT_TIMEOUT.

##### git.url

> **url**: `string`

Git repository URL (HTTPS or SSH)

#### path?

> `optional` **path?**: `string`

Local path to registry

#### url?

> `optional` **url?**: `string`

Remote URL (HTTP registry)

***

### releases?

> `optional` **releases?**: [`ReleasesConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ReleasesConfig/index.md)

Defined in: [core/src/types/config.ts:589](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L589)

Release settings for prompt bundles.

#### Example

```ts
releases:
  environments: [staging, prod]
```

***

### skillTargets?

> `optional` **skillTargets?**: `Record`\<`string`, `string`\>

Defined in: [core/src/types/config.ts:537](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L537)

Per-source output directories for `@use` imports.

Maps a `@use` source string (matching the path's `raw` value) to a
relative directory underneath each target's skill output location.
An inline `into "<path>"` on the same `@use` declaration overrides
the configured value.

#### Example

```ts
skillTargets:
  "github.com/coreyhaines31/marketingskills/skills/seo-audit": "skills/seo-audit"
```

***

### syntax

> **syntax**: `string`

Defined in: [core/src/types/config.ts:369](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L369)

PromptScript syntax version

***

### targets?

> `optional` **targets?**: [`TargetEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetEntry/index.md)[]

Defined in: [core/src/types/config.ts:566](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L566)

Output targets.

Optional only when every target lives in a named build profile: such
builds-only projects compile through `--build <name>` or `--all-builds`.

Can be simple names or objects with configuration:

#### Example

```ts
targets:
  - github
  - claude:
      convention: markdown
      output: custom/CLAUDE.md
```

***

### telemetry?

> `optional` **telemetry?**: `boolean`

Defined in: [core/src/types/config.ts:375](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L375)

Enable anonymous aggregate usage telemetry for this project

***

### universalDir?

> `optional` **universalDir?**: `string` \| `boolean`

Defined in: [core/src/types/config.ts:623](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L623)

Universal directory for auto-discovering skills and commands.
Skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.

- `true` or omitted: Use default `.agents/` directory
- `false`: Disable universal directory discovery
- `string`: Custom path (relative to project root)

#### Default

```ts
'.agents'
```

#### Example

```ts
universalDir: true           # Use .agents/ (default)
universalDir: '.my-agents'   # Custom directory
universalDir: false          # Disable
```

***

### validation?

> `optional` **validation?**: `object`

Defined in: [core/src/types/config.ts:634](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L634)

Validation settings

#### allowedPatterns?

> `optional` **allowedPatterns?**: `string`[]

Pattern sources exempt from blocked-patterns detection. A pattern is
subtracted from the active set when its source text matches an entry
exactly. Mirror of blockedPatterns for exceptions.

##### Example

```ts
allowedPatterns:
  - 'bypass\s+(your\s+)?(rules|restrictions)'
```

#### excludes?

> `optional` **excludes?**: [`ValidationExclude`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidationExclude/index.md)[]

Rule exclusions for specific imports, bound to the pinned commit.

##### Example

```ts
excludes:
  - import: github.com/cloudflare/skills
    commit: 1a2b3c4d5e6f...
    rules: [blocked-patterns, authority-injection]
```

#### guardRequiresDepth?

> `optional` **guardRequiresDepth?**: `number`

Maximum depth for recursive guard requires resolution. Default: 3.
Must be >= 1. Values <= 0 are clamped to 1 by the resolver.

#### requiredGuards?

> `optional` **requiredGuards?**: `string`[]

#### rules?

> `optional` **rules?**: `Record`\<`string`, `"error"` \| `"warning"` \| `"off"`\>

#### scanExternalContent?

> `optional` **scanExternalContent?**: `boolean`

Scan imported (registry cache / vendored) content with heuristic
validation rules. Heuristic rules skip imported content by default
because a project cannot fix findings in someone else's skill.
Concrete security findings (decoded payloads, suspicious URLs) always
scan imported content.

##### Default

```ts
false
```

***

### watch?

> `optional` **watch?**: `object`

Defined in: [core/src/types/config.ts:488](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L488)

Watch mode configuration.
Settings for `prs compile --watch`.

#### clearScreen?

> `optional` **clearScreen?**: `boolean`

Clear screen before each recompilation

#### debounce?

> `optional` **debounce?**: `number`

Debounce time in milliseconds before recompiling

#### exclude?

> `optional` **exclude?**: `string`[]

Glob patterns for files to ignore

#### include?

> `optional` **include?**: `string`[]

Glob patterns for files to watch (defaults to '**/*.prs')