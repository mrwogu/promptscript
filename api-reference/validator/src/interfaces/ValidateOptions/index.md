# ValidateOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateOptions

Defined in: [validator/src/types.ts:167](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L167)

Options for standalone validate function.

## Extends

- [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

## Properties

### allowedPatterns?

> `optional` **allowedPatterns?**: (`string` \| `RegExp`)[]

Defined in: [validator/src/types.ts:138](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L138)

Pattern sources exempt from blocked-patterns detection. A blocked pattern
is subtracted from the active set when its source text matches an entry
exactly.

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`allowedPatterns`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#allowedpatterns)

***

### blockedPatterns?

> `optional` **blockedPatterns?**: (`string` \| `RegExp`)[]

Defined in: [validator/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L97)

Patterns to block in content (strings are converted to RegExp)

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`blockedPatterns`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#blockedpatterns)

***

### customRules?

> `optional` **customRules?**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)[]

Defined in: [validator/src/types.ts:101](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L101)

Custom validation rules to add

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`customRules`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#customrules)

***

### disableRules?

> `optional` **disableRules?**: `string`[]

Defined in: [validator/src/types.ts:99](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L99)

Array of rule names to disable

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`disableRules`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#disablerules)

***

### excludes?

> `optional` **excludes?**: [`ValidationExclude`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidationExclude/index.md)[]

Defined in: [validator/src/types.ts:132](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L132)

Rule exclusions for specific imports, bound to the commit pinned in the
lockfile. Declared by the consumer in promptscript.yaml; an imported file
can never mute its own scan.

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`excludes`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#excludes)

***

### externalRoots?

> `optional` **externalRoots?**: `string`[]

Defined in: [validator/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L120)

Absolute path roots holding imported (registry cache, vendored) content.
Heuristic content rules skip text located under these roots by default.

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`externalRoots`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#externalroots)

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [validator/src/types.ts:115](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L115)

Skip reference integrity checks

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`ignoreHashes`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#ignorehashes)

***

### importRoots?

> `optional` **importRoots?**: [`ImportRoot`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ImportRoot/index.md)[]

Defined in: [validator/src/types.ts:144](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L144)

Absolute roots holding imported content, keyed by import source and the
commit the lockfile pins for it. Computed by the compiler from the
lockfile (registry cache, vendor directory, reference roots).

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`importRoots`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#importroots)

***

### lockfile?

> `optional` **lockfile?**: [`Lockfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/Lockfile/index.md)

Defined in: [validator/src/types.ts:109](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L109)

Lockfile for reference integrity checks

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`lockfile`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#lockfile)

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [validator/src/types.ts:103](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L103)

Logger for verbose/debug output

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`logger`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#logger)

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [validator/src/types.ts:149](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L149)

Model catalog settings from promptscript.yaml (`models`). Custom profiles
extend the catalog; `supported` enables model set checks.

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`models`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#models)

***

### policies?

> `optional` **policies?**: [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

Defined in: [validator/src/types.ts:105](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L105)

Extension compliance policies

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`policies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#policies)

***

### registryReferencePaths?

> `optional` **registryReferencePaths?**: `Map`\<`string`, `Map`\<`string`, `string`\>\>

Defined in: [validator/src/types.ts:113](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L113)

Canonical lock keys keyed by source file and declared reference

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`registryReferencePaths`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#registryreferencepaths)

***

### registryReferences?

> `optional` **registryReferences?**: `Set`\<`string`\>

Defined in: [validator/src/types.ts:111](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L111)

Set of resolved absolute paths that came from registry cache

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`registryReferences`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#registryreferences)

***

### requiredGuards?

> `optional` **requiredGuards?**: `string`[]

Defined in: [validator/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L95)

List of guards that must be present in

#### Guards

block

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`requiredGuards`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#requiredguards)

***

### rules?

> `optional` **rules?**: `Record`\<`string`, `"off"` \| [`Severity`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)\>

Defined in: [validator/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L93)

Override severity for specific rules (rule name -> severity or 'off')

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`rules`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#rules)

***

### scanExternalContent?

> `optional` **scanExternalContent?**: `boolean`

Defined in: [validator/src/types.ts:126](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L126)

Scan imported content under externalRoots with heuristic rules anyway.
Concrete security findings (decoded payloads, suspicious URLs) always scan.

#### Default

```ts
false
```

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`scanExternalContent`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#scanexternalcontent)

***

### skipPolicies?

> `optional` **skipPolicies?**: `boolean`

Defined in: [validator/src/types.ts:107](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L107)

Skip policy evaluation

#### Inherited from

[`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md).[`skipPolicies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md#skippolicies)

***

### validator?

> `optional` **validator?**: `Validator`

Defined in: [validator/src/types.ts:169](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L169)

Reuse an existing validator instance