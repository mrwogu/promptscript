# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [core/src/types/config.ts:82](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L82)

Configuration for a single target.

## Properties

### agentsFile?

> `optional` **agentsFile?**: `string`

Defined in: [core/src/types/config.ts:172](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L172)

Codex: override the agents file name for scoped build profiles.
Defaults to `AGENTS.md`. Use `AGENTS.override.md` only for scoped builds.

***

### agentsFrontmatter?

> `optional` **agentsFrontmatter?**: `"experimental"`

Defined in: [core/src/types/config.ts:182](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L182)

AGENTS.md v1.1 frontmatter mode.
- `experimental`: emit YAML frontmatter with `description` and `tags` from

#### Meta

- omitted: no frontmatter (default, byte-compatible with existing output)

Only valid for targets whose fixture accepts frontmatter.

#### Default

```ts
undefined (no frontmatter)
```

***

### autoMode?

> `optional` **autoMode?**: `"acceptEdits"` \| `"plan"` \| `"bypassPermissions"`

Defined in: [core/src/types/config.ts:189](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L189)

Claude: auto mode setting for project settings.json.
Maps to `.claude/settings.json` `autoMode` field.
Only valid for Claude target with fixture-confirmed project-local schema.

***

### convention?

> `optional` **convention?**: `string`

Defined in: [core/src/types/config.ts:97](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L97)

Output convention ('xml', 'markdown', or custom name).

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [core/src/types/config.ts:87](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L87)

Whether this target is enabled.

#### Default

```ts
true
```

***

### excludeAgents?

> `optional` **excludeAgents?**: `string`[]

Defined in: [core/src/types/config.ts:145](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L145)

Agent names never emitted for this target. Applied after `includeAgents`.

***

### guardsAsSkills?

> `optional` **guardsAsSkills?**: `boolean`

Defined in: [core/src/types/config.ts:114](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L114)

Generate skills from

#### Guards

named entries (Factory).

#### Default

```ts
true
```

***

### guardsSkillsListing?

> `optional` **guardsSkillsListing?**: `boolean`

Defined in: [core/src/types/config.ts:117](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L117)

List generated guard skills in main output file (Factory).

#### Default

```ts
true
```

***

### hooksFile?

> `optional` **hooksFile?**: [`FactoryHooksFile`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryHooksFile/index.md)

Defined in: [core/src/types/config.ts:206](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L206)

Factory: file that receives the generated `@hooks`.
- `hooks.json`: `.factory/hooks.json` (preferred by Factory, read first)
- `settings.json`: `hooks` key of `.factory/settings.json` (Factory reads it
  only when `.factory/hooks.json` is absent)

#### Default

```ts
'hooks.json'
```

***

### includeAgents?

> `optional` **includeAgents?**: `boolean` \| `string`[]

Defined in: [core/src/types/config.ts:140](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L140)

Controls which agents are emitted for this target.
- `true` or omitted: emit all agents
- `false`: emit no agents
- string array: emit only the listed agent names

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [core/src/types/config.ts:132](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L132)

Controls which skills are emitted for this target.
- `true` or omitted: emit all skills
- `false`: emit no skills
- string array: emit only the listed skill names

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: [core/src/types/config.ts:166](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L166)

Codex: maximum nesting depth for agent delegation.
Positive integer. Maps to Codex config, never to AGENTS.md.

***

### maxThreads?

> `optional` **maxThreads?**: `number`

Defined in: [core/src/types/config.ts:160](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L160)

Codex: maximum number of parallel agent threads.
Positive integer. Maps to Codex config, never to AGENTS.md.

***

### output?

> `optional` **output?**: `string`

Defined in: [core/src/types/config.ts:92](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L92)

Custom output path for this target.

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [core/src/types/config.ts:111](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L111)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

#### Default

```ts
'monolith'
```

***

### settings?

> `optional` **settings?**: [`TargetSettingsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetSettingsConfig/index.md)

Defined in: [core/src/types/config.ts:197](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L197)

Project settings written to the target settings file.
Claude: `.claude/settings.json` (`model`, `permissions`, `env`, `enabledPlugins`).
Factory: `.factory/settings.json` (`model`, `enabledPlugins`).
Keys are merged into an existing settings file; other user keys are kept.

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [core/src/types/config.ts:124](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L124)

Custom base directory for generated skill files.
When set, skill files are emitted under this directory instead of the
target's native skill directory (for example `.factory/skills`).

***

### skillPath?

> `optional` **skillPath?**: `"agents"` \| `"gemini"` \| `"both"`

Defined in: [core/src/types/config.ts:154](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L154)

Gemini skill path selection.
- `agents`: use `.agents/skills/` (interoperable, fixture-confirmed default)
- `gemini`: use `.gemini/skills/` (legacy)
- `both`: emit to both paths (requires explicit opt-in, deduplicates content)

#### Default

```ts
'agents'
```

***

### version?

> `optional` **version?**: `string`

Defined in: [core/src/types/config.ts:104](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L104)

Target version or format variant.
Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).

#### Example

```ts
'legacy' | '1.0' | '2.0'
```