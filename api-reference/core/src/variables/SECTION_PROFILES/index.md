# SECTION_PROFILES

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: SECTION\_PROFILES

> `const` **SECTION\_PROFILES**: `Readonly`\<`Record`\<[`SectionProfile`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SectionProfile/index.md), readonly [`SectionContract`](https://getpromptscript.dev/api-reference/core/src/interfaces/SectionContract/index.md)[]\>\>

Defined in: [core/src/section-registry.ts:237](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/section-registry.ts#L237)

Section contracts per profile. `coding` is the registry itself, by reference.
`general` has no identity heading and no coding sections; all of its sections are optional.