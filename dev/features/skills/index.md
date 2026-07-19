# Skills and Resources

Skills package reusable agent capabilities. A skill can contain instructions, invocation metadata, input and output contracts, references, assets, and executable scripts.

PromptScript resolves each skill once and emits the target-native representation supported by each configured AI platform.

## Inline Skill

```
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

PromptScript preserves the directory structure when producing native skill files. Script invocation and executable file modes remain platform and operating-system specific.

## Skill Capabilities

| Capability               | Purpose                            |
| ------------------------ | ---------------------------------- |
| `description`            | Discovery and invocation guidance  |
| `content`                | Main skill instructions            |
| `allowedTools`           | Tool permissions                   |
| `userInvocable`          | Manual user invocation             |
| `disableModelInvocation` | Prevent automatic model invocation |
| `context`                | Inherit or fork execution context  |
| `agent`                  | Select agent type                  |
| `requires`               | Declare skill dependencies         |
| `references`             | Bundle supporting documents        |
| `scripts`                | Bundle executable helpers          |
| `inputs` and `outputs`   | Define typed skill contracts       |
| `params`                 | Parameterize reusable skills       |
| `examples`               | Attach focused examples            |

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

Gemini full mode emits interoperable `.agents/skills/<name>/skill.md` files alongside native commands under `.gemini/commands/`.

## Filter Skills Per Target

```yaml
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

```
@use ./skills/security-review.md
@use @company/skills/release@^2.0.0
@use github.com/acme/agent-skills/database-review@1.3.0
```

Remote references are recorded in `promptscript.lock` with commit and integrity information.

## Related Documentation

- [Building Skills](https://getpromptscript.dev/dev/guides/building-skills/index.md)
- [Local Skills](https://getpromptscript.dev/dev/guides/local-skills/index.md)
- [Skill Composition](https://getpromptscript.dev/dev/guides/skill-composition/index.md)
- [Skill Contracts](https://getpromptscript.dev/dev/guides/skill-contracts/index.md)
- [Shared Resources](https://getpromptscript.dev/dev/guides/shared-resources/index.md)
- [Language Reference: `@skills`](https://getpromptscript.dev/dev/reference/language/#skills)
