# ValidatorConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidatorConfig

Defined in: [validator/src/types.ts:91](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L91)

Validator configuration options.

## Extended by

- [`ValidateOptions`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidateOptions/index.md)

## Properties

### allowedPatterns?

> `optional` **allowedPatterns?**: (`string` \| `RegExp`)[]

Defined in: [validator/src/types.ts:138](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L138)

Pattern sources exempt from blocked-patterns detection. A blocked pattern
is subtracted from the active set when its source text matches an entry
exactly.

***

### blockedPatterns?

> `optional` **blockedPatterns?**: (`string` \| `RegExp`)[]

Defined in: [validator/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L97)

Patterns to block in content (strings are converted to RegExp)

***

### customRules?

> `optional` **customRules?**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)[]

Defined in: [validator/src/types.ts:101](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L101)

Custom validation rules to add

***

### disableRules?

> `optional` **disableRules?**: `string`[]

Defined in: [validator/src/types.ts:99](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L99)

Array of rule names to disable

***

### excludes?

> `optional` **excludes?**: [`ValidationExclude`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidationExclude/index.md)[]

Defined in: [validator/src/types.ts:132](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L132)

Rule exclusions for specific imports, bound to the commit pinned in the
lockfile. Declared by the consumer in promptscript.yaml; an imported file
can never mute its own scan.

***

### externalRoots?

> `optional` **externalRoots?**: `string`[]

Defined in: [validator/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L120)

Absolute path roots holding imported (registry cache, vendored) content.
Heuristic content rules skip text located under these roots by default.

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [validator/src/types.ts:115](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L115)

Skip reference integrity checks

***

### importRoots?

> `optional` **importRoots?**: [`ImportRoot`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ImportRoot/index.md)[]

Defined in: [validator/src/types.ts:144](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L144)

Absolute roots holding imported content, keyed by import source and the
commit the lockfile pins for it. Computed by the compiler from the
lockfile (registry cache, vendor directory, reference roots).

***

### lockfile?

> `optional` **lockfile?**: [`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Defined in: [validator/src/types.ts:109](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L109)

Lockfile for reference integrity checks

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [validator/src/types.ts:103](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L103)

Logger for verbose/debug output

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [validator/src/types.ts:149](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L149)

Model catalog settings from promptscript.yaml (`models`). Custom profiles
extend the catalog; `supported` enables model set checks.

***

### policies?

> `optional` **policies?**: [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

Defined in: [validator/src/types.ts:105](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L105)

Extension compliance policies

***

### registryReferencePaths?

> `optional` **registryReferencePaths?**: `Map`\<`string`, `Map`\<`string`, `string`\>\>

Defined in: [validator/src/types.ts:113](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L113)

Canonical lock keys keyed by source file and declared reference

***

### registryReferences?

> `optional` **registryReferences?**: `Set`\<`string`\>

Defined in: [validator/src/types.ts:111](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L111)

Set of resolved absolute paths that came from registry cache

***

### requiredGuards?

> `optional` **requiredGuards?**: `string`[]

Defined in: [validator/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L95)

List of guards that must be present in

#### Guards

block

***

### rules?

> `optional` **rules?**: `Record`\<`string`, `"off"` \| [`Severity`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)\>

Defined in: [validator/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L93)

Override severity for specific rules (rule name -> severity or 'off')

***

### scanExternalContent?

> `optional` **scanExternalContent?**: `boolean`

Defined in: [validator/src/types.ts:126](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L126)

Scan imported content under externalRoots with heuristic rules anyway.
Concrete security findings (decoded payloads, suspicious URLs) always scan.

#### Default

```ts
false
```

***

### skipPolicies?

> `optional` **skipPolicies?**: `boolean`

Defined in: [validator/src/types.ts:107](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/types.ts#L107)

Skip policy evaluation