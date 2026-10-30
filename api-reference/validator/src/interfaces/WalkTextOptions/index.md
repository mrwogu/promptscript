# WalkTextOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: WalkTextOptions

Defined in: [validator/src/walker.ts:32](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/walker.ts#L32)

Options for walkText.

## Properties

### excludeProperties?

> `optional` **excludeProperties?**: `string`[]

Defined in: [validator/src/walker.ts:38](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/walker.ts#L38)

Property names to exclude from walking, at every depth under every block.
For skill resource lists use `skipSkillResources`, which is scoped to
`@skills.<name>.resources`.

***

### skipSkillResources?

> `optional` **skipSkillResources?**: `boolean`

Defined in: [validator/src/walker.ts:44](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/walker.ts#L44)

Skip skill resource lists (`@skills.<name>.resources`, including the same
path reached through `@extend` and `@override`). The `resources` key under
any other block or property is still scanned.