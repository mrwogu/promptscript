# TargetConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetConfig

Defined in: [core/src/types/config.ts:73](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L73)

Configuration for a single target.

## Properties

### agentsFile?

> `optional` **agentsFile?**: `string`

Defined in: [core/src/types/config.ts:150](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L150)

Codex: override the agents file name for scoped build profiles.
Defaults to `AGENTS.md`. Use `AGENTS.override.md` only for scoped builds.

***

### agentsFrontmatter?

> `optional` **agentsFrontmatter?**: `"experimental"`

Defined in: [core/src/types/config.ts:160](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L160)

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

Defined in: [core/src/types/config.ts:167](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L167)

Claude: auto mode setting for project settings.json.
Maps to `.claude/settings.json` `autoMode` field.
Only valid for Claude target with fixture-confirmed project-local schema.

***

### convention?

> `optional` **convention?**: `string`

Defined in: [core/src/types/config.ts:88](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L88)

Output convention ('xml', 'markdown', or custom name).

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [core/src/types/config.ts:78](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L78)

Whether this target is enabled.

#### Default

```ts
true
```

***

### guardsAsSkills?

> `optional` **guardsAsSkills?**: `boolean`

Defined in: [core/src/types/config.ts:105](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L105)

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

Defined in: [core/src/types/config.ts:108](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L108)

List generated guard skills in main output file (Factory).

#### Default

```ts
true
```

***

### includeSkills?

> `optional` **includeSkills?**: `boolean` \| `string`[]

Defined in: [core/src/types/config.ts:123](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L123)

Controls which skills are emitted for this target.
- `true` or omitted: emit all skills
- `false`: emit no skills
- string array: emit only the listed skill names

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: [core/src/types/config.ts:144](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L144)

Codex: maximum nesting depth for agent delegation.
Positive integer. Maps to Codex config, never to AGENTS.md.

***

### maxThreads?

> `optional` **maxThreads?**: `number`

Defined in: [core/src/types/config.ts:138](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L138)

Codex: maximum number of parallel agent threads.
Positive integer. Maps to Codex config, never to AGENTS.md.

***

### output?

> `optional` **output?**: `string`

Defined in: [core/src/types/config.ts:83](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L83)

Custom output path for this target.

***

### rulesMode?

> `optional` **rulesMode?**: [`FactoryRulesMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/FactoryRulesMode/index.md)

Defined in: [core/src/types/config.ts:102](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L102)

Factory always-on rules output mode.
Split mode requires Factory's `multifile` or `full` version.

#### Default

```ts
'monolith'
```

***

### skillBaseDir?

> `optional` **skillBaseDir?**: `string`

Defined in: [core/src/types/config.ts:115](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L115)

Custom base directory for generated skill files.
When set, skill files are emitted under this directory instead of the
target's native skill directory (for example `.factory/skills`).

***

### skillPath?

> `optional` **skillPath?**: `"agents"` \| `"gemini"` \| `"both"`

Defined in: [core/src/types/config.ts:132](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L132)

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

Defined in: [core/src/types/config.ts:95](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/config.ts#L95)

Target version or format variant.
Use 'legacy' for deprecated formats (e.g., Cursor's .cursorrules).

#### Example

```ts
'legacy' | '1.0' | '2.0'
```