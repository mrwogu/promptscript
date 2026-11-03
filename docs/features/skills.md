---
title: Skills and Resources
description: Build portable AI skills with instructions, contracts, references, scripts, assets, and target-native output.
---

# Skills and Resources

Skills package reusable agent capabilities. A skill can contain instructions, invocation metadata,
input and output contracts, references, assets, and executable scripts.

PromptScript resolves each skill once and emits the target-native representation supported by each
configured AI platform.

## Inline Skill

```promptscript
@skills {
  security-review: {
    description: "Review code for application security risks"
    userInvocable: true
    disableModelInvocation: false
    allowedTools: ["Read", "Grep", "Bash"]
    content: """
      Review authentication, authorization, secret handling, input validation,
      dependency risk, and unsafe command execution.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH344AGtoKGVAq1kYRjdqE0cAWmoYADcIGHMw6uDgqThGRrQsCDYUkAAlDq7zHWYpFWZqMTRyCEZscas4Ooam3kayuDz+3jc96gBJVnbmLYAjWDCsajcYOIGlDGeYAFlFjAoLd7lsxhMVBhKp8asFoVALNIACrMZiVMLICIzCQROjhEAAcTaaDxBIAQhg4DgIgBdL4LdicLCTWIgBnBGadbpiNy2dibbZsfEYPk4FYQABeQtY+L2w2EvBwGE8UAgrHU+PVaD5vHa0Ig4hldA5vCkaE4UlYjEcRyUpRFngurDgGDAdl0JBVMiI+whrAoDLZZ14hQKIHytIYzOojnwRFI5BgVFoIAY7RgtB2+FSEaAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Directory Skill

Portable skills can use a complete directory:

```text
.promptscript/skills/security-review/
├── SKILL.md
├── LICENSE
├── references/
│   └── threat-model.md
├── scripts/
│   └── scan.sh
└── assets/
    └── report-template.md
```

`SKILL.md` frontmatter declares resources and scripts:

```yaml
---
name: security-review
description: Review code for application security risks
license: MIT
compatibility: Requires shell access
metadata:
  owner: security
allowed-tools: 'Read Grep Bash'
references:
  - references/threat-model.md
scripts:
  - scripts/scan.sh
inputs:
  path:
    type: string
    description: Path to review
outputs:
  report:
    type: string
    description: Review report
---
Review selected code and use bundled references when evaluating risk.
```

PromptScript preserves the directory structure when producing native skill files. Script invocation
and executable file modes remain platform and operating-system specific.

## Skill Capabilities

| Capability                       | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `description`                    | Discovery and invocation guidance  |
| `license` and `compatibility`    | Native skill metadata              |
| `metadata`                       | Additional native skill metadata   |
| `content`                        | Main skill instructions            |
| `allowedTools` / `allowed-tools` | Tool permissions                   |
| `userInvocable`                  | Manual user invocation             |
| `disableModelInvocation`         | Prevent automatic model invocation |
| `context`                        | Inherit or fork execution context  |
| `agent`                          | Select agent type                  |
| `model`                          | Select the model for the skill     |
| `requires`                       | Declare skill dependencies         |
| `references`                     | Bundle supporting documents        |
| `scripts`                        | Bundle executable helpers          |
| `inputs` and `outputs`           | Define typed skill contracts       |
| `params`                         | Parameterize reusable skills       |
| `examples`                       | Attach focused examples            |

`model` sets the model used while the skill is active. Claude Code and Grok
Build write it to the skill file, mapped through the
[model catalog](../reference/models.md) the same way as agent models. Other
targets have no skill model field and leave it out.

For skills backed by a SKILL.md file, a `model` set in `.prs` wins over the
SKILL.md frontmatter, and a frontmatter model without a `.prs` one is mapped
the same way. A model the target cannot run is left out of the skill file and
reported with a PS4004 warning during compilation.

## Universal and Native Paths

PromptScript can discover shared skills from the universal `.agents/skills/` directory:

```yaml
universalDir: .agents
```

Target formatters then emit native paths such as:

- `.claude/skills/<name>/SKILL.md`
- `.github/skills/<name>/SKILL.md`
- `.factory/skills/<name>/SKILL.md`
- `.opencode/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`

Gemini full mode emits interoperable `.agents/skills/<name>/skill.md` files alongside native
commands under `.gemini/commands/`.

## Path Tokens

Skill text often points at the skill's own files. A fixed path like
`.factory/skills/lint/check.py` is wrong once the same skill compiles for
Claude Code. Write a path token instead and every target writes its own path:

| Token               | Claude Code example   | Factory example        |
| ------------------- | --------------------- | ---------------------- |
| `{{prs.dotDir}}`    | `.claude`             | `.factory`             |
| `{{prs.skillsDir}}` | `.claude/skills`      | `.factory/skills`      |
| `{{prs.skillDir}}`  | `.claude/skills/lint` | `.factory/skills/lint` |

```promptscript
@skills {
  lint: {
    description: "Lint changed files"
    content: """
      Run `python {{prs.skillDir}}/check.py` on the changed files.
      For formatting use the script in {{prs.skillsDir}}/format.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH344AGtoKGVAq14oCHYw6uDgqThGagg0LAg2FJAAGXqsHRwMVnVpFX04POadNg4G8JBYlZq5gCUPXgADNEdcI2BgGjgKMoqAEQhqfPyAekYcGEZSqkcdwxtnkbGJmUgsDOcTmADFmNQVBCSNhuuNeG44HZbLJ2p1hvVeMdTudylBKtdbg8wNDsBQQctVnFCgUQPkALoMThYaiOfBEUjkGBUWggBgANxgtB6rHwqTpQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Tokens work in every generated file, so agents and commands can use
`{{prs.dotDir}}` and `{{prs.skillsDir}}` too. `{{prs.skillsDir}}` follows
`skillBaseDir` when it is set. `{{prs.skillDir}}` has a value only in the files
of a skill directory; anywhere else, and for a target without such a
directory, the token stays as written and compilation reports a `PS4002`
warning. Only these exact tokens are replaced, other `{{...}}` text such as
Mermaid hexagons `{{"label"}}` is not touched. Write `\{{prs.dotDir}}` to keep
the token itself in the output.

## Filter Skills Per Target

```yaml
id: filtered-skills-project
syntax: '1.4.0'

targets:
  - factory:
      version: full
      includeSkills:
        - security-review
        - release
  - claude:
      version: full
      includeSkills: true
```

Use `skillBaseDir` when generating skills inside a plugin, package, or nested monorepo build:

```yaml
builds:
  payments:
    output: packages/payments
    targets:
      - factory:
          version: full
          skillBaseDir: .factory/skills
```

## Import Skills

Skills can come from local files, registries, or Git repositories:

```promptscript
@use ./skills/security-review.md
@use @company/skills/release@^2.0.0
@use github.com/acme/agent-skills/database-review@1.3.0
```

Remote references are recorded in `promptscript.lock` with commit and integrity information.

## Related Documentation

- [Building Skills](../guides/building-skills.md)
- [Local Skills](../guides/local-skills.md)
- [Skill Composition](../guides/skill-composition.md)
- [Skill Contracts](../guides/skill-contracts.md)
- [Shared Resources](../guides/shared-resources.md)
- [Language Reference: `@skills`](../reference/language.md#skills)
