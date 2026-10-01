# RegistryManifest

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RegistryManifest

Defined in: [core/src/types/manifest.ts:171](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L171)

Complete registry manifest.

The manifest describes all available configurations in a registry
and provides rules for auto-suggesting appropriate configurations
based on project characteristics.

## Example

```yaml
version: '1'
meta:
  name: "PromptScript Official Registry"
  description: "Official collection of AI instruction configurations"
  lastUpdated: "2026-01-28"
namespaces:
  "@core":
    description: "Universal foundations"
    priority: 100
catalog:
  - id: "@core/base"
    path: "@core/base.prs"
    name: "Base Foundation"
    description: "Universal AI assistant foundation"
    tags: [core, foundation]
    targets: [github, claude, cursor]
    dependencies: []
suggestionRules:
  - condition: { always: true }
    suggest: { inherit: "@core/base" }
```

## Properties

### catalog

> **catalog**: [`CatalogEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/CatalogEntry/index.md)[]

Defined in: [core/src/types/manifest.ts:179](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L179)

Catalog of available configurations

***

### meta

> **meta**: [`RegistryMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/RegistryMeta/index.md)

Defined in: [core/src/types/manifest.ts:175](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L175)

Registry metadata

***

### namespaces

> **namespaces**: `Record`\<`string`, [`NamespaceDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/NamespaceDefinition/index.md)\>

Defined in: [core/src/types/manifest.ts:177](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L177)

Available namespaces

***

### suggestionRules

> **suggestionRules**: [`SuggestionRule`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionRule/index.md)[]

Defined in: [core/src/types/manifest.ts:181](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L181)

Rules for auto-suggesting configurations

***

### version

> **version**: `"1"`

Defined in: [core/src/types/manifest.ts:173](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L173)

Manifest schema version