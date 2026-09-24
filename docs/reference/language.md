---
title: Language Reference
description: Complete PromptScript language specification
---

# Language Reference

Complete specification of the PromptScript language.

## Choose a Topic

| Goal                                       | Reference                                                        |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Understand a complete `.prs` file          | [File Anatomy](language/file-anatomy.md)                         |
| Choose valid block body shapes             | [Values and Block Bodies](language/values-and-block-bodies.md)   |
| Predict inheritance and import results     | [Composition and Precedence](language/composition.md)            |
| Understand declaration order               | [Execution Order](language/execution-order.md)                   |
| Choose `@extend`, `field!`, or `@override` | [Merge and Replacement](language/merge-and-replacement.md)       |
| Customize generated headings               | [Section Headers](language/section-headers.md)                   |
| Upgrade syntax and resolve diagnostics     | [Versions and Diagnostics](language/versions-and-diagnostics.md) |

Use this page as the complete block and grammar catalog. Task-oriented pages
above explain decisions and show resolved results step by step.

## File Structure

A PromptScript file (`.prs`) consists of:

```promptscript
# Comments start with #

@meta { ... }           # Required: Metadata
@inherit @path          # Optional: Inheritance
@use @path [as alias]   # Optional: Imports

@identity { ... }       # Content blocks
@context { ... }
@standards { ... }
@restrictions { ... }
@shortcuts { ... }
@params { ... }
@guards { ... }
@skills { ... }
@agents { ... }
@workflows { ... }
@hooks { ... }
@mcpServers { ... }
@plugins { ... }
@knowledge { ... }
@examples { ... }
@local { ... }
@extend path { ... }    # Block modifications
@override path { ... }  # Atomic replacement of an existing target
```

Aliased imports qualify imported agents so repeated local names remain distinct:

```promptscript
@use ./frontend-team as frontend
@use ./backend-team as backend
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH343ODsKAHpVNg5PAFoOUjFlavZOb19S8oqAIwxGAGt2hpgmjGU+wfaQfLp0bDxEcFc2+saSKloQBhZVrB5eAGU3NHIIaVl5W14iUnI7ag9lHBhqGApeADlmLHsMal+zDAChevHEzEYbi0IiwEDYdDEnl4rB+Yl4bwwUD+gw072KQhEvECVhCKWWNWG6zywTgCREyXCIHSWVyIDiJAghAgrDCWEeMB8hV8cBEnn+4mUxOCLCkYWQEQAClB+jAcMwoFJqLJReJxREALpxDgi7nqOWK5WMVXqzXajBi6jeECGgrFN4i6gQRiwtiSuJ1RlKlVqjWvdHwPlen2sPL5GZzECYXD4SZDNajDY0ehMClcJZ8Y6nKDnGRyEF2W7RB5PXgvN4fb6-TAAwzA67gyHQ7Bw1gI+0yFG-UQYrGYHHqPG+AkBOIQUKM1OUjPU+KJBlpTI5Fccrk8hT8wXFEX98V+kkymDmkBBq0h23Hh1Ol3BY2w1hm3jy6+W62hrUP3VHQNQ9fHdSNvR7M9ggDC1gxtMMwM9CC2FjGZ9QYTg+UcfBK3uTZswAN1eOAe3wVIZiAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

An imported `reviewer` becomes `frontend.reviewer` or `backend.reviewer`. Unique unaliased names
remain unchanged. Conflicting unaliased definitions produce a source-aware diagnostic instead of
silently overwriting an agent. Native output maps dots to hyphens, for example
`frontend.reviewer` becomes `frontend-reviewer`.

Namespaces can be nested through aliased imports:

```promptscript
# team.prs
@use ./inner-team as inner

# project.prs
@use ./team as frontend
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4OUipaH343ODsKAHoIVlYYagBaUpIxZUbm6iLWPhpmACsYRixyuErq2rqOrpVXdk5xEHy6dGw8RBAelvaYMpp6JjYOLh2+AGU3NHIIaVl5W14iUnI7ag9lHBaYCl4ADlmFh7BhqKDmGAFL9eOJmIw3FoRFgIGw6GJPLxWCCxLxqIcoGDGABrDT-SpCES8QJWEIpXZNfYdPLBOAJETJcIgdJZXIgOIkCCERphLBfGA+Qq+OAiTzg8TKWnBFhSMLICIABSgGEYMBwzCgUmosjl4gVEQAunEOLLGup1VqdXqDUaWqaMPLqN4QNaCpUCbLqBBxmjWEq4q1udrdfrDcb8fBxSHUWw8vk1hsQJhcPgOpMQAwWMsLiBrrd7o85DC7G9op9vrxfgSAcDQZgIYZoS94YjkdgwxjPTIcaDRASMETMKTyRRKf4aXEIKFuSyBXT2YkuWlMjlWbwhSLWGKJVLKrLhwqI3TVTBHSAYy74+6L16fX7grbUawHbwNQ-nTjN0TVfc1vStM9fEDZNQzYa9gijJ1Y1dBNoODWDWHTNZLQYThxUcfA6w+AsGAANxaOAw3wVI1iAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The inner team's `reviewer` resolves to `frontend.inner.reviewer`. Agent references are rewritten
with the same qualified name, including `agent` fields and `handoffs` entries, so references do not
retain the source-local `reviewer` name.

Syntax `1.5.0` resolves top-level declarations in source order. Put `@meta`
first, then imports, local blocks, and modifications in the order they should
apply. See [Execution Order](language/execution-order.md).
Contextual `@header` entries live inside supported owner blocks, not at the
top level.

## @meta Block (Required)

Every PromptScript file must have a `@meta` block defining metadata:

```promptscript
@meta {
  id: "project-id"           # Required: Unique identifier
  syntax: "1.0.0"            # Required: PromptScript syntax version (semver)

  # Optional fields
  org: "Company Name"
  team: "Frontend"
  tags: [frontend, react, typescript]
}
```

| Field    | Required | Description                          |
| -------- | -------- | ------------------------------------ |
| `id`     | Yes      | Unique identifier (string)           |
| `syntax` | Yes      | PromptScript syntax version (semver) |
| `org`    | No       | Organization name                    |
| `team`   | No       | Team name                            |
| `tags`   | No       | Array of tags                        |
| `params` | No       | Parameter definitions for templates  |

### Parameter Definitions

The `params` field defines parameters for parameterized inheritance:

```promptscript
@meta {
  id: "@stacks/typescript-lib"
  syntax: "1.0.0"
  params: {
    # Required string parameter
    projectName: string

    # Optional with default value
    runtime: string = "node18"

    # Optional parameter (no default, can be undefined)
    debug?: boolean

    # Enum parameter with constrained values
    testFramework: enum("vitest", "jest", "mocha") = "vitest"

    # Number parameter
    port: number = 3000
  }
}
```

**Parameter Types:**

| Type      | Syntax                 | Values                |
| --------- | ---------------------- | --------------------- |
| `string`  | `name: string`         | Any text              |
| `number`  | `count: number`        | Integers and floats   |
| `boolean` | `enabled: boolean`     | `true` or `false`     |
| `enum`    | `mode: enum("a", "b")` | One of listed options |

**Parameter Modifiers:**

| Pattern                    | Meaning                     |
| -------------------------- | --------------------------- |
| `name: string`             | Required, must be provided  |
| `name?: string`            | Optional, can be omitted    |
| `name: string = "default"` | Optional with default value |

## Syntax Versions

The `syntax` field in `@meta` declares which version of the PromptScript language the file uses. Versions follow semver.

### Known Versions

| Version | Status  | Blocks and features                                                                                                                        |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `1.0.0` | Stable  | `@identity`, `@context`, `@standards`, `@restrictions`, `@knowledge`, `@shortcuts`, `@commands`, `@guards`, `@params`, `@skills`, `@local` |
| `1.1.0` | Stable  | All 1.0.0 blocks + `@agents`, `@workflows`; reserves internal `@prompts`                                                                   |
| `1.2.0` | Stable  | All 1.1.0 blocks + `@examples`                                                                                                             |
| `1.3.0` | Stable  | All 1.2.0 features + regular block field replacement in `@extend`                                                                          |
| `1.4.0` | Stable  | All 1.3.0 features + `@hooks`, `@mcpServers`, `@plugins`                                                                                   |
| `1.5.0` | Current | All 1.4.0 features + `@header` section titles, `@override` replacement, declaration order, unquoted `${VAR}` values                        |

!!! note "Block Availability"
`@workflows` emits workflow files such as `.claude/workflows/<name>.md`.
`@prompts` is internal. `@hooks`, `@mcpServers`, and `@plugins` require syntax `1.4.0`.

### Block Version Requirements

| Block         | Minimum Syntax Version |
| ------------- | ---------------------- |
| `@agents`     | `1.1.0`                |
| `@workflows`  | `1.1.0`                |
| `@prompts`    | `1.1.0`                |
| `@examples`   | `1.2.0`                |
| `@hooks`      | `1.4.0`                |
| `@mcpServers` | `1.4.0`                |
| `@plugins`    | `1.4.0`                |

All other built-in blocks are available from `1.0.0`.
Regular block field replacement with `field!: value` requires syntax `1.3.0`. Generated section title overrides with `@header`, atomic target replacement with `@override`, and unquoted `${VAR}` values require syntax `1.5.0`.

### Validation (PS018, PS019)

The validator enforces syntax version compatibility:

- **PS018 (`syntax-version-compat`)**: warns when the resolved program uses blocks or syntax features that require a higher version than declared in `@meta`. This includes requirements inherited, imported, or included through skill composition.
- **PS019 (`unknown-block-name`)**: warns when a block name is not a known PromptScript type, and suggests the closest match for typos.

### Upgrading

To automatically update the `syntax` field to the required version for the resolved syntax you use:

```bash
prs validate --fix          # Fix syntax versions in .prs files
prs upgrade                 # Upgrade all .prs files to the latest syntax version
```

`prs validate --fix` rewrites the `syntax: "..."` line in each `@meta` block to the minimum version required by resolved blocks and syntax features. It follows inheritance, imports, and skill composition.

`prs upgrade` upgrades all files to the latest known syntax version regardless of what blocks they use.

## @inherit Declaration

Single inheritance from another PromptScript file:

```promptscript
# From registry namespace
@inherit @company/frontend-team

# Relative path
@inherit ./parent

# With version constraint
@inherit @company/frontend-team@1.0.0

# With parameters (see Parameterized Inheritance below)
@inherit @stacks/react-app(projectName: "my-app", port: 3000)
```

!!! note "Single Inheritance"
Each file can only have one `@inherit` declaration. Use `@use` for composition.

## @use Declaration

Import and merge fragments for composition (like mixins):

```promptscript
# Import from registry - blocks are merged into current file
@use @core/guards/compliance

# Import with alias - blocks merged AND available for @extend
@use @core/guards/security as sec

# Import relative
@use ./fragments/logging

# Multiple imports - all merged in order
@use @core/standards/typescript
@use @core/restrictions/security
@use ./local-config

# With parameters (see Parameterized Inheritance below)
@use ./fragments/testing(framework: "vitest", coverage: 90) as testing
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4ASTJmaiwVVxJeahh1JSxqR14AWl4AIyhmRgBrZQx63iFqdWlrLHlGN2p67UgY3zc4O34WeoB6dTch8ThN3XIIDFZGGCLWUvLK3nMTHDEoE+UO7t6BkZgxiYBBADkACJiABuGGgGG6djAFQERA4nh8-BWaw2MG2u2o+02qxm1BMrQwylxl2uaAqVXqUGwEBBF2Wq14FE2qg0WlMmx66karHUpN4AFk3FAsBByHYIDdTO0nlAvj8ZBArBUpNQkSiBGicSJPHsDlhHGh4Ix8WgsOrGesKuj6nBmhBGKK2AdcbMCRa7MyeowMFA2ixWJA+axirwAOoPexDUjCb7KAAUqzsAAVo0IOPiAF4TEqsHDfEync5dGA9cwASg9TJZak0nA5HDtSvU8dZQnMFT6KRAIJM8HNIDoOmYdNrMDCAE5suWxMpG6LeSB8nR0Ng8IgQFatjs9YdmNETmcYFRaIOmGwEVgeLwAMpuNDHCZyBT53hEUjiuoeZT5+oUXj-MwVSYLczBgC+djiL0bjsjSbBDqcMisEBYh1DAvpRv0GjHki6YBHEEChOEm5ajuWIHEczxFhcIBxHACQiMkxHpFkuS0VYIwQIQSphM0bj0oUvh2oheq8IEHEsFIYTIBEybUucODMFAqqyDq4h7BEAC6cTzs20myfJMCKcp3yqSJWJaT4gn8La9qOhAzpiXEHQGRgClKSptn4vZbB5PkS4riAmC4PgW7omR2KuviBonvQ57sPW153g+zxPvIthvlEn7UN+vC-seAEoSBVRgRBvBQTMsFOqwCGeLwyFVKI9QYZgWHjBQuH+E5HGEd2YUYruUXuuxwT0YkTFpJkOR5MEJBcTxCg5QJSLCbq5HdcEknjrwMkgHJblGR5pmrepFkgNpHG6by+l7YZxkqSdGnnVZSJeQ61XKOJwQubdB33aZb0+SG7H+cuq4hRurJ1uwBxcjy6ixWeAaXkl96PjIz4Ze+0R2DlrA-t8BWAcBQwleBGUVTB9ZwTVYh1Q1qHNXKrV9NhHW+HhG0hN2UPsrDzDcs2M3xON3YsdNI2cdxrC8UtL1CWpolfcOUk7a57kmdQZlrd4z2Xf2elq79GsPYrZ0XdZgMfVzP37SbAP9t51V+QF4PriR1rauZ2IGkacAmmKWCIwwyOJRufDJejsjpa+2PZbl+X-sTUageTr6U1VDm04h9UoU16HM25rPtZ1Ihc71xH9Y95GbL7xqmgOdEMUkYtTWxcRzdLsv8fL-DV-sXNbTdduHZr2unbrF3BFd6jD3dR1a-3lkFK9jvvVnn3OcRI--VrVtZy7YNBWuoVavvzo4jAeIEsH8Uo+Ht5o6lGMx3YcewF++N5YTSdFaThhp0gtBTO8E6ZITzmhFqRc2al3wj1IiER+rn3xpfa+BphZjUYq3ViwtO4LT4stBW3tN4SWYKrXaO8F7jyelPBQBtrpG0oWPJeetLZryBiQ762955j2QYfQKwV3bel9P6NgQZb6hy4A-SOz9o5lXfrjBOP9Cok1TmVDO1Nqq1XAY1SBhc2o4Q5l1ZWFcIjCL9AGIMGDm4TRAOLduHE8Ey0Wj3FeRCdacJVttChPDTbe2XtPehs9GG+OOmbSevdkGeNtqEve7DnYg1dsfCG4Bax81rkEiRF4w4gAjk-CAaV5FZQ-njAmf4VEpzJuo4Bmis7aNzropmmFi6GL8GXExCDUlsnrPqIJ1jRbMTbrg+aziCFxBAqQOAYRlbBDbDADs1A+gAH4wh2nxLyXgABeYiCjhabRHN8bCKz6owU6KZbZuQOKCWsv3TxQ8Ql-SoSw2hM856POYeE5ebC1nr0csrGJ7zPLxIPok-ImkGD1haPgBRt9RxwCzvgVIS4gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Merge Behavior

When you use `@use`, all blocks from the imported file are merged into your file:

- **TextContent**: Concatenated (source + target), with automatic deduplication of identical content
- **ObjectContent**: Deep merged (the imported source wins same-shape key conflicts)
- **ArrayContent**: Unique concatenation (preserves order, removes duplicates)

For incompatible block shapes, the existing target body wins. Under syntax
`1.5.0`, later declarations can modify the merged result, so a local block,
`@extend`, or `@override` placed after `@use` can become the final value. See
[Composition and Precedence](language/composition.md) for the normative matrix.

```promptscript
# Source: @core/guards/security
@restrictions {
  - "Never expose secrets"
}

