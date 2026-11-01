# ValidatorConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidatorConfig

Defined in: [validator/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L93)

Validator configuration options.

## Extended by

- [`ValidateOptions`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidateOptions/index.md)

## Properties

### allowedPatterns?

> `optional` **allowedPatterns?**: (`string` \| `RegExp`)[]

Defined in: [validator/src/types.ts:140](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L140)

Pattern sources exempt from blocked-patterns detection. A blocked pattern
is subtracted from the active set when its source text matches an entry
exactly.

***

### blockedPatterns?

> `optional` **blockedPatterns?**: (`string` \| `RegExp`)[]

Defined in: [validator/src/types.ts:99](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L99)

Patterns to block in content (strings are converted to RegExp)

***

### customRules?

> `optional` **customRules?**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)[]

Defined in: [validator/src/types.ts:103](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L103)

Custom validation rules to add

***

### disableRules?

> `optional` **disableRules?**: `string`[]

Defined in: [validator/src/types.ts:101](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L101)

Array of rule names to disable

***

### excludes?

> `optional` **excludes?**: [`ValidationExclude`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidationExclude/index.md)[]

Defined in: [validator/src/types.ts:134](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L134)

Rule exclusions for specific imports, bound to the commit pinned in the
lockfile. Declared by the consumer in promptscript.yaml; an imported file
can never mute its own scan.

***

### externalRoots?

> `optional` **externalRoots?**: `string`[]

Defined in: [validator/src/types.ts:122](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L122)

Absolute path roots holding imported (registry cache, vendored) content.
Heuristic content rules skip text located under these roots by default.

***

### governance?

> `optional` **governance?**: [`GovernanceConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceConfig/index.md)

Defined in: [validator/src/types.ts:156](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L156)

Governance settings from promptscript.yaml (`governance`). Policies check
approval roles against it; PS047 runs only when it is set.

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [validator/src/types.ts:117](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L117)

Skip reference integrity checks

***

### importRoots?

> `optional` **importRoots?**: [`ImportRoot`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ImportRoot/index.md)[]

Defined in: [validator/src/types.ts:146](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L146)

Absolute roots holding imported content, keyed by import source and the
commit the lockfile pins for it. Computed by the compiler from the
lockfile (registry cache, vendor directory, reference roots).

***

### lockfile?

> `optional` **lockfile?**: [`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Defined in: [validator/src/types.ts:111](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L111)

Lockfile for reference integrity checks

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [validator/src/types.ts:105](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L105)

Logger for verbose/debug output

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [validator/src/types.ts:151](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L151)

Model catalog settings from promptscript.yaml (`models`). Custom profiles
extend the catalog; `supported` enables model set checks.

***

### policies?

> `optional` **policies?**: [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

Defined in: [validator/src/types.ts:107](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L107)

Policies for skill extensions and prompts

***

### registryReferencePaths?

> `optional` **registryReferencePaths?**: `Map`\<`string`, `Map`\<`string`, `string`\>\>

Defined in: [validator/src/types.ts:115](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L115)

Canonical lock keys keyed by source file and declared reference

***

### registryReferences?

> `optional` **registryReferences?**: `Set`\<`string`\>

Defined in: [validator/src/types.ts:113](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L113)

Set of resolved absolute paths that came from registry cache

***

### releases?

> `optional` **releases?**: [`ReleasesConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ReleasesConfig/index.md)

Defined in: [validator/src/types.ts:161](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L161)

Release settings from promptscript.yaml (`releases`). Policies check their
`environments` against it.

***

### requiredGuards?

> `optional` **requiredGuards?**: `string`[]

Defined in: [validator/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L97)

List of guards that must be present in

#### Guards

block

***

### rules?

> `optional` **rules?**: `Record`\<`string`, `"off"` \| [`Severity`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)\>

Defined in: [validator/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L95)

Override severity for specific rules (rule name -> severity or 'off')

***

### scanExternalContent?

> `optional` **scanExternalContent?**: `boolean`

Defined in: [validator/src/types.ts:128](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L128)

Scan imported content under externalRoots with heuristic rules anyway.
Concrete security findings (decoded payloads, suspicious URLs) always scan.

#### Default

```ts
false
```

***

### skipPolicies?

> `optional` **skipPolicies?**: `boolean`

Defined in: [validator/src/types.ts:109](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/types.ts#L109)

Skip policy evaluation