# SECTION_PROFILES

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: SECTION\_PROFILES

> `const` **SECTION\_PROFILES**: `Readonly`\<`Record`\<[`SectionProfile`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SectionProfile/index.md), readonly [`SectionContract`](https://getpromptscript.dev/api-reference/core/src/interfaces/SectionContract/index.md)[]\>\>

Defined in: [core/src/section-registry.ts:237](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/section-registry.ts#L237)

Section contracts per profile. `coding` is the registry itself, by reference.
`general` has no identity heading and no coding sections; all of its sections are optional.