# Target: ./project.prs
@use @core/guards/security

@restrictions {
  - "Follow OWASP guidelines"
}

# Result after merge:
# @restrictions contains both items (source first, then target)
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AZXdqRhgw-hZqGAB6dTcManE4ergYRjdqE0cffjq4LF7GLAg2ZUCrXgBacJAAORgANxhqXiI0Zk7ZLrrTPMLWYt4AFRb1YTCKeppmACsurCpaAbddmuY6xubW9s63V6WH6J18QxGEDGE1YUzi8wiADFmFAoBZeAB5ADqAEESgAFXhNCBSKAQVjwI5FVh8ABK8DcUCwYjAHA2QmoV0Qp0G8Eh0MmOjYInJygARsxcMYOCRlAAKOQ9SoqCC0LB0BQ4TgKS7CACUIHydHQ2DwiBAXx+TRabQ6XR6fVe9CYws4WB4vBKbjQ5Ag0lk8lsmyi5Ds1A8yi1dQovEWkvsLWZzDAmrs4mY3S0InGbA1GE8vFY8dEdQwUATjAA1hoYBQBkIRLxpsESSkLbUGtb-nagX08sE4AkRMkFuksrkQHESBBCOSwiM3DAfMd+MN8+IbXCZiwpGFkBF8VAMJUcCipBs154bREALpxDjDcnqPcHo8ns-rWQiK+tW-LgYQqMOawk28ILIex4wKeUDnrwgFQsBRyGjeDButQjj4EQpChk6IAMGstAwvgqSGkAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Alias for @extend Access

When you provide an alias, imported blocks are also stored with a prefix for use with `@extend`:

```promptscript
@use @core/typescript as ts

# Now you can extend imported blocks
@extend ts.standards {
  testing: { coverage: 90 }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH343ODt+FmoYAHosRzR4RmoINCwxZVMi1j4AOQteR3cdDCsiDk9jMmZqDhkAIyhmRgBrOGKxzhlTCjgRTwxqcWVAqwV4LAhWdTDgHWYANxg1dRgwgE5s3kKCkHy6dGweEQIAq0xqdQacCaLSwVFoIAYLHYnCwPF4AGU3GhyBBpLJ5LZeERSOQ7NQPMocE8YBReH02pgZoYwAoqbxxEs3FoRBc2HQxBNWMw2qIqhgoPYMCsNDTikIRLwTsEIKFwiDKuD6o1mq08sE4AkRMk1eksrkQHESBBCJcwlhyTAfN9+LsRuIDkdFXEWFIwsgIgAFKBSmA4ZhQKTUWR7d2HCIAXTiHF2l2uvH9ICDIbDEae0bdHoTTuKVV2zUYvNYxziAFo1VnGKHw5HeKX7RAKxA2Hl8r94wwUdRHPhidEaTR6CBHrQu6x8KlfkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

<!-- prettier-ignore -->
!!! tip "When to Use Alias"
    - **Without alias**: Simple include/mixin behavior - blocks are merged directly
    - **With alias**: When you need to selectively extend specific imported blocks

### Block Filtering

Control which blocks are imported using the reserved `only` and `exclude` parameters:

```promptscript
# Import only skills and context blocks
@use ./shared-config(only: ["skills", "context"])

# Import everything except knowledge
@use ./shared-config(exclude: ["knowledge"])

# Combine with template parameters
@use ./shared-config(exclude: ["knowledge"], mode: "strict")

# Combine with alias
@use ./shared-config(only: ["skills"]) as shared
```

**Rules:**

- `only` and `exclude` are mutually exclusive — using both is a validation error (PS021)
- Values are block type names: `identity`, `context`, `standards`, `knowledge`, `skills`, `shortcuts`, `commands`, `guards`, `restrictions`, `agents`, etc.
- Unknown block names produce a warning (for forward compatibility)
- Block filtering does not apply to `@inherit` directives

### Skill Filtering

When importing from a repository or directory that contains multiple skills, control which individual skills are imported using the reserved `includes` and `excludes` parameters:

```promptscript
# Import only specific skills from a remote repo
@use github.com/owner/repo/skills(includes: ["code-review", "testing"])

# Import all skills except specific ones
@use github.com/owner/repo/skills(excludes: ["legacy-support"])

# Combine with version pinning (version comes before params)
@use github.com/owner/repo/skills@2.10.0(includes: ["code-review"])

# Combine with block-level filtering
@use github.com/owner/repo/skills(only: ["skills"], includes: ["code-review"])
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4ASTJmaixDVihHWTQYRghIRlkAa2goZVVmEjFeahgSZg4BmDRmH343ODt1Exw3ACMKXQB6C1YYajXBibW4DqgugAoIVkYoNyk4MOQIlikAWkGANwgYcwi6cJAOOCw53UEQAugBKIqsUrlSpiY7tTrKIiMcZVOANJotarwKYzOYLZarXobSzbXbjZgHI6nZFXG53CKwdQYRiOJ5wNxoCaVUEQ1jFXgAYV6S3OdnMC14r22cAgRjQ51YQN4J2ltDlVl0BiWMDAFTsmDUJDgfOms1481whPWmzJe0ph0R-AATBRUtkcmcLnT4AymMxnm8Pl8QODIXxhSRRVteBLcLwllBmIw2k9YNKoCpoBxqEDcebLYsVjbSTt7VTESc2LU-Y7jnBQT9zpdrr7ePd-YGYO9PryQPk6OhsHhECBC9bibayxSK-WqLQQAwWOxOFgeLwAMqc8gfGRyBQ4OxEUjkOzUDzKQ+DCi8AByI3sGFhzDAB7s4mTbi0IkBbB+GE8XhWAfURBgwTNMBTDQYAoKYhBEXhAisEIUjHAli0nUtyX2OsujyYI4ASERkl+dIslyEA4hICBCHOMIsHPGA4kNUhbkQuJgmrRwAH4wgBXNWHUXgAF5fmPaImMo5DgmbH04F42QGOVUSInE098N4QoCimAEAPEJ9xGUJDgkeGA-QABSgFkYBwZgoCkahFL0gzQTif5AUEiyrJRWz7O2JzPBc0MfC0-hBn4iBGF-VgjLiJ5fks6zfIcsYIqijU8nyftBxATBcHwccMJIEktmnHDqTgF03Q9D0aHof0Vy4Uc+C3LkoF3WR5FsXg1NgAYL14K8YLvB9DSqF8314D9GC-VdsA1f9AOAqpQJgcDHyg9QYLg-x2OQiBQl+QqiWKqdsIdCqqvdHINMIxISLSTIbqk4JqNo1h6MY5in1YsJjOCawWxuBSIsEkSxKidSXs0kKdJEQLqEMvaTIDMz2wiRKfLslLdIR7xguQ9ygS8pLsf83H9MR1ztN8cKlPSthYuQ+KMe8myyccuncwZ-kpKy-IQQYVdqEcfBepgurFxANVZTYfBUn7IA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Rules:**

