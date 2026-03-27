# PromptScript — Twitter/X Posts

## 1. Introduction

Your AI coding instructions are just loose markdown files.

No inheritance. No validation. No versioning.

I built PromptScript — a language that treats prompts like code.

Inheritance, parameters, skills, registries, lockfiles. Like Terraform, but for AI instructions.

https://github.com/mrwogu/promptscript

---

## 2. The Problem

Every team using AI coding tools has the same problem:

Someone updates the security rules in CLAUDE.md.
Nobody updates .cursorrules.
Copilot instructions haven't been touched in months.

Prompt drift is real. And it gets worse with every repo you add.

---

## 3. Inheritance

What if your AI instructions worked like code?

```
@inherit @company/security
@inherit @team/backend-standards
```

Organization → team → project. Rules cascade down. Override what you need. Like CSS, but for prompts.

That's PromptScript.

---

## 4. Parameterized Templates

Tired of copy-pasting the same prompt with tiny changes per repo?

```
@inherit @stacks/typescript-service(
  projectName: "checkout",
  port: 8080,
  db: "postgres"
)
```

One template. Infinite variations. Type-checked at compile time.

---

## 5. Skills

PromptScript lets you define, import, and version AI skills:

```
@skills {
  deploy: {
    description: "Deploy to production"
    userInvocable: true
    allowedTools: ["Bash", "Read"]
  }
}
```

Import from GitHub:
`@use github.com/your-org/skills/security-scan.md`

One line. Version-pinned. Lock-filed.

---

## 6. Registry

Build a prompt library for your entire company.

```yaml
registries:
  '@company': github.com/acme/promptscript-base
```

Then in any repo:

```
@inherit @company/global-security
@use @company/testing-standards
```

Private repos, SSH auth, lockfile, vendor mode for air-gapped CI. Enterprise-ready.

---

## 7. Validation

"Works on my machine" but for prompts.

PromptScript validates your AI instructions at compile time:

- Circular dependency detection
- Missing required sections
- Invalid path references
- Type mismatches in parameters

`prs validate --strict` in CI. Catch broken prompts before they ship.

---

## 8. Hot Take

Hot take: AI instructions will become as critical as infrastructure config.

And right now most teams manage them like it's 2005 — manual edits, no versioning, no review process.

We need IaC for prompts. That's why I built PromptScript.

---

## 9. Migration

Already have CLAUDE.md and .cursorrules?

```bash
prs import CLAUDE.md
```

Auto-converts your existing instructions to PromptScript. Detects sections, maps blocks, preserves everything.

No rewrite needed. Start managing what you already have.

---

## 10. Playground

You can try PromptScript without installing anything.

Monaco editor. Live preview. 10 built-in examples. Share via URL.

https://getpromptscript.dev/playground/

---

## 11. Watch Mode

```bash
prs compile --watch
```

Edit your .prs file → all AI tool configs regenerate instantly.

One source of truth. Always in sync. Zero manual work.

---

## 12. Init

```bash
npm i -g @promptscript/cli
prs init
```

Auto-detects your tech stack. Generates a starter .prs file. Two commands.

---

## 13. Composition

PromptScript isn't just inheritance. It's composition.

```
@inherit @company/security
@use @fragments/testing
@use @fragments/typescript-strict
@use ./local-skills/code-review.md
```

Mix remote registries, local files, and GitHub imports in a single file.

---

## 14. Enterprise

Scaling AI instructions across 50 teams and 200 repos?

PromptScript gives you:

- Central registry (Git-based, private repos)
- Version pinning (`@company/security@2.1.0`)
- Lockfile for reproducible builds
- Vendor mode for offline CI
- Validation in every pipeline

This is how enterprises should manage AI context.

---

## 15. 37 Agents

PromptScript compiles to 37 AI coding agents.

Copilot. Claude Code. Cursor. Windsurf. Codex. Gemini CLI. And 31 more.

But that's just a side effect.

The real value? Your AI instructions are finally code — with inheritance, types, validation, and a package manager.

---

## 16. Open Source

PromptScript is open-source. MIT license. Written in TypeScript.

If you care about:

- Prompt standardization
- AI governance
- Developer experience

Check it out, star it, try it, break it.

https://github.com/mrwogu/promptscript

---

## 17. Video

Built a tool that treats AI instructions like infrastructure code.

Inheritance. Parameters. Skills. Registries. Compiles to 37 AI agents.

2-minute walkthrough:
https://youtu.be/7sHMn-DbZig

---

## 18. Why Not Just Markdown

"Why not just use markdown files?"

Because:

- No inheritance (copy-paste across repos)
- No parameters (duplicate files for variations)
- No validation (broken refs, missing sections)
- No versioning (which version of the rules?)
- No sync (update one, forget the rest)

Markdown is the output. PromptScript is the source.

---

## 19. Skill Import

Import entire skill directories from GitHub:

```
@use github.com/your-org/skills/gitnexus
```

PromptScript auto-discovers all skills in the repo — even if it has no .prs files.

SKILL.md, agents, commands — all resolved and compiled to native formats.

---

## 20. Before/After

Before PromptScript:

- 5 repos x 3 AI tools = 15 config files
- Security update = 15 manual edits
- New tool adopted = 5 new files from scratch

After:

- 5 .prs files inheriting from 1 base
- Security update = 1 edit, recompile
- New tool = add target, recompile

That's it. That's the pitch.
