# PromptScript: One Source of Instructions, Every AI Tool

## What is PromptScript

PromptScript is a language and toolchain for standardizing AI instructions across organizations. It works like Terraform, but instead of infrastructure it manages prompts and instructions for AI coding tools.

The principle is simple: you write instructions once in .prs format, describing WHAT you want to tell the AI tool. PromptScript compiles this into native prompts tailored to the specifics of each tool, whether GitHub Copilot, Claude Code, Factory AI, or Gemini. Each tool gets instructions in its own format, in its own structure, optimized for its model.

## How it works

Instead of copying the same instructions from project to project and manually adapting them for each tool, you create one source file:

```
@meta { id: "checkout-service" syntax: "1.0.0" }

@inherit @company/backend-security

@identity {
  """
  You are an expert Backend Engineer working on the Checkout Service.
  This service handles payments using hexagonal architecture.
  """
}

@standards {
  code: {
    languages: ["TypeScript"]
    testing: ["Vitest", ">90% coverage"]
  }
}

@shortcuts {
  "/review": "Security-focused code review"
  "/test": "Write unit tests with Vitest"
}
```

The prs compile command generates native prompts for each configured tool. Claude Code gets a CLAUDE.md in the structure it expects. GitHub Copilot gets copilot-instructions.md in its format. Factory AI gets AGENTS.md with droid definitions. Gemini gets GEMINI.md. Each tool receives instructions optimized for it, not generic text pasted everywhere the same way.

## Key scenarios

### Consistency across the organization

A company has thirty repositories. Instead of copying instructions between them, each project inherits from shared organization and team standards, adding only its local context. A standard change in one place propagates to all projects.

### Switching tools

A company moves from GitHub Copilot to Gemini. Instead of rewriting prompts in every repository, you change the target in the config and rebuild. PromptScript generates prompts in the structure Gemini expects. Minutes instead of weeks.

### Instructions synchronized with code

A project migrates from Jest to Vitest. You update this in the .prs file, compilation generates new instructions, and the AI immediately knows about the new framework. Instructions live alongside the code, because they are code.

## Core value

PromptScript separates instruction content from the target format and tool specifics. You write WHAT the AI should know about your project. PromptScript handles HOW to communicate that optimally for GitHub Copilot, Claude Code, Factory AI, Gemini, and 33 other tools. Each tool and the model behind it receives instructions in the form it understands best.
