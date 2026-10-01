# SectionRenderer

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SectionRenderer

Defined in: [core/src/types/convention.ts:23](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/convention.ts#L23)

Section rendering configuration.

## Properties

### end?

> `optional` **end?**: `string`

Defined in: [core/src/types/convention.ts:40](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/convention.ts#L40)

Template for section end (optional, for paired tags).
Variables: {{name}}

#### Examples

```ts
XML: "</{{name}}>"
```

```ts
Markdown: "" (empty - no closing tag)
```

***

### indent?

> `optional` **indent?**: `string`

Defined in: [core/src/types/convention.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/convention.ts#L52)

Indentation per level.

#### Default

```ts
'  ' (2 spaces)
```

***

### nameTransform?

> `optional` **nameTransform?**: `"none"` \| `"kebab-case"` \| `"camelCase"` \| `"PascalCase"`

Defined in: [core/src/types/convention.ts:46](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/convention.ts#L46)

Whether to convert section names.

#### Default

```ts
'kebab-case'
```

***

### start

> **start**: `string`

Defined in: [core/src/types/convention.ts:31](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/convention.ts#L31)

Template for section start.
Variables: {{name}}, {{level}}, {{content}}

#### Examples

```ts
XML: "<{{name}}>"
```

```ts
Markdown: "{{#repeat level}}#{{/repeat}} {{name}}"
```