---
title: Local Skills
description: Install and manage skills directly in your project without a registry
---

# Local Skills

Drop skills directly into your project's `.promptscript/skills/` directory. No registry configuration needed — PromptScript discovers them automatically and copies all resource files (CSV data, Python scripts, images) to every compilation target.

## Why Local Skills?

| Approach                                   | Best for                                                     |
| ------------------------------------------ | ------------------------------------------------------------ |
| Registry (`@inherit`, `@use`)              | Shared org-wide standards, versioned packages                |
| **Local skills** (`.promptscript/skills/`) | Third-party skills, project-specific skills, rapid iteration |

Local skills solve a real problem: skills from the open-source ecosystem come as directories with a `SKILL.md` and resource files. Previously, you had to inline their content into `.prs` files and manually manage resource files. Now you just drop the directory in and reference the skill name.

### Key advantages

- **Zero config** — put a folder in `skills/`, reference it in `@skills {}`, done
- **Resource files preserved** — CSV data, Python scripts, shell scripts, images — everything alongside `SKILL.md` gets copied to all targets automatically
- **Works with any skill source** — [Skills.sh](https://github.com/anthropics/skills), [OpenSkills](https://github.com/numman-ali/openskills), [SkillKit](https://github.com/rohitg00/skillkit), manual downloads, or your own creations
- **Multi-target** — one skill directory compiles to `.claude/skills/`, `.factory/skills/`, `.gemini/skills/`, `.opencode/skills/`, `.github/skills/` simultaneously
- **No registry needed** — works alongside registry-based inheritance without conflicts

## Directory Structure

```
my-project/
├── .promptscript/
│   ├── project.prs              # References skills by name
│   └── skills/                  # ← Local skills directory
│       ├── ui-ux-pro-max/       # Skill with resource files
│       │   ├── SKILL.md         # Skill instructions
│       │   ├── data/            # CSV databases
│       │   │   ├── colors.csv
│       │   │   ├── typography.csv
│       │   │   └── stacks/
│       │   │       ├── react.csv
│       │   │       └── vue.csv
│       │   └── scripts/         # Python tools
│       │       ├── search.py
│       │       └── design_system.py
│       └── commit/              # Simple skill (just SKILL.md)
│           └── SKILL.md
└── promptscript.yaml
```

## Getting Started

### 1. Create the skills directory

```bash
mkdir -p .promptscript/skills
```

### 2. Add a skill

You can add skills from multiple sources:

=== "npx skills (Skills.sh)"

    The [`skills`](https://www.npmjs.com/package/skills) CLI from the Agent Skills ecosystem
    lets you install skills from any GitHub repository:

    ```bash
    # Browse available skills
    npx skills add anthropics/skills --list

    # Install a specific skill to your local skills directory
    npx skills add anthropics/skills \
      --skill frontend-design \
      --dir .promptscript/skills

    # Install from any GitHub repo
    npx skills add vercel-labs/agent-skills \
      --skill ui-design \
      --dir .promptscript/skills
    ```

=== "npx openskills"

    [OpenSkills](https://github.com/numman-ali/openskills) provides a universal skills loader:

    ```bash
    # Install a skill
    npx openskills install frontend-design \
      --dir .promptscript/skills
    ```

=== "Manual download"

    Copy any skill directory that contains a `SKILL.md`:

    ```bash
    # From a git repo
    git clone --depth 1 https://github.com/someone/cool-skill.git /tmp/cool-skill
    cp -r /tmp/cool-skill .promptscript/skills/cool-skill

    # Or just create your own
    mkdir -p .promptscript/skills/my-skill
    cat > .promptscript/skills/my-skill/SKILL.md << 'EOF'
    ---
    name: my-skill
    description: My custom skill
    ---

    Instructions for this skill...
    EOF
    ```

### 3. Reference the skill in your `.prs` file

```promptscript
@skills {
  ui-ux-pro-max: {
    description: "UI/UX design intelligence with searchable databases"
    userInvocable: false
  }

  commit: {
    description: "Create git commits"
    userInvocable: true
  }
}
```

The `content` field is optional — if a matching `SKILL.md` exists in `.promptscript/skills/<name>/`, it's loaded automatically. You only need to declare the skill name and any metadata overrides.

### 4. Compile

```bash
prs compile
```

PromptScript will:

1. Find `SKILL.md` in `.promptscript/skills/<name>/`
2. Discover all resource files alongside it
3. Copy everything to each target's skill directory

```
# Output for a project targeting claude + factory + gemini:
✓ .claude/skills/ui-ux-pro-max/SKILL.md
✓ .claude/skills/ui-ux-pro-max/data/colors.csv
✓ .claude/skills/ui-ux-pro-max/scripts/search.py
✓ .factory/skills/ui-ux-pro-max/SKILL.md
✓ .factory/skills/ui-ux-pro-max/data/colors.csv
✓ .factory/skills/ui-ux-pro-max/scripts/search.py
✓ .gemini/skills/ui-ux-pro-max/skill.md
✓ .gemini/skills/ui-ux-pro-max/data/colors.csv
✓ .gemini/skills/ui-ux-pro-max/scripts/search.py
```

## How Resolution Works

When PromptScript encounters a skill name in `@skills {}`, it looks for `SKILL.md` in this order:

1. **Local skills** — `.promptscript/skills/<name>/SKILL.md`
2. **Universal directory** — `.agents/skills/<name>/SKILL.md` _(enabled by default)_
3. **Registry** — `<registry>/@skills/<name>/SKILL.md`

Local skills take priority over registry skills with the same name, letting you override or customize registry-provided skills per project.

### Universal `.agents/skills/` directory

Tools like [`npx skills add`](https://www.npmjs.com/package/skills) install skills into `.agents/skills/` by default. PromptScript automatically discovers skills and commands from the `.agents/` directory.

The `universalDir` setting in `promptscript.yaml` controls this behavior:

```yaml
# Default (can be omitted) — uses .agents/
universalDir: true

# Custom directory
universalDir: '.my-agents'

# Disable auto-discovery
universalDir: false
```

Skills from `.agents/skills/` are used as a fallback after `.promptscript/skills/` but before the registry. Commands from `.agents/commands/` are merged into `@shortcuts` (explicit declarations take precedence).

## Parameterized Skills

Skills can define parameters in their YAML frontmatter, making them reusable with different configurations. Parameters use `{{variable}}` syntax for interpolation.

### Defining parameters in SKILL.md

```text
---
name: code-review
description: Review {{language}} code with {{strictness}} rules
params:
  language:
    type: string
    default: typescript
  strictness:
    type: enum
    options: [relaxed, standard, strict]
    default: standard
---

You are a {{language}} code reviewer.
Apply {{strictness}} review rules.
```

Supported parameter types: `string`, `number`, `boolean`, `enum`.

### Passing arguments in .prs

```text
@skills {
  code-review: {
    language: "python"
    strictness: "strict"
  }
}
```

When compiled, `{{language}}` becomes `python` and `{{strictness}}` becomes `strict`. Parameters not provided in `.prs` use their default values from the frontmatter.

### Validation

The PS015 validation rule checks parameter definitions:

- Parameter types must be one of: `string`, `number`, `boolean`, `enum`
- `enum` parameters must include an `options` array
- Duplicate parameter names are flagged

## Resource Files

Any text file next to `SKILL.md` is treated as a resource file and copied to all compilation targets. This includes:

- **Data files** — `.csv`, `.json`, `.yaml`, `.txt`
- **Scripts** — `.py`, `.sh`, `.js`
- **Nested directories** — `data/stacks/react.csv` preserves the full path
- **Templates and configs** — any text-based file

Resource files maintain their relative paths. A skill that references `python3 .claude/skills/my-skill/scripts/search.py` will work because `scripts/search.py` is copied into the correct target directory.

**Security limits:**

- Files larger than 1 MB and total resources exceeding 10 MB are skipped
- Maximum 100 resource files per skill
- Symlinks (files and directories) are ignored
- Binary files (containing null bytes) are excluded
- System files (`.env`, `.gitignore`, `node_modules/`, etc.) are automatically skipped
- Path traversal attempts (`../`) are rejected

## Best Practices

### Commit skills to version control

Local skills in `.promptscript/skills/` should be committed to git. They're part of your project's AI configuration, just like `.promptscript/*.prs` files.

### Keep `.prs` declarations minimal

When using local skills, the `.prs` file only needs metadata — the content comes from `SKILL.md`:

```promptscript
# ✅ Good — content loaded from SKILL.md automatically
@skills {
  my-skill: {
    description: "Does something useful"
  }
}

# ❌ Unnecessary — duplicates SKILL.md content
@skills {
  my-skill: {
    description: "Does something useful"
    content: """
      ... 200 lines of instructions ...
    """
  }
}
```

### Use relative paths in skill instructions

Skills should reference their resource files using the target's skill path:

```markdown
<!-- In SKILL.md -->

Run the search tool:
python3 .claude/skills/my-skill/scripts/search.py "query"
```

For cross-target compatibility, consider parameterizing the path or documenting the convention.

## Skill Dependencies

Skills can declare dependencies on other skills using the `requires` field:

```text
@skills {
  lint-check: {
    description: "Run linting"
  }

  full-review: {
    description: "Complete code review"
    requires: ["lint-check"]
  }
}
```

The PS016 validation rule checks that:

- Required skills exist in the same `@skills` block
- No self-referencing requires
- No circular dependencies

## See Also

- [Shared Resources](shared-resources.md) — Share files across all skills
- [Skills & Local Memory](../examples/skills-and-local.md) — Example of `@skills` with inline content
- [Multi-File Organization](multi-file.md) — Organizing `.prs` files with `@use` imports
- [Build Your Registry](registry.md) — Publishing and consuming registry packages
