# PromptScript vs Manual Prompt Management

## Point-by-point comparison

### Instruction consistency across projects

Manual: every project has its own version of instructions, copied from another project and modified in place. After a few months, versions drift apart and nobody knows which is current.
PromptScript: all projects inherit from a single source of standards. A change in one place propagates everywhere.

### Adaptation to the AI tool

Manual: the same text pasted into Copilot, Claude Code, Factory AI, and Gemini. Each tool has a different prompt structure and a different model behind it, but gets the same generic text.
PromptScript: compiles instructions to each tool's native format, optimized for its structure and model specifics.

### Switching AI tools

Manual: moving from Copilot to Gemini means rewriting prompts in every repository, updating READMEs and documentation. Weeks of work.
PromptScript: change the target in the config and rebuild. Minutes.

### Updating organization standards

Manual: a security policy change means manually updating instructions in dozens of repositories. Dozens of pull requests, months before it reaches everywhere.
PromptScript: one change in the registry, automatic propagation to all projects on the next compile.

### Synchronization with framework versions

Manual: a project migrates from Jest to Vitest, but the AI instructions still reference Jest. Nobody remembered to update the prompts.
PromptScript: instructions are code, they live in the same repository and change together with the project.

### Validation

Manual: no validation. Errors in prompts discovered only when the AI generates code that doesn't match expectations.
PromptScript: validation at compile time and in CI/CD pipelines. Invalid instructions won't pass a merge.

### Onboarding a new project

Manual: someone copies instructions from another project, modifies them by eye, forgets half the team standards.
PromptScript: prs init, inherit from team standards, add local context. Guaranteed that the project starts with all organization standards.

## Analogy

PromptScript is to AI instructions what Terraform is to cloud infrastructure. Terraform separates infrastructure declaration from the provider. PromptScript separates instruction content from the tool format.

Just as Terraform doesn't require rewriting configs when switching from AWS to GCP, PromptScript doesn't require rewriting prompts when switching from GitHub Copilot to Gemini. You declare WHAT you want, the tool handles HOW.
