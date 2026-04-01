# PromptScript at Enterprise Scale

## Organizational Architecture

PromptScript was designed for organizations where dozens of projects use AI tools like GitHub Copilot, Claude Code, Factory AI, and Gemini. Without central management, instructions across these projects quickly drift apart. The three-level architecture solves this problem.

### Level 1: Organization

A central registry defines global standards: security policies, compliance requirements, general coding conventions. Maintained by the platform or security team. Every team and project in the organization automatically inherits these standards, regardless of whether they use Copilot, Claude Code, Factory AI, or Gemini.

### Level 2: Teams

Teams (frontend, backend, mobile, data) inherit from the organization level and add domain-specific standards. The backend team might require specific architectural patterns and frameworks. The frontend team might enforce component standards and testing tools. Technical leads manage this level.

### Level 3: Projects

Individual repositories inherit from the team level and refine instructions: specific service architecture, framework and library versions, local commands. This eliminates the situation where every project has mindlessly copied instructions from another project.

## Governance and Compliance

Centrally managed standards are the key enterprise value. The security team updates security policy in one place in the central registry. The change automatically propagates to AI instructions in every repository and every tool, without intervention from project teams. No risk that one project operates with an old version of the standards.

Every change to instructions is versioned in Git. You can trace who changed what standard, when, and why. This matters for organizations subject to audits and regulations.

CI/CD pipelines can validate that AI instructions in every repository comply with current organizational standards. A merge with invalid or outdated instructions won't go through.

Lockfiles guarantee reproducible builds. Central standard updates may require a conscious lockfile update by the project team, giving control over the pace of change adoption.

## Private Registries

Organizations can host registries on private Git repositories. Company instructions and prompts never leave the organization's infrastructure. Registries support namespaces, versioning, and access control through standard Git mechanisms. Vendor mode enables building in air-gapped environments without network access.

## Typical deployment scenario

1. The platform team creates a central registry with global security and coding standards.
2. Team technical leads define team standards inheriting from the central registry, tailored to the frameworks and tools the team uses.
3. Projects configure promptscript.yaml, point to the team registry, and add local context: architecture, framework versions, specific commands.
4. CI/CD pipelines validate instruction compliance on every pull request.
5. Central standard updates are propagated in a controlled manner, with versioning and lockfiles.

The result: dozens or hundreds of repositories with guaranteed AI instruction consistency. Each tool, whether GitHub Copilot, Claude Code, Factory AI, or Gemini, gets prompts in its native format, optimized for its model, while remaining content-consistent with the rest of the organization.