- `includes` and `excludes` are mutually exclusive — using both is a validation error (PS021)
- Values are skill names (the keys inside the `@skills` block, matching the skill's frontmatter `name`)
- If neither is specified, all skills are imported (current behavior)
- Skill filtering applies to imports that produce a `@skills` block (directory imports, remote repo imports)
- Can be combined with `only`/`exclude` block filters — they operate at different levels (blocks vs skills within a block)
- When combining with version pinning, the version must come before the params: `@use github.com/owner/repo@2.10.0(includes: [...])`, not after
- If an excluded skill is a dependency of an included skill, resolution will fail — this is expected user error

## Content Blocks

Every block and `@extend` body uses the same ordered content model. A body can
interleave properties, free-form text, dash list items, and inline `@use`
declarations:

```promptscript
@context {
  project: "Checkout Service"
  """Shared context appears at this point in the body."""
  - "Keep payment data out of logs"
  @use ./team-context
  environment: production
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34WdiIsXkCre1cAKxhGLBSQAGEcBoBrdwqAZRhqADcIRhg84NiQCJ6cDGppHTYOQgqMNDQYWeVsBRwle2YIbUOduwAjZnFHCgmx3gBacJAAaRgYNHsnLQrxbFFuwzAvCgzHUcFu-DccDsFAA9BxSHdSkssHFOENXKwvmEaBc3I0IGwfPkQPk6OhsHhECB4SREYtylRaCAGEjOFgeLwem41lAIPM5CdeERSOQ7NQPMp2nMKLwAHLMCqYagVZiA2y8cTMRhuL7YAmsOhiTy8VgKsS8OYYKAfRgdDQwa6+IQiSpxCChR40ullZa3OAJETJR7pLK5SbVEgQQiHMJYcWjArFOAiTyzcTKKrBFhSMLICIABSgGBGOGYUCk1FkKZ+1G8IAAunEOMnDupcwWiyWyxWqxhU7WIo3E745snqMMsPqM3EHh3izBS+X+hb4HGJ-q8sT8vWGGzqI58MLog6aPQQAN+nB9fhUiSgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The parser preserves this source order. Tools that consume the canonical AST can
read the ordered `body.entries` sequence directly. Existing integrations can
continue using the mutable `Program`, `Block`, and `BlockContent` interfaces,
which remain available as a compatibility projection.

### @identity

Core identity and persona definition:

```promptscript
@identity {
  """
  You are an expert frontend developer specializing in React.
  You write clean, maintainable, and well-tested code.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IKXYTR15Aq3CQWLqagE13MWo7DCsiNBhqLBVXdk4ZKQA3GChmbupZbsYIDCgIAC8IVnVrXgAlGAxGLAo45rdec2oTO0ZYDrpeEgxVkVWMACNYG46Zc3GoAFoOOA4MhYUgONXqeXyIHyAF0GJwsNRHPgiKRyDAqLQQAwxrQIGx8KkoUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The identity block defines who the AI assistant should be.

**Formatter Behavior:**

| Formatter       | How @identity is used                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **GitHub**      | Included in the output as introductory text                                                            |
| **Claude**      | Placed at the beginning of CLAUDE.md                                                                   |
| **Cursor**      | If it starts with "You are...", used as full intro; otherwise generates "You are working on {project}" |
| **Antigravity** | Included in project description                                                                        |

!!! tip "Best Practice"
Start your `@identity` with "You are..." for consistent output across all formatters.
Multiline strings are automatically dedented to remove source indentation.

### @context

Project context and environment:

```promptscript
@context {
  project: "Checkout Service"
  team: "Payments"
  environment: production

  """
  Additional context as text.
  This service handles payment processing for the e-commerce platform.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34WdiIsXkCre1cAKxhGLBSQAGEcBoBrdwqAZRhqADcIRhg84I5SZoAFJy1TMd5OIddWObCaZnE3Rog2IurYkAWAQUkTXdYMKB02DkIKjGU7rAo4gBUcJVl+oZHeHAwnlgykwjjmNWYIzgcAgrHUKmY1AU7UWAFpdEJqH8HFgwIiSK8DkdiT58iB8gBdBicLDURz4IikcgwKi0EAMAb9GFsfCpclAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Supports both key-value properties and text content. `project`, `languages`, `runtime`, `monorepo`, `techStack` and `architecture` get dedicated rendering; every other property renders as a `Label: value` list item under the context section.

### @standards

Coding standards and conventions using category-based arrays:

```promptscript
@standards {
  code: [
    "Use clean code principles",
    "Prefer hooks and composition patterns",
    "Write tests for all code (80% coverage minimum)",
    "Use vitest as the test framework"
  ]

  naming: [
    "Components: PascalCase",
    "Functions: camelCase",
    "Constants: UPPER_SNAKE_CASE"
  ]

  documentation: [
    "Document all public APIs",
    "Use JSDoc format"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKsdZikw5DjgiIBVODtGWAwrFil7aghWRghyeAi6ZvCQAAVqGDAYal4cZmYAa2UemV00ZjgTCCNMLA5qVjgJqYiAdUGOBXhTFWZljCgoOv6ACgAObIApHUAG5LDR2EhDCAkNwkACUV1qLRA7TswJMTzEylsj1KKjUQnMr3WeWCAF0irVWKQhupGtcQABhZhkNicUxhGYYOCMd6M7kwRHBZEAMQ8jCwRwuYV5Qig-I6QuFEWZFzKHN4rRmMwAogAlAD6AGUAHIAQQA0jqDYyzUadaTeBTWHFxMxGLD2dgpfSkdMACLuz3ad6fNBuABGUAgjF4ZpmAElLiBJn62h1eAApI2B2NgV4kbCO535ED5MkMdnURz4IikMZUWgpkCg2hS-CpMtAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Standards are organized by category with each category containing an array of human-readable rules. **You can use any category name** (e.g., `code`, `naming`, `security`, `api`, `documentation`) - all keys are supported and will generate corresponding subsections in the output.

!!! note "Backwards Compatibility"
The `errors` key is automatically mapped to `error-handling` in the output for backwards compatibility.

#### Structured Keys: git, config, documentation, diagrams

Four keys render as dedicated sections instead of code-standard subsections: `git` (commit conventions), `config` (tool configuration), `documentation` (doc standards), and `diagrams` (diagram preferences). Each known field gets specialized rendering (e.g. `git.format`, `git.types`, `diagrams.format`).

**Custom fields are kept.** Any extra key inside these objects renders as a generic `Label: value` list item - `true` renders as a bare label, `false`/`null` are dropped, nested objects render inline as `key: value` pairs. Known fields accept the same shapes: `true` emits the built-in wording, while a string replaces it with your own text:

```promptscript
@standards {
  git: {
    format: "Conventional Commits"
    branch: "(feat|fix)/{project}/{issue-id}"
    mergeRequest: {
      title: "merge commit summary"
      description: "purpose and issue link"
    }
    requireReview: true
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKtedRMwmuDgsGZqEmwUkABhNgA3TiwINgwoXl6SEhM4PObeACM1VkYcLoAKMBhsAB9IQgBKAHpgGmYAKxhGLHzjpTg3GABaCHFCkDjgoWp1GAAlGAAjg9So0Ps0hlhYF0vj8dMxJiZZG5JhVHLM5rwpHBGNQIGghmwumg3NQ0Mw4HYMJ5jHB7nYoBBWABrdHBQq1YLUQFuCBc-59CAwcxhLDUB5xdn5ED5AC6DEG1Ec+CIpHIMCotBADAGtGGrHwqWlQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Renders on Markdown instruction targets (e.g. Claude Code, Factory AI) as:

```markdown
## Git Commits

- Format: Conventional Commits
- Branch: (feat|fix)/{project}/{issue-id}
- Merge Request: title: merge commit summary, description: purpose and issue link
- Require Review
```

!!! note "Cursor target"
Cursor uses its compact `key: value` style instead of humanized labels (`- branch: (feat|fix)/{project}/{issue-id}`, `- requireReview`).

Free-form text is also supported via a triple-quoted string:

```promptscript
@standards {
  """
  ## Security

  - Validate all inputs
  - Never log secrets
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344EU8ManFlQKtwkFj62u4+AGUYRjdqE0ci2oBaXgA1DCgIcWw7EahrNDdTOIGAORgANxhqXihmdVl26mE4OIa8-JB8gF0GTixqR3wiUnIYKloQBjXaCDZ8VLOgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

!!! note "Per-target support"
Free-form text `@standards` currently renders only for the Factory target. Other targets render property-style `@standards` content only.

### @restrictions

Things the AI should never do:

```promptscript
@restrictions {
  - "Never expose API keys or secrets in code"
  - "Never commit sensitive data to version control"
  - "Always validate user input before processing"
  - "Never use deprecated APIs"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35qeCxqCEYsCDZlQKteAFpwkAA5GAA3GGpeIjRmODsAQQAFAEleAGsYRzMewcZS02sdZik84OaI9q6e3RITWU44Ewgu3nFsUSx5XZOjFnZXKA2mlqGocydlDowoCEuHF4bkGPQgrDQbiwvAARjAwMxSvZXIx4CdWOpXls2p1usDBhcYDQYIxsNJeKMxnA8vkQPkALoMTjlRz4IikcgwKi0EAMO41Vj4VJ0oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Restrictions are concatenated during inheritance.

### @shortcuts

Custom commands for quick actions:

```promptscript
@shortcuts {
  "/review": "Review code for quality and best practices"

  "/test": """
    Write unit tests using:
    - Vitest as the test runner
    - Testing Library for DOM testing
    - MSW for API mocking
  """

  "/refactor": "Suggest refactoring improvements for cleaner code"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq3CQAHpqGAA3CBhzCJSQACU2jvMdZikVct4ARzcMKBNHMU9eACN4LHs1RiwIRng8uIjGjjgsbobYkDjggHVqEzsPEwVV5Tc4CFZ1REveAFpeADU7scxMpbE9gdQPKwYNRvn8ACqrd7qXgAGQgSzU1HmYHGABEAPIAWXBWw+cN4RIAylcxtReABBAAKAEleCRmIwANbI-YXflFeoHFpgDCbcqnCJUtzqdSrXgisVYcrI4xkVytGBaGq4+mMWAYaF6kYwPL5ED5AC6DE4WGx+CIpHIMCotBADE1tAgbHwqQtQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Shortcuts from child files override parent shortcuts with the same name.

#### Cursor Slash Commands (1.6+)

Multi-line shortcuts are automatically converted to executable slash commands:

| Shortcut Type | Output Location              | Behavior                                    |
| ------------- | ---------------------------- | ------------------------------------------- |
| Single-line   | `.cursor/rules/project.mdc`  | Listed as documentation in Commands section |
| Multi-line    | `.cursor/commands/<name>.md` | Executable via `/name` in Cursor chat       |

**Example:**

```promptscript
@meta { id: "cursor-slash-commands" syntax: "1.0.0" }

@shortcuts {
  # Single-line → documentation only
  "/review": "Review code quality"

  # Multi-line → .cursor/commands/test.md
  "/test": """
    Write unit tests using:
    - Vitest as the test runner
    - AAA pattern (Arrange, Act, Assert)
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJgFdazagFo4UDHBxKWJEhlZi4MwXACe7DIUkyAjBQAM9owF8prV9w2KsjWVjjDXQUEAYkEAZQhWAHNYJShImEFAJMJBMWYfPnMsCDZBNigTQOkQAHpqGAA3CBgAdxkrEAAlSuqawRYxRIBHWQx4rEKQVyLQgFlZKGy4hOTBCh8FahLtXX04Eo44LAoSMSKZDfgseuKZM9YgoIB1aggOQVlWO8FNvwe4SKjEIqClQQA1O5HQTqF44RKvQTUR6sGDUH6CP4AQRRgkwWA41AuAAokdRqHoojA6IIkYwsCSkXA4HCsABKfZDJmuJwgJwAXQYnCw1BM+CIpHIMCotBADAqcI+bHw1jZQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Generates `.cursor/commands/test.md`:

<!-- output:cursor for="cursor-slash-commands" file="commands/test.md" -->

```markdown
Write unit tests using: - Vitest as the test runner - AAA pattern (Arrange, Act, Assert)
```

<!-- /output -->

!!! tip "Using Cursor Commands"
Type `/` in Cursor chat to see available commands, then select to execute.

#### GitHub Copilot Output

Shortcuts are handled differently based on their type:

| Shortcut Type                 | Output Location                    | Behavior                                            |
| ----------------------------- | ---------------------------------- | --------------------------------------------------- |
| Simple string                 | `copilot-instructions.md`          | Listed in `## shortcuts` section                    |
| Object without `prompt: true` | `copilot-instructions.md`          | Listed in `## shortcuts` section (uses description) |
| Object with `prompt: true`    | `.github/prompts/<name>.prompt.md` | Generates separate prompt file                      |

#### GitHub Copilot Prompts

To generate `.github/prompts/*.prompt.md` files for GitHub Copilot, use the object syntax with `prompt: true`:

```promptscript
@meta { id: "github-prompts-example" syntax: "1.0.0" }

@shortcuts {
  # Simple string → listed in ## shortcuts section
  "/review": "Review code for quality"

  # Object with prompt: true → generates .github/prompts/test.prompt.md
  "/test": {
    prompt: true
    description: "Write unit tests"
    content: """
      Write unit tests using:
      - Vitest as the test runner
      - AAA pattern (Arrange, Act, Assert)
    """
  }

  # Agent mode prompt with tools
  "/deploy": {
    prompt: true
    description: "Deploy to production"
    mode: agent
    tools: [run_terminal, read_file]
    content: """
      Deploy the application to production:
      1. Run tests
      2. Build the project
      3. Deploy to staging
      4. Run smoke tests
      5. Deploy to production
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEAHMIuAK4AjALQ1mZLHFVFS5GDMFwAnuwyFJMgIwUADPaMBfKa1fc4OZtSyNF24VdBQQBiQQBlCDJYYyxqCFZZQUAkwkEoCDgOMVFWULDPb19-OGMYRiwINiDpEAB6ahgANwgYAHcZKxAAJSaW1sEWMRhBMG9BAEdFDHSsExlXarCAeWUAKzKsQVaFHEENLUk4xWHU2U4Yamx4QQp5JWVa-bRtWo5MqmpNZ4oSMWqZV7wLAdQK5YJ7T4HQRHQxg4JDOCMeLPSqsToAdXiHEEilYCmhQLg8zhAzYHHYnXmIGq4MEmIUw1x+LeAUUcASskQNPBqkEADUGZlBBgSrhhizBNRcawLtzgryAIJKvbYDjUXIACgV1EuiRgdEECvKBoVcDgFywAEpuVTicEXG4wWEFWd2IISMwhhCvpttrhocxmFAiWCAUNyMw5khQbSnlhDlLYbSEUiICi2J0ACIwCMmAPesSKcqou3gj1DSQYV3AklYQPByTIKWsAD6apICWmBoaGDELcgsAAutyWOxOPGaraScFs7noThhhg0OQIIxsKj8xpC8WM3LBLZBF1cQTMiHacEAEwUQQAIUU0GyYu963Ke4AzNfZ1BI-nMlWOXuAAs15HrkcAegA1uKhJ7gArJ+ObfnmdYFkWFRVCStrUmCDpOCATiDgw47UCY+B6NEMAfPQICNBc7JsPg1j4UAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property      | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `prompt`      | boolean  | Yes      | Must be `true` to generate a prompt file |
| `description` | string   | Yes      | Shown in prompt picker UI                |
| `content`     | string   | Yes      | The prompt instructions                  |
| `mode`        | string   | No       | Set to `"agent"` for agentic prompts     |
| `tools`       | string[] | No       | Tools available in agent mode            |

!!! note "Output Mode Required"
Prompt files are only generated when using `version: multifile` or `version: full` in your target configuration:

    ```yaml
    targets:
      - github:
          version: multifile  # Enables .github/prompts/*.prompt.md
    ```

**Generated file** (`.github/prompts/test.prompt.md`):

<!-- output:github for="github-prompts-example" file="prompts/test.prompt.md" -->

```markdown
---
description: 'Write unit tests'
---

Write unit tests using:

- Vitest as the test runner
- AAA pattern (Arrange, Act, Assert)
```

<!-- /output -->

#### Antigravity Workflows

For Antigravity, shortcuts with `steps` property generate workflow files:

```promptscript
@shortcuts {
  "/deploy": {
    description: "Deploy the application"
    steps: ["Build the project", "Run tests", "Deploy to staging"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq3CQAHopcmZHCLC64OCpOEZqCDQsCDYUkAARGFbHBRw7DDRyCEZsEdY87tkONDgw5AiAITdoGVt7VwArGEYsCLoGgCUPBXhTO4bJ6YV5OBF1CFY6giAF04oUCiB8sCGJwsNRHPgiKRyDAqLQQAwAG4wWhrfCpSFAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property      | Type     | Description                    |
| ------------- | -------- | ------------------------------ |
| `description` | string   | Workflow description           |
| `steps`       | string[] | Ordered list of workflow steps |

Generates `.agent/workflows/deploy.md` with numbered steps.

### @params

Configurable parameters:

```promptscript
@params {
  strictness: range(1..5) = 3
  format?: enum("json", "text", "markdown") = "text"
  verbose: boolean = false
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35MNRJlQKtZLGoIRixWeDgwtVZ1GAAKdMyASl4AXl4AZjiwZmoSbAB+MM43Eg6IgCs5Vgi6cJAOQix1zcnqAGtxCzWQPsGI7d2QOIA3GGoAI2Y4GDCX5lgMK0GwDCgbx8+RA+QAugxODVHPgiKRyDAqLQQAwHrQIGx8KlQUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Syntax        | Description                                           |
| ------------- | ----------------------------------------------------- |
| `name: type`  | Required parameter                                    |
| `name?: type` | Optional parameter                                    |
| `= value`     | Default value, rejected when it does not match `type` |

Available types:

| Type              | Accepts                   |
| ----------------- | ------------------------- |
| `string`          | Any string                |
| `number`          | Any number                |
| `boolean`         | `true` or `false`         |
| `range(min..max)` | A number within the range |
| `enum("a", "b")`  | One of the listed strings |

### @guards

Runtime validation rules and file targeting:

```promptscript
@guards {
  maxFileSize: 1000
  allowedLanguages: [typescript, javascript, css]

  # Glob patterns for file-specific rules (used by multifile formatters)
  globs: ["**/*.ts", "**/*.tsx"]

  """
  Additional guard rules as text.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH351NwxqcWVAq14SJIAxfQBlCAAvGDDU7O64jCgoC2kAGQxWUo14MOQsRzR4RmoINCw6XgArDAA3DDgFpZWdODgAXSKavgBxAYAje2wOalZlMGZqFX0AWjg5xghIRl41DcsGUAAo3HBpLxro5asCsH99CpXnUsA84ABKOLqG5wKYRABUBIA9ASKKYIqtCSSyaZCBFTqw4rEQHlggBBSQmCBsPq8cYVQHAgw7BRELAUZms6U+fIgfLHBicLDURz4IikcgwKi0EAMTYwWg81j4VLyoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The `globs` property is used by multifile formatters (GitHub, Claude, Cursor) to generate path-specific instruction files.

#### GitHub Copilot `applyTo` Integration

When using `version: multifile` or `version: full` for GitHub Copilot, the `globs` patterns generate separate instruction files with `applyTo` frontmatter:

```promptscript
@meta { id: "guards-applyto-example" syntax: "1.0.0" }

@guards {
  globs: ["**/*.ts", "**/*.tsx", "**/*.spec.ts", "**/*.test.ts"]
}

@standards {
  typescript: [
    "Use strict TypeScript with no any types",
    "Prefer interfaces over type aliases"
  ]

  testing: [
    "Use Vitest for unit tests",
    "Follow AAA pattern (Arrange, Act, Assert)"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEAHMArhmpi4AWgxpyATyzNVRUuRgzBcLewyFJMgIwUADA5MBfKazfcFSlcLeDBslDMAEZwksgyAFSRAPSRFFhwMnTSINFxCXCEyanp8XBoMIyZOVGx8RxwWCUgALpuru6s3FUYrGLecL6s-lhahXCM1BBoWOF+-qkAqnAwpljDjFiCACr9MADKQyPLAO4QuIKszIJtWoJ9A8kT-jIACtQwYDDUouwvYBiM8ILMAG4vC7rU5QCAYWZJEATepNXrwLAQViycY9SYyGZzABqB3hgjAzFe8lYBwu8MhdBuqQAYswoEFdoIAILMwSYLAcag9AAUjOo1DashgKUZS2FcFm1CwAEoZNCGiBnLUGJwFlp8AYyJQaPQQADaBA2PgbAqgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

This generates:

**`.github/instructions/typescript.instructions.md`:**

<!-- output:github for="guards-applyto-example" file="instructions/typescript.instructions.md" -->

```markdown
---
applyTo:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript-specific rules

- Use strict TypeScript with no any types
- Prefer interfaces over type aliases
```

<!-- /output -->

**`.github/instructions/testing.instructions.md`:**

<!-- output:github for="guards-applyto-example" file="instructions/testing.instructions.md" -->

```markdown
---
applyTo:
  - '**/*.spec.ts'
  - '**/*.test.ts'
---

# Testing-specific rules

- Use Vitest for unit tests
- Follow AAA pattern (Arrange, Act, Assert)
```

<!-- /output -->

!!! note "Version Required"
Path-specific instruction files are only generated with `version: multifile` or `version: full`:

    ```yaml
    targets:
      - github:
          version: multifile
    ```

#### Named Instruction Entries

For projects with multiple path-specific instruction files, use named entries in `@guards` to generate individual instruction files with their own `applyTo` patterns:

```promptscript
@meta { id: "named-guards-example" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular component coding standards"
    content: """
    Use OnPush change detection for all components.
    Always implement OnDestroy for cleanup.
    """
  }
  inversify: {
    applyTo: ["apps/api/**/*.ts"]
    description: "InversifyJS DI coding standards"
    content: """
    Use constructor injection with inject decorator.
    Register all bindings in the container module.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEK1IwxAWgDmAVwzUxcRUVLkYMwXACe7DIUkyAjBQAMdwwF8prF9zUatwl4MEZWalAaiixkbJxYcJLAPr5+aOTGACrMksgyGAlwAPQYYiQQrNkAVMUlFJEydNIgmWg5AO4wAEYAbhAwDSVlxRVwMgC6sb5i8IzUEGhYEGyWIACCAapB1IKhaOHsa8xihcpGAqxinv0gw9vsEXMyN6xxggCqcDCCAPKsAAqqcDhrOP7KF6jDiMaZsQRgZirDBQKDbMKsCJwCjneZQBoYYxwURkWB8LbvAAi8Cw1GYxghULWsH8qjQKLucRuZzOjOcjMKrRgtAgYGM0XOdSgyVSgnStSyuTQEG65UqICGjJGYwmUxmrDmAElWFyeXyAFIAZUEhM1212AQO-mOmlO5xYl3Y1xZ5yeLwdcFJqlBVMKACsYKD1YIGhBcKJWAHQYJRixqNgoQz7gAlGDKCCe7l+WGCZqFC3KbGFQS4d1sASFLMkHbLGBJpku1m+dmOECOAYMCLUYz4XS4us0eggXVwdX4KxtoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Each named entry generates a separate instruction file per target:

- **Multifile targets** (`version: multifile` or `full`): `.claude/rules/<name>.md`, `.cursor/rules/<name>.mdc`, `.github/instructions/<name>.instructions.md` with `applyTo` frontmatter, and `.factory/skills/<name>/SKILL.md` with scope info in the description
- **Antigravity** (any version): `.agent/rules/<name>.md` with glob activation

Named entries support three properties:

| Property      | Required | Description                                             |
| ------------- | -------- | ------------------------------------------------------- |
| `applyTo`     | Yes      | Glob patterns for file targeting (alias: `paths`)       |
| `description` | No       | Human-readable description (defaults to `<name> rules`) |
| `content`     | No       | Full instruction content (triple-quoted markdown)       |

Named entries and `globs` + `@standards` auto-split can coexist in the same `@guards` block.

#### Merge Behavior with `@use`

When multiple `@use`'d files contribute `@guards` blocks with named entries:

- Named entries from different files are preserved as separate keys (ObjectContent deep merge)
- If two files define the same entry name, the importing file's entry takes precedence
- `globs` arrays are concatenated with deduplication

### @skills

Define reusable skills that AI assistants can invoke:

```promptscript
@meta { id: "skills-example" syntax: "1.0.0" }

@skills {
  commit: {
    description: "Create git commits"
    disableModelInvocation: true
    context: "fork"
    agent: "general-purpose"
    allowedTools: ["Bash", "Read", "Write"]
    content: """
      When creating commits:
      1. Use conventional commit format
      2. Include Co-Authored-By trailer
      3. Never amend existing commits
    """
  }

  review: {
    description: "Review code changes"
    userInvocable: true
    content: """
      Perform thorough code review checking:
      - Type safety
      - Error handling
      - Security vulnerabilities
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHADW0KHAC0RUuRgzBcAJ7sMhSTICMFAAzmtAXymtb3eYrjDbgwSxIkIWScFdvBMXhGagg0LAg2IxAAYWoYbBhBAHNvd2ZPbzgZfzcxCDgMACNYAFlmIKgASVYAN2ZGbEjWSSxqAFdNVgD09iIfaXBmajkc7oCMZM4BmSnWGGoMKGU0duo0ZjhNEFzBJahmAHcYMQAVZmYlSWQZACEMOBwZOkGAJQSxZ8GAdVCOGQAursWH12NEcjtxj1vjhOO54k1WMl0pksHBELs3KZBABVLa9WrTZpLFFeLCCMDDEjYTGCABMFEENUYUHaQUEMWYygAgu1cMMTspbjpBG0MNAFrSAMyMgByMEJ1D2fFYYkERAKESRpKyuwhYzcNjs43itQgMEOvl2QTgITCESibwV5sO6XZjBwGCR8ANAXaW2oNXqjRKMFaHS6PRBHDBg31UICAAUFpTqCRRThhsx2skcG6kqaXe5YYwFEiMQm3MpBKcdGgkoUwPwdLTqwBRajUYaCT2qqAQJGtwQAZRgjDW3hFtXaUHmiyK0G85uyCf1kMNtisICsAIY02oOnwajIlBo9BAirgzXwxm3QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property                 | Type     | Formatter       | Description                            |
| ------------------------ | -------- | --------------- | -------------------------------------- |
| `description`            | string   | All             | Human-readable description             |
| `content`                | string   | All             | Detailed skill instructions            |
| `disableModelInvocation` | boolean  | GitHub, Factory | Prevent model from auto-invoking skill |
| `userInvocable`          | boolean  | Claude, Factory | Allow user to manually invoke skill    |
| `context`                | string   | Claude          | Context mode: `"fork"` or `"inherit"`  |
| `agent`                  | string   | Claude          | Agent type: `"general-purpose"`, etc.  |
| `model`                  | string   | Claude, Grok    | Model to use while the skill is active |
| `allowedTools`           | string[] | Claude, Factory | Tools the skill can use                |

Skills are output differently based on the formatter:

**GitHub Output** (`.github/skills/commit/SKILL.md`, version: full):

<!-- output:github for="skills-example" file="skills/commit/SKILL.md" -->

```markdown
---
name: commit
description: 'Create git commits'
disable-model-invocation: true
---

When creating commits:

1. Use conventional commit format
2. Include Co-Authored-By trailer
3. Never amend existing commits
```

<!-- /output -->

**Claude Output** (`.claude/skills/commit/SKILL.md`, version: full):

<!-- output:claude for="skills-example" file="skills/commit/SKILL.md" -->

```markdown
---
name: 'commit'
description: 'Create git commits'
context: fork
agent: general-purpose
allowed-tools:
  - Bash
  - Read
  - Write
disable-model-invocation: true
---

When creating commits:

1. Use conventional commit format
2. Include Co-Authored-By trailer
3. Never amend existing commits
```

<!-- /output -->

### @agents

Define specialized AI agents for target platforms with native agent support:

```promptscript
@meta { id: "agents-example" syntax: "1.1.0" }

@agents {
  code-reviewer: {
    description: "Reviews code for quality and best practices"
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    content: """
      You are a senior code reviewer ensuring high standards.

      When invoked:
      1. Run git diff to see recent changes
      2. Focus on modified files
      3. Begin review immediately

      Review checklist:
      - Code is clear and readable
      - Functions and variables are well-named
      - No duplicated code
      - Proper error handling
    """
  }

  debugger: {
    description: "Debugging specialist for errors and test failures"
    tools: ["Read", "Edit", "Bash", "Grep", "Glob"]
    disallowedTools: ["Write"]
    model: "inherit"
    permissionMode: "acceptEdits"
    skills: ["error-handling", "testing-patterns"]
    content: """
      You are an expert debugger specializing in root cause analysis.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEBgDmnLHAC0RUuRgzBcAJ7sMhSTICMFUwAYtAXymtb3eYrjDbgwSzExl1GADcIMADuMNSSwK5ugp5wjNQQaFgQbEYgAEp+AYHOHjCCYMzUggCOAK4YUBBYOoIYrGKCAEbwWII0GIyJjPAyEW5YzMxQcJLIMukYYjJ00iAA4j5oUzOzUMwNSzIAQhhwODIAur2CJMyeUClwbKz8PayR7mwc7Ck9IEduAJrMJTU+NdqcJKFHKCHz+IIhQScOAlOKsOSCHAQOQ4bQCOoYahiOAUWzvQQAdRwnFErF8zAA1jAJPjTIJUiU7nJKlEIGAwIJ+gDcj4uux3Dhago4PiAEwUQQAMWYjBKzjYx1ObIC9UgsBFd3uggAzBLNjBmXcwZlRCQ+GIINgYFAdHjNfd0uDAgKYIwKRU4FhEPjlIIAMKnXIQbKwTE1OqgmATDANWA+qWMjpJVjOWr1XyYy2x+C-XLBKBQZSsUjU+MAOWYURK5AgjCt9Ry8YACtRmGhISFW4VBXUKvCjq9bm4bHZNZ4GiU5ApQi57VF4LF4olkjMACIwCdTiDw7TtxiWj0tfKFTsFVMRjievIYaCw7pvOf9QbDQSjNJRyYgaYyACiFqwGwgNsuyAfMMCLF+yyrOsICHHOFpwOUqzBGIAAqAxDCMMgEnEHAHEcJxnCk27ErhQ6RO21AkMGcDJgAsoGKTtF0CR-pUIoPvccAUtAmGvjIp7UMoPZiH2ciAZeiTwsomBYBw1Apvhc4sOwigvG8nFal8PyYrktRQoQlEtOOk7TruroHhAABe24ItuoIDC0dZynpxY2rROIDhp5EjlYIBWPsDCKNQOj4GoZCUDQ9AgL4IS0Ww+DGP5QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property              | Type     | Required | Description                                                                          |
| --------------------- | -------- | -------- | ------------------------------------------------------------------------------------ |
| `description`         | string   | Yes      | When the agent should be invoked                                                     |
| `content`             | string   | No       | Additional system prompt for the subagent                                            |
| `tools`               | string[] | No       | Allowed tools (inherits all if omitted)                                              |
| `model`               | string   | No       | AI model to use, mapped to each target's model names                                 |
| `reasoningEffort`     | string   | No       | Target-native reasoning level                                                        |
| `specModel`           | string   | No       | Model for Specification/planning mode (GitHub, Factory only)                         |
| `specReasoningEffort` | string   | No       | Reasoning effort for spec mode: `low`, `medium`, `high` (Factory only)               |
| `disallowedTools`     | string[] | No       | Tools to deny (Claude, grok only)                                                    |
| `permissionMode`      | string   | No       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` (Claude, grok only) |
| `skills`              | string[] | No       | Named skills available to the agent                                                  |
| `mcpServers`          | string[] | No       | Named top-level MCP servers available to the agent                                   |
| `sandboxMode`         | string   | No       | Target-native sandbox policy                                                         |
| `nicknameCandidates`  | string[] | No       | Candidate display names for spawned agents                                           |
| `handoffs`            | array    | No       | Delegation entries (`label`, `agent`, `prompt`, `send`; GitHub only)                 |
| `maxTurns`            | number   | No       | Maximum agentic turns before stopping (Claude, grok only)                            |
| `memory`              | string   | No       | Memory scope: `user`, `project`, `local` (Claude, grok only)                         |
| `background`          | boolean  | No       | Run the agent as a background process (Claude, grok only)                            |
| `isolation`           | string   | No       | Isolation mode: `worktree` (Claude, grok only)                                       |

Every canonical field has an explicit per-target status in the
[Field Support Matrix](../features/agents.md#field-support-matrix). A field a
target cannot represent is reported with a `PS4003` compatibility warning
(agent, field, target, and supporting targets) and omitted, never dropped
silently.

Agents output by platform:

**GitHub Output** (`.github/agents/code-reviewer.md`, version: full)

Supports `description`, `content`, `handoffs`, and `mcpServers` (inlined from
the referenced `@mcpServers` entries), plus `tools`, `model`, and `specModel`
under mapping:

- Tools: `Read` → `read`, `Grep`/`Glob` → `search`, `Bash` → `execute`
- Models: Copilot names from the [model catalog](models.md); floating aliases pick the
  newest release, listed in [Floating Aliases](models.md#floating-aliases), and `inherit` is
  omitted

<!-- output:github for="agents-example" file="agents/code-reviewer.md" -->

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: ['read', 'search', 'execute']
model: Claude Sonnet 5
---

You are a senior code reviewer ensuring high standards.

When invoked:

1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:

- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
```

<!-- /output -->

**Claude Output** (`.claude/agents/code-reviewer.md`, version: full)

Supports `description`, `content`, `tools`, `disallowedTools`, `model`,
`permissionMode`, `skills`, `maxTurns`, `memory`, `mcpServers`, `background`,
and `isolation` (`reasoningEffort`, `specModel`, `specReasoningEffort`,
`sandboxMode`, `nicknameCandidates`, and `handoffs` are reported with
`PS4003` and omitted):

<!-- output:claude for="agents-example" file="agents/code-reviewer.md" -->

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: ['Read', 'Grep', 'Glob', 'Bash']
model: sonnet
---

You are a senior code reviewer ensuring high standards.

When invoked:

1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:

- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
```

<!-- /output -->

!!! note "Agent Platform Features"
Agents can reference `@skills` and `@mcpServers`. Project lifecycle automation is defined
separately through `@hooks`. Target-native support varies by formatter.

### @local

Private instructions not committed to version control:

```promptscript
@local {
  """
  Private development notes and local configuration.
  This content is not committed to git.

  Local environment setup:
  - API keys are in .env.local
  - Use staging backend at localhost:8080
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34oZkYMKF5Aq3CQWLqagAVqCAA3bDspVphStC0sXlZmDmUMT15S8sqWVkh1NzUsCDYKOIAVHCUdNg5tLaGB3RITDhkseXUTVdY4gBkyit5OVohXVn7ZYTc0RDiAWl4AEFGgBJXgAaxgjlG1DsECsFGeFEmFX+vAAqnA7HARJdWOpeAAjDCMSHjbATB5QHDMHGIAAc2UZcXqeXyIHyAF0GJwsNRHPgiKRyDAqLQQAxurRlqx8KkOUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Or with key-value properties:

```promptscript
@local {
  apiEndpoint: "http://localhost:8080"
  debugMode: true
  customPaths: ["/tmp/dev" "/var/local"]

  """
  Additional local notes...
  """
}
```

!!! note "@local Output"
The `@local` block generates `CLAUDE.local.md` when using the Claude formatter with `version: full`. This file should be added to `.gitignore`.

### @commands

Alias for `@shortcuts`. The `@commands` block is functionally identical to `@shortcuts` — both define command aliases. Use `@shortcuts` in new files; `@commands` is supported for backward compatibility.

```promptscript
@commands {
  "/review": "Review code for quality and best practices"
  "/test": "Write unit tests with Vitest"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35dEgxPZUCrcJAAemoYADcIGHMIlJAAJSaW8x1mKRVmal4ARzcMKBNHMU9eACN4LHs1RiwIRng84IjajjgsdpqAdWoTOw8TBSXlcxMcXgA1c4O8-JB8gF0GTixqR3wRFI5BgVFoIAYjRgtAgbHwqQ+QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @knowledge

Reference documentation and knowledge:

```promptscript
@knowledge {
  """
  ## API Reference

  ### Authentication
  - POST /api/auth/login - User login
  - POST /api/auth/logout - User logout

  ### Users
  - GET /api/users - List users
  - GET /api/users/:id - Get user by ID

  ## Architecture Notes

  The service follows a clean architecture pattern with:
  - Controllers for HTTP handling
  - Services for business logic
  - Repositories for data access
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34Aa1YLWHF1O0CrcJBYhrruPgBBAAUASV4AJRgwGGpORhgi5pbeVrdbdghGbAg2OIBaXnaAeQBlABVeAHoMNAgD6Zw9qGZ1CCtVgFU4Qd4Lq9YVta3dg6OT3HPL9ywvDuD2oT3+0zGwRafHugzgbwA4gBRT6HY5uEHKVYAGSUgIxcMRKP2aL2BNoe0QEBkqwRwl45N4ACNHLxOgARSG8CataiMHAmGCMLBuIa8AByzA48NedW2ODsIIAbnM7GBmFALuZlKJGLAMFYMHyBRxhaK7JgsBxqFZzCYcIg3gBhNhYVyauEqZiggAS2227V4OAN4ig13Ub02gxVI2U6tBTIx13gymeczefTQzDgJm9EAM8d44mwogwjFjMuCjTy+RA+QAugxOG7HPgiKRyDAqLQQAwlXDFqx8Kk60A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @examples

Structured few-shot examples for AI assistants (requires syntax `1.2.0`):

```promptscript
@meta {
  id: "commit-style"
  syntax: "1.2.0"
}

@examples {
  feat-commit: {
    description: "Feature commit with scope"
    input: "Added user authentication with JWT tokens"
    output: "feat(auth): add JWT-based user authentication"
  }

  multiline-example: {
    input: """
      const x = users.filter(u => u.active).map(u => u.email);
    """
    output: """
      const activeEmails = users
        .filter(u => u.active)
        .map(u => u.email);
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFNmJEhCwBaOFgCeseWIlxN7DIVnyAjBQBMFAAy7WAXzFjuRUuXjC9gsDGyqWJRVZUXEJQSl4RmoINCwINlMQADE-LABXahhBQOUsQQB3FRxBOBY0GHtwyVY0dKwkgEEpSKlBdLgYakEMepxOeMZsBPEi3EEAKQB1ABVBLGYAa044KvDmerqGuXA0gApe3ABKWQwWydnVACMMTraOrp6+gYgh+LY1p1ZvEnSoeKgEFYMFUbjIsBC3gkQK2SV0ICh4RYrA0gkIggAvO1OrQKJB-l09ulMQA+doUDCMeIANxgRwoJAwaCJpPJMEZ0COAG5EfC1hINlhYTs+WFqsjUZSaTAAKIcqBwTHYrqrMXVQR46AcagsjFk9IUqkQWlHRHVBlM3X6ijsjCcnlqvkIsJfBwgBwAXQYA2omnwYI8VFoIAYtNoI3wZndQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property      | Required | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `input`       | Yes      | The input the AI receives                 |
| `output`      | Yes      | The expected output the AI should produce |
| `description` | No       | Human-readable label for the example      |

Examples can also be defined inline within a `@skills` entry via the `examples` property, scoping them to that specific skill.

See the [Examples guide](../guides/examples.md) for a full walkthrough.

### @workflows

Defines portable workflow definitions. Available since syntax `1.1.0`. Targets that support workflows emit dedicated workflow files (e.g. Claude emits `.claude/workflows/<name>.md`).

```promptscript
@workflows {
  release: {
    description: "Prepare release"
    content: """
      Review changes, validate packages, and prepare release metadata.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35zZmoAazAoC2VAq15qGFgMOBgwuuDgqThGagg0LAg2FJAABUbMRoammBaYPM6dNg52EdiQOMWAJRgANwgYcx0cDFZ1eDpeXYwoCHFsO0xGco0LsU97CYwpxubW3iEInuIgom3CGwhcUKBRA+QAugxOFhqI58ERSOQYFRaCAGLsYLQhqx8KlYUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Each workflow entry is an object with:

| Field         | Required | Description                       |
| ------------- | -------- | --------------------------------- |
| `description` | No       | Short description of the workflow |
| `content`     | No       | Workflow instructions (multiline) |

### @hooks

Defines portable lifecycle hooks. Requires syntax `1.4.0`. Formatters map portable events to each
target's native event system and configuration format.

```promptscript
@hooks {
  protect-generated-files: {
    event: "pre-tool-use"
    matcher: "Edit|Write"
    script: {
      path: ".promptscript/scripts/protect.mjs"
      interpreter: "node"
      args: ["--strict"]
    }
    cwd: "project"
    timeoutMs: 5000
    statusMessage: "Checking generated files"
    continueOnFailure: false
    enabled: true
  }
}
```

Portable events:

| Event                  | Description                       |
| ---------------------- | --------------------------------- |
| `pre-terminal-command` | Fires before a terminal command   |
| `pre-tool-use`         | Fires before a tool invocation    |
| `post-tool-use`        | Fires after a tool invocation     |
| `session-start`        | Fires when a session begins       |
| `setup`                | Alias for `session-start`         |
| `subagent-start`       | Fires when a subagent is launched |
| `notification`         | Fires on notification events      |
| `stop`                 | Fires when the agent stops        |

Each hook entry is an object with:

| Field               | Required | Type     | Description                                                                        |
| ------------------- | -------- | -------- | ---------------------------------------------------------------------------------- |
| `event`             | Yes      | string   | Portable event name (see above)                                                    |
| `command`           | One of   | string[] | Non-empty source argument array                                                    |
| `script`            | One of   | object   | Repository-local script descriptor                                                 |
| `cwd`               | No       | string   | `"project"` or a forward-slash path relative to project root                       |
| `matcher`           | No       | string   | Target-native tool name matcher pattern                                            |
| `timeoutMs`         | No       | number   | Timeout in ms (100-600000)                                                         |
| `statusMessage`     | No       | string   | Status message shown during execution                                              |
| `continueOnFailure` | No       | boolean  | Whether to continue if hook fails                                                  |
| `enabled`           | No       | boolean  | Whether the hook is enabled (default: true)                                        |
| `targets`           | No       | object   | Target-specific overrides, including an optional replacement `command` or `script` |

Exactly one of `command` or `script` is required. A `script` object contains:

| Field         | Required | Type     | Description                                                |
| ------------- | -------- | -------- | ---------------------------------------------------------- |
| `path`        | Yes      | string   | File under `.promptscript/scripts/` using forward slashes  |
| `interpreter` | Yes      | string   | Whitelisted executable name                                |
| `args`        | No       | string[] | Additional arguments, preserved without shell re-splitting |

Supported interpreters are `python3`, `python`, `node`, `deno`, `bun`, `ruby`,
`php`, `perl`, `bash`, `sh`, `zsh`, `pwsh`, and `powershell`. The compiler
requires the path to exist as a regular file and rejects traversal and symlink
escapes from `.promptscript/scripts/`. Browser compilation applies the same
location checks to the virtual filesystem.

Shell interpolation (`$()`, backticks, `${...}`) is forbidden in command
arguments, and `command` must contain at least one argument - PS034 rejects
empty arrays and hooks without an executable command are omitted from target
output. Target adapters preserve argument boundaries when they serialize an
array or script descriptor as a native command string. Script paths and
arguments are shell-quoted as data.

`cwd: "project"` requests execution from the resolved PromptScript project root. Other `cwd` values
must be portable relative paths and resolve from that root. Absolute paths, backslashes, empty path
segments, `.` segments, and `..` traversal are rejected. Hook configuration location does not set
the command working directory.

`matcher` uses each target's tool vocabulary, such as Factory `Execute` or `Read` and Claude
`Edit|Write`. GitHub emits it only for `preToolUse`, `postToolUse`, `subagentStart`, and
`notification`. A matcher written for one target can match nothing on another, so review generated
hook files per target.

Target overrides use the target name as the key:

```promptscript
targets: {
  factory: { matcher: "Execute" command: ["node", "check-factory.mjs"] }
  vscode: { script: { path: ".promptscript/scripts/check.py" interpreter: "python3" } }
  github: { enabled: false }
}
```

VS Code Copilot Agent Hooks are emitted separately at
`.github/hooks/promptscript-vscode.json` when a `vscode` override is present.
They use PascalCase events, camelCase tool input fields, and currently ignore
matcher values. GitHub Copilot CLI and cloud-agent hooks remain in
`.github/hooks/promptscript.json` and use lower camelCase events.

`multifile` and `full` modes emit target-native hook files. `simple` mode
preserves its single-file contract and reports a compatibility warning.

| Target         | Output                                   | Event naming    | Timeout field |
| -------------- | ---------------------------------------- | --------------- | ------------- |
| Factory Droid  | `.factory/hooks.json`                    | PascalCase      | `timeout`     |
| GitHub Copilot | `.github/hooks/promptscript.json`        | lower camelCase | `timeoutSec`  |
| Claude Code    | `.claude/settings.json`                  | PascalCase      | `timeout`     |
| Cursor         | `.cursor/hooks.json`                     | lower camelCase | `timeout`     |
| Codex          | `.codex/hooks.json`                      | PascalCase      | `timeout`     |
| Gemini CLI     | `.gemini/settings.json`                  | PascalCase      | `timeout`     |
| Windsurf       | `.windsurf/hooks.json`                   | snake_case      | -             |
| Grok Build     | `.grok/hooks/promptscript.json`          | PascalCase      | `timeout`     |
| VS Code Agent  | `.github/hooks/promptscript-vscode.json` | PascalCase      | `timeout`     |

GitHub output uses the version 1 repository-hook schema shared by Copilot CLI
and cloud agent. Factory output uses the preferred dedicated project hook file.
Factory still accepts `hooks` inside `.factory/settings.json` only as a
fallback. `prs compile` reports `PS4002` when that fallback file still carries
a non-PromptScript-owned `hooks` key. `prs hooks install factory` migrates
unambiguous legacy entries, preserves unrelated settings, and refuses partial
migrations when event names or entries are ambiguous.
Formatters report `PS4002` when a target cannot represent an event or
optional field instead of silently dropping it.

When `@hooks` is removed or stops emitting, the CLI deletes the obsolete hook
file (`.factory/hooks.json`, `.github/hooks/promptscript.json`, or
`.github/hooks/promptscript-vscode.json`) only when every command in it carries
the PromptScript ownership marker, and prunes managed directories (such as
`.github/hooks/`) that the removal leaves empty.

Every built-in target has an explicit hook capability classification. Targets
without native project hooks and modes that cannot emit additional files
report `PS4002` with a fallback such as `prs compile --watch`. See
[Hooks and Workflows](../features/automation.md#hook-capability-matrix) for the
complete 50-target matrix and project-root behavior.

### @mcpServers

Defines project-local MCP (Model Context Protocol) server configurations. Requires syntax `1.4.0`. Servers are mapped to target-native MCP config files.

```promptscript
@mcpServers {
  security-scanner: {
    transport: "stdio"
    command: ["node", "./tools/security-scanner.mjs"]
    env: {
      LOG_LEVEL: "info"
    }
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH0FGNABlGGoAN0rlQKtZGEY3ahNHAFo4RgxWVkqw+uDgrDVWODRmaiwUkDgscQhmPKGdZhISHtDeZAjWZikIunCQCgB6LGZmKDhTuCaWts7u3sqKEgArOAiAXTjgziqAz+QwAMgB5ADiAH0QQBRABqsJBMwgrDASxAwMKDWx+RA+W+DE4I0c+CIpHIMCotBADBqtEWrHwqXxQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Field       | Required | Type     | Description                           |
| ----------- | -------- | -------- | ------------------------------------- |
| `transport` | Yes      | string   | `stdio`, `http`, or `sse`             |
| `command`   | Yes\*    | string[] | Non-empty argument array (stdio only) |
| `url`       | Yes\*    | string   | HTTP(S) URL (http/sse only)           |
| `env`       | No       | object   | Non-secret environment values         |

Plaintext values are rejected for secret-bearing environment keys. Current target serializers emit
string environment values only, so provide credentials through target-native runtime or secret
management rather than `.prs` source.

`command` is a single array in source, and each target serializer splits it into
that target's native shape. JSON hosts receive the executable in `command` and
the remaining entries in `args`, with `args` omitted when the command takes none:

```json
{
  "mcpServers": {
    "security-scanner": {
      "type": "stdio",
      "command": "node",
      "args": ["./tools/security-scanner.mjs"],
      "env": { "LOG_LEVEL": "info" }
    }
  }
}
```

VS Code is the exception to the wrapper key: `.vscode/mcp.json` nests servers
under `servers` instead of `mcpServers`. TOML hosts keep the array form under
`[mcp_servers.<name>]`.

**Target Support:** The `@mcpServers` block is emitted to target-native MCP config files. See [Configuration Reference](config.md#mcp-hooks-plugins-support) for the full list of supported targets and their output paths.

Agents can reference MCP servers by name via the `mcpServers` field in `@agents`:

```promptscript
@agents {
  reviewer: {
    description: "Code reviewer"
    content: "Review code changes."
    mcpServers: ["security-scanner", "linear"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34NTlNeQKteahgANwgYcxhqMMrg4Kk4RmoINCwINhSQAGFmKWq6hqbqPPadNg52IYAlScb58cYcDFZ1eApZ9pJGNABlZtrmuDDkCLgYRjcerEcAWi6d1maIunCQKAgXwwMxAAF04oUCiB8qCGGVqI58ERSOQYFRaCAGJdaANWPhUtCgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @plugins

Defines portable plugin bundles that group skills, hooks, and MCP servers. Requires syntax `1.4.0`.

```promptscript
@plugins {
  security-suite: {
    description: "Security review tooling"
    version: "1.0.0"
    skills: ["security-review"]
    hooks: ["protect-generated-files"]
    mcpServers: ["security-scanner"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH35yN3UIVmVAq1kYRjdqE0cAWjg3Exgw6uDgqThGRrQsCDYUkABlOoam3moYADcIGHMFZmYoCvU8nt55mFoR1jH07JztnrgAa2goODDkCLgpxqwWucXliIBdOOCcNcud14DxANGYHEYWGa6k4+2w0makFgcG+v14JEYaEm1D2tHuj2eTVajAwrFY+1RNUKBRA+S+DE4WGojnwRFI5BgVFoIAYuLgh3wqVpQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Field         | Required | Type     | Description                     |
| ------------- | -------- | -------- | ------------------------------- |
| `description` | No       | string   | Plugin description              |
| `version`     | No       | string   | Semantic version (e.g. `1.0.0`) |
| `skills`      | No       | string[] | Referenced skill names          |
| `hooks`       | No       | string[] | Referenced hook IDs             |
| `mcpServers`  | No       | string[] | Referenced MCP server names     |

Marketplace publishing and installation are outside the compiler scope.

**Target Support:** Plugins are emitted to `.factory/plugins.json` (Factory), `.cursor/plugins.json` (Cursor), `.codex/plugins.json` (Codex), and `.grok/plugins.json` (Grok).

## @extend Block

Modify inherited or existing blocks:

```promptscript
# Extend a top-level block
@extend identity {
  """
  Additional identity information.
  """
}

# Extend a nested path
@extend standards.code {
  frameworks: [react vue]
}

# Extend multiple levels deep
@extend standards.code.testing {
  e2e: true
  coverage: 90
}
```

### Replacing Regular Block Fields

Syntax `1.3.0` adds explicit replacement for regular block fields. Add `!` after a field name
inside `@extend` to replace its complete prior value:

```promptscript
@meta { id: "project" syntax: "1.4.0" }

@inherit ./company-base

@extend standards {
  testing!: ["Use Vitest"]
  linting: ["Use ESLint"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEDWYArGIywzBcAJ7sMhSTICMFACwUADKoC+U1le4RWOGNQhZBFAPQsyGVuoC0AIww4GCsbIg5WMTUBSIxqMThhK0FBDjgsOwBzAEJJZBkAVWDBADVneBUQAF1kwSg7DNZMvMLigFEAZQAZBpka1nMQczp0bDxEJmYvHwCgmCpaEAYWdk4sfABiQQ6AVzRyCBgouGZUh0EiUnIYQWod1kSHannBADlmF0xqF2YwM5uxMxGDs+FoMmw6IJvFFWB8obcYBgoIJMIwANYYTLzGx8ARJVgpcS6SbTPyBYIyWoaLQ6aQgAwAVlMlIJghIEEIdkkWDuIQGNnS0LiCXxKRYYhgLRAAAUoBhGDAcMwoBLqNEhfE+rU0o1moJ8jK5QqlSrHOrYprqlZLKxuM90k5lBA2IlgLVfHTZfLFcrVQiHRAnWwWYNzFUGGtqOp8JcyJQaPQQAA3RxwZ2sfB6IZAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`testing!` replaces the inherited `testing` value. Unmarked `linting` keeps the normal merge
behavior. Replacement also works after `@use`, with aliased imports, and at nested target paths:

```promptscript
@use ./shared as shared

@extend shared.standards.tooling {
  frameworks!: ["Vue"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH343ODsKAHo4HAxqaTFlatrpIt8iDk9ZGrrxCjgRT1rxOAosZmYoCFZ1XkCrFTUhc2ZqAGs4AEIw5AiANTcYCIBdH3yQfLp0bDxEECaeqloQBhZ2TiweXgBlNzRyCHqcgUODsRFI5Ds1A8yhBdQovAAcswsPZaijmGBgXZxMxGG4tCIsBA2HQxJ1WMixLw6hgoKjGKsNDAKMUhCJZnEIKFwndui0QHE4AkRMkeeksrkBfMSBBCFMwlgoYcCsV+hhBtRhhz5iwpNsIgAFKAYRgwHATKTUWQDcRDY5xDj9KbqfUgI0ms0WmBWtUa7wgE4q3x1frUCCMIlsZRzYIAWh57tN5qglup8EV4cjrDyZ3yRwY72ojnwYOizJo9BAADdvXBiax8KlzkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

If the field does not exist, replacement sets it. Later overlays operate on the resulting value.
The modifier applies only to direct fields in regular block extensions. Skill properties retain
their dedicated merge and sealing semantics, so `!` is rejected when `@extend` targets `@skills`.

The `!` modifier cannot be combined with a default value: `field!: value = default` is rejected,
because a replacement and a fallback default are mutually exclusive.

### Skill-Specific Extend Semantics

When `@extend` targets a skill definition inside `@skills`, properties follow dedicated merge strategies:

| Strategy          | Properties                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Replace**       | `content`, `description`, `trigger`, `userInvocable`, `allowedTools`, `disableModelInvocation`, `context`, `agent`, `license` |
| **Append**        | `references`, `requires`                                                                                                      |
| **Shallow merge** | `params`, `inputs`, `outputs`                                                                                                 |

### Reference Negation

Prefix an entry with `!` in an `@extend` block to remove it from the base before appending:

```promptscript
@extend skills.code-review {
  references: [
    "!references/deprecated.md"
    "references/replacement.md"
  ]
}
```

Path matching is normalized (`"!./foo.md"` matches `"foo.md"`). Only works in `@extend` blocks
on append-strategy properties (`references`, `requires`).

### Sealed Properties

Prevent `@extend` from overriding specific replace-strategy properties:

```promptscript
@skills {
  expert: {
    content: """..."""
    sealed: ["content", "description"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344AGtoKGVAq14iNBhqLDDq4OCWdk4m8JBYkAp+3rzW2RgMWFDeZAj2jnYIum6pOEZqCDQsCDYIgF04woKQfO2GTupHfCJSchgqWhAGADcGuE3WfFTDoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`sealed: true` seals all replace-strategy properties. Attempting to override a sealed
property is a compilation error. Append-strategy properties are not affected.

### Overlay Consistency Warnings

The resolver emits warnings during compile when an `@extend` overlay drifts from its base.
These warnings are always shown (not gated by `--verbose` or `--strict`):

| Warning            | Trigger                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| Orphaned extend    | `@extend` targets a block that doesn't exist (base removed/renamed)         |
| Stale skill target | `@extend` inside `@skills` would create a new skill not defined by the base |
| Negation orphan    | `!entry` in `references`/`requires` doesn't match any base element          |

These come from the resolver, not the validator (`PS0XX` rules). They appear during
`prs compile`, not `prs validate`. See the [Skill Overlays Guide](../guides/skill-overlays.md)
for examples and remediation.

## Values

### Primitive Types

| Type    | Examples             |
| ------- | -------------------- |
| String  | `"hello"`, `'world'` |
| Number  | `42`, `3.14`, `-10`  |
| Boolean | `true`, `false`      |
| Null    | `null`               |

### Strings

PromptScript supports two string syntaxes:

#### Single-line Strings

Use double or single quotes for short, single-line values:

```promptscript
@shortcuts {
  "/review": "Review code for quality and best practices"
  "/help": 'Show available commands'
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq3CQAHpqGAA3CBhzCJSQACU2jvMdZikVct4ARzcMKBNHMU9eACN4LHs1RiwIRng84IjGnBgoNG7eAHIAZTKhjFaMaAwl2GGSEgxPOHOffJB8gF0GJwsNRHPgiKRyDAqLQQAxWjBaBA2PhUn8gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

#### Multi-line Strings

Use triple quotes (`"""`) for content that spans multiple lines:

```promptscript
@shortcuts {
  "/test": """
    Write unit tests using:
    - Vitest as the test runner
    - AAA pattern (Arrange, Act, Assert)
    - Target >90% coverage
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq3CQAHoOOCwIlJBYzvrggHVqEzsPEwV4Grc4CFZ1RDjggFpeADVB1rFlW1G16g9WGGo53kWAQVP7bA5qKwAKY+o1aZg6XmPGLGfjuDh9rABKQ8WABUMNR1MJeAA+ACc2QApDpmAA3fYaGBxLp5fIgfIAXQYnCw1Ec+CIpHIMCotBADGRtAgbHwqWxQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Multi-line strings:

- Preserve line breaks and formatting
- Are ideal for lists, instructions, and documentation
- Can be used anywhere a string is expected

!!! tip "When to Use Which"

    | Content Type | Recommended Syntax |
    | ------------ | ------------------ |
    | Short description (1 line) | `"..."` or `'...'` |
    | Multiple lines, lists, steps | `"""..."""` |
    | Code examples, documentation | `"""..."""` |

    Both forms are semantically equivalent - choose based on readability.

#### Example: Mixed Usage

```promptscript
@shortcuts {
  # Single-line - simple description
  "/review": "Review code for quality and best practices"

  # Multi-line - detailed instructions
  "/deploy": """
    Deploy to production:
    1. Run tests: pnpm test
    2. Build: pnpm build
    3. Deploy: pnpm deploy:prod
  """

  # Single-line - short command
  "/format": "Run prettier on all files"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH344HGZqLEY3U15Aq14+AGUIVnVYAFooFrt22Qhouyk4RmoINCwINjiIgHpqGAA3CBhzCJSQACVF5fMdZikVct4ARzcMLqxHMU9eACN4LHs1RgnGeDy4vgBZNygJzu6vF6UhE+hkLTgWGobhek1YcGmIBmUnIzEca3CIFiWPqwQAIjBUVcsPIaPsYRM2Ig4sF0rwNh4FA84GE0Kw0CQmZCabwAEwUXgAITc0FC9nZnNuIqg3lxvAAzAKCUTWRLeCioGjEGTZcFsR96k0Wm0YADWD1ZGUKnsSCQMJ5ETMwOU7VgMREGVYaMIJjBqIYrOcoCp9AicfkQPkALoMThQxz4IikcgwKi0EAMBZ+uBw-CpSNAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Identifiers

Bare words are treated as strings:

```promptscript
@meta {
  team: Frontend  # Same as "Frontend"
}
```

### Arrays

```promptscript
tags: [frontend react typescript]
patterns: ["hooks" "composition" "render props"]
numbers: [1 2 3]
```

### Objects

```promptscript
code: {
  style: "functional"
  testing: {
    required: true
    coverage: 80
  }
}
```

### Template Expressions

Use `{{variable}}` syntax to reference template parameters:

```promptscript
@meta {
  id: "template-example"
  syntax: "1.0.0"
  params: {
    projectName: string
    port: number = 3000
  }
}

@identity {
  """
  You are working on {{projectName}}.
  """
}

@context {
  project: {{projectName}}
  devServer: "http://localhost:{{port}}"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgOZKNhgBaIqXIx5YiXACe7DIVnyAjBQAMVneMGZqpOLNF2JNZgCsYjLADlSGFk4LGoIVgBzXQl7ZmosWVYAVxIAIxhqQQBeQQBmSwLogF8xEtYxbmlOLAgsfWFonRBbCQBNZiTBDGoYQQB3OIBrcIjBNmFgD29fAL4ioopG5uXSsQqWdiIsBrspnwSJvZnA+eipGAA3AGUMi4zTEBwsLDREAHo3qGZGDCgcZhCiGAkziWFOzVYRRARQAugxqtR9PgNEoYFRaCAGHdaBA2PgzNCgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Template expressions are resolved during inheritance resolution when parameters are bound.

**Valid Variable Names:**

- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Examples: `{{name}}`, `{{projectName}}`, `{{_internal}}`

**Template vs Environment Variables:**

| Syntax    | Resolved        | Purpose               |
| --------- | --------------- | --------------------- |
| `{{var}}` | At resolve time | Template parameters   |
| `${VAR}`  | At parse time   | Environment variables |

```promptscript
# Environment variable - from system at parse time
apiUrl: "${API_URL:-https://api.example.com}"

# Template variable - from @inherit params at resolve time
project: {{projectName}}
```

## Type Expressions

### Range

Numeric range constraint:

```promptscript
strictness: range(1..10)
verbosity: range(0..5) = 2
```

### Enum

String enumeration:

```promptscript
format: enum("json", "text", "markdown")
level: enum("debug", "info", "warn", "error") = "info"
```

## Comments

Single-line comments with `#`:

```promptscript
# This is a comment
@meta {
  id: "project"  # Inline comment
  syntax: "1.0.0"
}
```

## URL Imports

PromptScript supports Go-module-style bare URL imports in `@use` and `@inherit` declarations. A URL import references a Git repository directly by its host path — no registry alias required.

### Basic URL Import

```promptscript
@meta { id: "my-project" syntax: "1.0.0" }

# Import from a public GitHub repo
@use github.com/acme/shared-standards/@fragments/security

# Import from GitLab
@use gitlab.com/myorg/prompts/@stacks/python
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdECQCeAWhrMAVjEZYZguHPYZCkmQEYKABjNaAvlNY2AxIICSZZtSyCw1ZiUFC0AVwAjKAhGQQBxCCwACSDBahg0ZhtufzgYQQBzKJwgihYSAHoMRj5CuBwMBLEFOAFWMSqxOELuTwxMvnYW9MZ-aii5G3snFzcPLx9IrAAZDECUtIzsrCh5-O9C+VdMwuUyLBbuOpKAaxa0OVw2EEs6dGw8RBAV3MCNopKyiqqYGpOGk0ju1OpxDuV1P1BlRaCAGCx2GD8A4AMr+NDkCB-bTMQS4DJEUjkDLUfysOCCHAwBIUQQAOWY7kw42YYDxVMEYmYfS6AiwEDYdF8DUErEZvniMAwUEEmEYpw6MAoKT4AmENkEogk0heOTyBWKpRg5Uq1Vq9Ua1GarRBvJ6kIGWCGIA12l0AgMOpMAFYLC7WJqSBBCBBWJIsKSYDZrKxjhageqA4IWGIYJJkDIAAprRgwHDMKCp6jaeNWmQAXVdHDqocy6azObzBaLJYwgLLIErrBj3ASdQGGgF5MTmoUOuzJSbhepkv7oX5bBk0du9xAmFw+BWa3eBu21F2+zQ4LjZwuV3zrBh9CYbA4XGeqPRmOxcFx+MEhLIsHiZIpVJp9Lisy7isuyGRcjyYLYEOQptmIorikICTSrKZyKsqsaqkIwCuuIhi6qs6y7nIOx7JMR5HCc8pntctj+pqOh6J6xgUL6phLkmQYhmGeKRtGKQApazQjsmzCpvWIATrm+bTsWglNBWVbwPyrB1oIGaSY2MktvJHZdj2fYRvOQ4UjhSZjg2k7aTOhkDgudHLpY5YMGC1ByPgn7ElecIgAAbtScBDvgRi3EAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Extended Version Syntax

Append a version specifier after the import path with `@`:

```promptscript
# Exact tag
@use github.com/acme/shared-standards/@org/base@1.2.0

# Semver range (latest compatible patch)
@use github.com/acme/shared-standards/@org/base@^1.0.0

# Branch
@use github.com/acme/shared-standards/@org/base@main
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fHz4AUWJGLAUNH343ODt1Exw3ACMKXQB6DEYhDrgcDGppAFo4EU9B8TgO-mZqdQ6WjHr+dIAmHKLWPgBlGBIANxhqXjVWdTsACihseErdTCwIFth7bEYcAEoauoam1vazBIXR6MD6AyG4lG43Ek2ms3mi2WMH4AD10tlNqxirwAEJnD4-eq8Rq4AGdbq9fqDEZjDATahTGZzBZLFYkDAQVggfJ0dDYPCIECk5ptCmg8E0qF0hlMhGs5GrCgbTE0ehMNgcLhC3ZuNDkCDSWTyWy8Iikch2ageZQ4Y4wCi8AByzEqmGolWYYAUdt44mYjDcWhETzYdDEnl4rFdYlOMAwUDejAA1hoHTUhCJeIErCEUsL-mKgSCqRDaTC4czEWyUetNiA4nAEiJkuEQOksrkG7mSBBCFywlhrTAfIVfDLYYzlDngiwpGFkBEAAo3RgwHDMKBSE4TyYRAC6cQ4Yy56gXy9X68329kFcZB9HNSGY2oEAqEDY07iwzbK+6V63Y44xfN9Q2xbt8h5PkQEeQUCzJItgUpMFqUhaF6UnOUWSRFZ0RyfC1RABgWHYTgsB4Xgdj1A0jTkH07HNaIrRtXg7SGR0XTdQZPW9U1-UDYNsA-VhwwwqMY1EIYEyTVMLgoDN-GzOIIFCNsRXJYtkMlNDdynKsFVwjF60bZsknzDtjJ7PsBwUYdH3HO8piU3M5xgc8QD-NcN0AndHIfXNjyec53M8gCb107wQEPAonzuV930-Zzgh-C9-28m9nyHUDhLySDeX5XB8HUxCSxQstpUc+FsJrQROVYKhaCIjVSO1EBdX1KBDRkOjTUYy1ThYtiHWdGN3R4+i-QDIMyKEsMIxkaNKkk+NE0wFM03k3xMwCZTVIiYrASQiVUPLDDK3lHCUQ5Lk8mCJtElbNJMks4Je37VhBzsmKHLOqckp0Zh514RcPMvdKgIi-zgkC08QrB68Ib8qL7P4TL4rAr9cxS0G0oRk40eythcp5fcGDI6hHHwPrKEIhgjloYT8FSHkgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Specifier | Meaning                               |
| --------- | ------------------------------------- |
| `@1.2.0`  | Exact tag `v1.2.0` or `1.2.0`         |
| `@^1.0.0` | Latest tag matching `^1.0.0` (semver) |
| `@main`   | Tip of branch `main`                  |
| (none)    | Default branch as configured          |

### Auto-Discovery

When the imported path does not contain `.prs` files, PromptScript automatically discovers and converts native AI plugin files:

| Source File Pattern                       | Imported As        |
| ----------------------------------------- | ------------------ |
| `SKILL.md` in root or `skills/` directory | `@skills` block    |
| `.claude/agents/*.md`                     | `@agents` block    |
| `.claude/commands/*.md`                   | `@shortcuts` block |
| `.github/skills/*/SKILL.md`               | `@skills` block    |

This means you can import skills from any repository — including projects that were not authored with PromptScript:

```promptscript
@meta { id: "my-project" syntax: "1.0.0" }

# Repo has SKILL.md but no .prs files — auto-discovered
@use github.com/some-org/claude-skills/skills/tdd-workflow
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdECQCeAWhrMAVjEZYZguHPYZCkmQEYKABjNaAvlNY2AxIIBKMNM0E4McQQGUA0gEkAGUCKEjFBACMAVyxBVjcqWkFIWC9AFAJBDBjmBTEIOBYANxhqGDEbbii4GEEAcwhcKIiKFhIAejhmPgVmalq2xigssRgFOABraCg4DsmoabasMTEFAHde8bAoZlWQSzp0bDxEEHrG5taOrtHe-sHh0Ympmaf5maWV9epN7dXE+iYbA4XBODm8UTQ5AgZW0blwNSIpHINWoUVYXhwJRgFEEADlmLFMNRYswwIJ4YIxMxGFE+HosBA2HRMqxwvFYkJShgoIJMIxxhhatiKnwBMIbIJRBJpKcGjgmi0uldurcBkMoiMxnMFq8Fh81hstjsZBLtLoBAYZSYAKwWECmkgQQgQViSLComA2aysbhwASsjDUMReYCmlgjSTIGQABSGjBgOGYUBG1G0-rEgfKIAAuqaOH6XbVIzG4wmkym0xgA0GZLnWN7uKU-dQIBpGejxaxJQoZbGMPHE8mSoIm+7Wwy2Cb63tswxOO65PhEWRKDQAcVaO38EY9kA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Alias vs URL Import

Registry aliases (configured via `registries` in `promptscript.yaml`) are a shorthand for URL imports. Both resolve to the same Git fetch:

```promptscript
# With alias (configured as @company -> github.com/acme/base)
@inherit @company/@org/base

# Equivalent full URL import
@inherit github.com/acme/base/@org/base
```

See [Registry Aliases](../guides/registry.md#registry-aliases) for alias configuration.

## Path References

Path syntax for imports and inheritance:

| Format     | Example                            | Description          |
| ---------- | ---------------------------------- | -------------------- |
| Namespaced | `@company/team`                    | Registry namespace   |
| Versioned  | `@company/team@1.0.0`              | With version         |
| Relative   | `./parent`                         | Relative path        |
| Nested     | `@company/guards/security`         | Nested path          |
| URL        | `github.com/org/repo/@path`        | Go-style URL import  |
| URL+ver    | `github.com/org/repo/@path@^1.0.0` | URL with version     |
| SSH        | `git@github.com:org/repo/@path`    | SCP-style Git import |

## Reserved Words

The following are reserved and cannot be used as identifiers:

**Literals:**

- `true`, `false`, `null`

**Type expressions (for @params):**

- `range`, `enum`

**Directives:**

- `meta`, `inherit`, `use`, `extend`, `as`

**Block names:**

- `identity`, `context`, `standards`, `restrictions`
- `knowledge`, `shortcuts`, `commands`, `guards`, `params`
- `skills`, `agents`, `local`
- `workflows`, `hooks`, `mcpServers`, `plugins`, `examples`
- `prompts` (reserved for internal prompt output)

!!! note "Internal Block Type"
The name `prompts` is reserved but is not a user-facing block. Prompt files are generated from
`@shortcuts` with `prompt: true` for targets such as GitHub Copilot. Use the user-facing
`@workflows` block for reusable procedures.

## File Extensions

| Extension       | Description                       |
| --------------- | --------------------------------- |
| `.prs`          | PromptScript source file          |
| `.promptscript` | Alternative extension (supported) |

## Known Issues & Gotchas

### Multiline Strings in Objects

Multiline strings (`"""..."""`) cannot be used as "loose" content inside an object with curly braces. They must always be assigned to a key.

**❌ Invalid:**

````promptscript
@standards {
  diagrams: {
    format: "Mermaid"
    types: [flowchart sequence]
    """
    Example:
    ```mermaid
    flowchart LR
      A[Input] --> B[Process] --> C[Output]
    ```
    """
  }
}
````

This will cause a parse error:

```
Expecting token of type --> RBrace <-- but found --> '"""...
```

**✅ Valid - assign to a key:**

````promptscript
@standards {
  diagrams: {
    format: "Mermaid"
    types: [flowchart sequence]
    example: """
      ```mermaid
      flowchart LR
        A[Input] --> B[Process] --> C[Output]
      ```
    """
  }
}
````

**✅ Valid - use at block level:**

```promptscript
@knowledge {
  """
  Multiline content works directly in blocks
  without needing a key assignment.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34Aa1YLWHF1O0CrcJBYhrqAWTcoLGgIVjsWdk4sXnNmahLlcQhqGEYsKEdrXgAjKGZGUbjzExx3Ae7pLvUxXhKYOYw4OAh1Vi0sCjjGvPyQfIBdBn7qR3wiUnIYKloIAYADcYLQIGx8KlnkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

!!! tip "Rule of Thumb"
Inside `{ }` braces, everything needs a key. Multiline strings without keys only work directly inside blocks like `@identity { ... }` or `@knowledge { ... }`.

## Environment Variable Interpolation

String values can reference environment variables for dynamic configuration:

```promptscript
@context {
  api-endpoint: "${API_ENDPOINT}"
  environment: "${NODE_ENV:-development}"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34WdiIsXkCrMTQIAFpOcTRmCHYUkAASYABBAAUASQB9AFEAOQARXoB5ftGAFUKQOM4ANwhXVi0sdq7RqfHhkdGANUQ6qRWYKGY0LcWffJB8gF0GTixqR3wiUnIYKloIAYl1oEDY+FSTyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Syntax

| Pattern           | Description                         |
| ----------------- | ----------------------------------- |
| `${VAR}`          | Substitute with variable value      |
| `${VAR:-default}` | Substitute with variable or default |

Syntax `1.5.0` accepts a reference without quotes wherever a value is expected,
which keeps single-variable fields readable:

```promptscript
@meta {
  id: "unquoted-env-vars"
  syntax: "1.5.0"
}

@context {
  environment: ${NODE_ENV:-development}
  regions: [${PRIMARY_REGION:-us-east-1}, "eu-west-1"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgArqwCOC5hykBaTgDdNOjLXliJcAJ7sMhWfICMFAKwUADMdYBfMWO4t2RLMImgroQ1Gx87LIAJMAAcgDyACIAogD6ybEAaoiaUjA6MFDMaBFYnuKC1DAA5hBscLLIMQAKAEoAkgCyAIKtAJqprckA4u3xsTkKcNoYcFiatu50cgQKmgDu8PO28gC6Yu4g7rsMnFjUZvhEpOQwVLQgDAW0daz4tkdAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The value is always a string. Quote the reference when the field mixes it with
other text.

### Examples

```promptscript
@meta {
  id: "env-vars-example"
  syntax: "1.0.0"
}

@context {
  project: "My App - ${PROJECT_NAME:-default}"

  """
  Running in ${NODE_ENV:-development} mode.
  API Key: ${API_KEY}
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEFWANwC0ijLWVFS5GPLES4AT3YZCs+QEYKABht7WAXzFjuLdkSzD9gmswBWMIxY5iAAsoaCAIJoaILKggAkwAAKAEoA8gBSAKIAwgAqAPoAcpGh2YjKUjBgGACuUFhOIM7ici0d3ql1rKwQrADmkuJJxekAItmF2cUAapXVijBQzGh87A6CJMzVFN6RyQCSggDSMIaySQeHhSfZAJpObXqdjiAOALoMnFjUhvhaMiUGj0EBLWgQNj4CzvIA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

!!! warning "Missing Variables"
If a variable is not set and no default is provided:

    - An empty string is substituted
    - A warning is logged to the console

    This follows Linux shell behavior for unset variables.

!!! tip "Best Practices"

    1. **Always provide defaults** for non-sensitive values
    2. **Never commit secrets** - use environment variables for API keys
    3. **Document required variables** in your project README

## Generated Section Headers

Syntax `1.5.0` lets source files override human-readable section titles without
forking a formatter. Place contextual `@header` directives directly inside a
registered owner block:

```promptscript
@meta {
  id: "localized-project"
  syntax: "1.5.0"
}

@standards {
  @header "Coding Rules"
  @header git-commits "Commit Rules"
  @header documentation "Dokumentacja zespołu"

  code: ["Use strict TypeScript"]
  git: { format: "conventional" }
  documentation: { verifyAfter: true }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgozRhigQAXjCkBaGswBWMRlnliJcAJ7sMhWfICMFAKwUADCdYBfMWO5wBrKQxqKThhU0FuHBgMKRhqORAAYWYpCFYAc0EAJQBXWDh3CUjo2Pj0iCwtFhISCtD5ZJqK7Lz4QoiomLjBKSUcvissCDYEgBFmAGt+zgFGPSENODRmQCFAHPdwlljZZHkAVTgYQT9qCCNBABVzNBgAZUZTtGMQAF1w8qxZYEEwZmoSbC2JhsABuM2GrBU8kEXnEPT6AwEQzYX0EYNOYHMAEEwBxqLIsNQckdYR4QB4XgwZtRzPgiKRyDAqLQQAx0XAIfg7OSgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

- `@header "Title"` names the block's primary generated section.
- `@header <section-key> "Title"` names a derived section.
- Titles must be non-empty, single-line strings.
- Canonical section keys use kebab-case.
- Source overrides take precedence over formatter configuration and target defaults.
- Overrides change only human-readable titles. Filenames, frontmatter properties,
  XML tags, and structured JSON, TOML, or YAML keys stay unchanged.
- Ordinary `header` and `headers` fields remain domain data, including nested HTTP
  headers in `@mcpServers`.

| Section key           | Primary owner   | Fallback owners           | Keyless `@header` owner   |
| --------------------- | --------------- | ------------------------- | ------------------------- |
| `project`             | `@identity`     | `@context`                | `@identity`               |
| `tech-stack`          | `@context`      | `@standards`              | -                         |
| `architecture`        | `@context`      | -                         | -                         |
| `context`             | `@context`      | -                         | `@context`                |
| `code-standards`      | `@standards`    | -                         | `@standards`              |
| `git-commits`         | `@standards`    | -                         | -                         |
| `configuration-files` | `@standards`    | -                         | -                         |
| `commands`            | `@shortcuts`    | `@commands`, `@knowledge` | `@shortcuts`, `@commands` |
| `post-work`           | `@knowledge`    | -                         | -                         |
| `documentation`       | `@standards`    | -                         | -                         |
| `diagrams`            | `@standards`    | -                         | -                         |
| `knowledge`           | `@knowledge`    | -                         | `@knowledge`              |
| `restrictions`        | `@restrictions` | -                         | `@restrictions`           |
| `examples`            | `@examples`     | -                         | `@examples`               |

For registered text-only primary owners, syntax `1.5.0` also recognizes an
initial `## Heading` as a compatibility fallback:

```promptscript
@identity {
  """
  ## Project Instructions
  Follow repository conventions.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoAVgoABljWAF8fH34IKXYTR15Aq3CQWLqa7j4ABVcAKxhGLF4ASVY4LGo3Log2ODiAMWYoKAteahg0ZjgTZmpKllYAN04sUf6KOPq8-JB8gF0GXfX8IlJyGCpaEAYd2n38VLOgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The formatter emits that heading once and preserves the remaining body. Explicit
`@header` metadata always wins over this fallback. Syntax `1.4.x` and earlier
keep the heading as ordinary body text, so existing output remains unchanged.

## Hook Target Executable Overrides

An `@hooks` target override supports `event`, `command`, `script`, `matcher`,
`timeoutMs`, `statusMessage`, `continueOnFailure`, `enabled`, and `cwd`. A
target may define either `command` or `script` to replace the base executable
for that target. It inherits the base executable when neither field is present,
and PS034 rejects overrides that define both.

Replacement executables use the same command interpolation, script path,
interpreter, and argument validation as base executables. Enabled target
scripts are included in Node and browser compiler resource validation.
Disabled target overrides emit no hook and do not require their script
resource.

## Terminal Command Hook Portability

`pre-terminal-command` supplies deterministic native defaults for terminal
policy: Factory `Execute`, Claude and Codex `Bash`, Windsurf
`pre_run_command`, Cursor `run_terminal_cmd`, Gemini `run_shell_command`, and
VS Code `run_in_terminal`. Set `targets.<name>.matcher` to replace a native tool
name. Cursor, Gemini, and VS Code emit `PS4002` because their coverage is best
effort. GitHub Copilot CLI/cloud and Grok omit the event with `PS4002` because
their repository hook contracts do not guarantee terminal interception.

## Hook Project Root Failure

Environment-root and Git-root wrappers exit non-zero before an interpreter or
command runs when they cannot resolve a non-empty project root. Native-cwd and
workspace-cwd targets retain host-provided cwd fields and report `PS4002`
because PromptScript cannot independently verify the host cwd. No target
wrapper falls back to the process working directory.

## Canonical Block Shape Reference

See [Block Shapes](block-shapes.md) for the canonical shape, compatibility
forms, merge rules, diagnostics, and formatter behavior of every built-in
block.

## Atomic Replacement with @override

Syntax `1.5.0` adds `@override` for replacing a complete existing target:

```text
@standards {
  testing: ["Use Jest", "Use Mocha"]
  tooling: { runner: "jest" coverage: 80 }
}

@override standards.testing {
  ["Use Vitest"]
}

@override standards.tooling.runner {
  "vitest"
}

@extend standards {
  testing: ["Require coverage"]
}
```

`@override standards.testing` replaces the complete array. The later `@extend`
then adds to that replacement. A root override replaces the complete block body:

```text
@override standards {
  testing: ["Use Vitest"]
}
```

Root replacements accept regular text, object, array, or mixed block bodies.
Nested replacements also accept standalone object, string, number, boolean, and
`null` values. The complete target path must already exist when the operation
runs. Missing targets and traversal through scalar values are errors.

Operations use declaration order in syntax `1.5.0`. This includes `@inherit`,
top-level `@use`, local blocks, `@extend`, and `@override`. An `@override` used
with an older declared syntax also uses declaration order so replacement remains
deterministic, while PS018 requests a syntax upgrade.

Resolver derives operation mode from the complete reachable composition graph.
Inherited files, top-level imports, and inline composed skills can enable
declaration order for a lower-version entry file. Such mixed-version graphs
remain valid, while PS018 reports the ordered-operation requirement. Graphs
without ordered sources retain legacy phase ordering.

Use the forms according to intent:

| Form        | Behavior                                                       |
| ----------- | -------------------------------------------------------------- |
| `@extend`   | Add or merge content using the target shape's merge policy.    |
| `field!`    | Compatibility replacement for one direct regular extend field. |
| `@override` | Replace one complete existing block or nested target value.    |

`@override` cannot change or remove sealed skill properties. `@override { ... }`
without a target remains a legal custom block named `override`.

This complete example exercises root and nested replacement shapes:

```promptscript
@meta { id: "override-shapes" syntax: "1.5.0" }

@identity { """Old identity""" }
@restrictions { - "Old restriction" }
@standards {
  testing: ["Use Jest"]
  config: { enabled: true retries: 1 }
}

@override identity { "New identity" }
@override restrictions { ["No unsafe casts"] }
@override standards {
  """Required engineering rules."""
  testing: ["Use Vitest"]
  config: { enabled: true retries: 1 }
  - "Document failures"
}
@override standards.config.enabled { false }
@override standards.config.retries { 3 }
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEMwBuMatXEwAtHBwY08GYLgBPdhkKSZARgoBWCgAZdAXymsn3FewhZ9w6SBkyA8lBiomKcWB76fr4ggo6s3NTwWMqM4Wxw3qo+gcGJcMkQqRBsDi75GKxiGNRiGcBOgoIc+RCsAOaSyDIAqnAwggBSSTIAug2CLKyQHd6cGABGsBJN1ACu-YkF8JJmsU5xLvKKyqEhYRHeMgByMADuZ+6epfFHSiqCeQVF6d5dIFfMQSrVhwDBgfqMDD5OCjPYvBRvU7lSrVWrCcZRGQAJRgAEdVhBEsFOG1WjBFK02h9VrA4BRMb5WI1muF2p0en1BAA1DzDEBjJkTNjTSQiOaLGDLZLrD78ZTbQS7OKNLIyAAizEYqz47EEYAw0FWeT8rDi3FeJ36yKqNTpk2mFHFS28+qgnLNFve1tRduFEDaFE28rqggAzLEQPYRgwwtR9PgiKRyDAqLQQAwEXBiqx8GZI0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### AST compatibility timeline

The compiler and validator use `CanonicalProgram` as their internal contract.
Resolver results expose `canonicalAst` as the primary representation and retain
`ast` for legacy integrations. Formatter implementations can opt into
`formatCanonical()`; legacy formatters receive one detached projection through
`toLegacyProgram()`.

`ResolvedAST` now always includes `canonicalAst`: successful resolutions carry a
`CanonicalProgram`, while failed resolutions carry `null`. Integrations that
construct `ResolvedAST` values must provide this field.

During the remaining 1.x compatibility window, integrations should migrate
from `Program` to `CanonicalProgram`. A future major release may remove
legacy-only entry points after the formatter and integration ecosystem has
migrated.
