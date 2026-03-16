---
title: Shared Resources
description: Share files across all skills using the .promptscript/shared/ directory
---

# Shared Resources

Place files in `.promptscript/shared/` to make them available to every skill during compilation. Shared resources are included in each skill's output with the `@shared/` prefix.

## Directory Structure

```
my-project/
├── .promptscript/
│   ├── project.prs
│   ├── skills/
│   │   ├── review/
│   │   │   └── SKILL.md
│   │   └── security/
│   │       └── SKILL.md
│   └── shared/                  # Shared across all skills
│       ├── templates/
│       │   └── report.md
│       └── data/
│           └── config.json
└── promptscript.yaml
```

## How It Works

When PromptScript compiles skills, it:

1. Discovers files in `.promptscript/shared/`
2. Adds them to **every** skill's resources with an `@shared/` prefix
3. Copies them to each compilation target alongside skill-specific files

A skill at `.promptscript/skills/review/` with its own `checklist.md` and shared resources gets:

```
.claude/skills/review/
├── SKILL.md
├── checklist.md              # Skill-specific resource
├── @shared/templates/report.md   # From shared/
└── @shared/data/config.json      # From shared/
```

## Use Cases

- **Report templates** shared across review, security, and audit skills
- **Configuration files** (linting rules, coding standards) used by multiple skills
- **Data files** (CSV databases, JSON schemas) referenced by several skills
- **Scripts** (Python tools, shell scripts) invoked by different skills

## Security Limits

Shared resources follow the same security limits as skill resources:

- Files larger than 1 MB are skipped
- Total resources per skill cannot exceed 10 MB
- Maximum 100 resource files per skill (including shared)
- Symlinks are ignored
- Binary files are excluded
- System files (`.env`, `.gitignore`, `node_modules/`) are skipped

## See Also

- [Local Skills](local-skills.md) — Managing skills in your project
- [Parameterized Skills](local-skills.md#parameterized-skills) — Making skills configurable
