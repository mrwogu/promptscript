---
title: 'PromptScript - Agent Platform Configuration as Code'
description: 'Define AI instructions, skills, agents, MCP servers, hooks, workflows, and policies once. Compile native configuration for 48 AI coding agent platforms.'
meta:
  - name: keywords
    content: PromptScript, agent platform, configuration as code, AI instructions, AI agents, AI skills, MCP servers, GitHub Copilot, Claude Code, Cursor, Factory AI, Codex, AI governance, PromptOps
  - name: robots
    content: index, follow
  - property: og:title
    content: PromptScript - Define Once, Compile Everywhere
  - property: og:description
    content: One validated source for your complete AI agent platform. Native output for 48 coding agents.
  - property: og:type
    content: website
  - name: twitter:card
    content: summary_large_image
  - name: twitter:title
    content: PromptScript - Define Once, Compile Everywhere
hide:
  - navigation
  - toc
  - edit
  - view
---

<!-- prettier-ignore -->
<div class="home-page">
<section class="home-hero">
<div class="home-hero__copy">
<div class="home-eyebrow">Agent platform configuration as code</div>
<h1>Define your agent platform once.<br><span>Compile it everywhere.</span></h1>
<p class="home-hero__lead">One composable source for instructions, skills, agents, MCP servers, hooks, workflows, and policies. Inherit it across teams and compile native configuration for 48 AI coding platforms.</p>
<div class="home-hero__actions">
<a href="getting-started/" class="home-button home-button--primary">Get started</a>
<a href="#native-output" class="home-button home-button--secondary">See native output</a>
</div>
<div class="home-install" aria-label="Install PromptScript CLI">
<code>npm install -g @promptscript/cli</code>
<span>Open source · Git-native · CI-ready</span>
</div>
</div>
<div class="home-hero__visual" aria-label="PromptScript source compiled to native platform files">
<div class="home-code-window">
<div class="home-window-bar">
<span class="home-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
<span>project.prs</span>
<span class="home-window-status">source</span>
</div>
<pre><code><span class="home-code-keyword">@inherit</span> <span class="home-code-reference">@company/platform</span>
<span class="home-code-keyword">@identity</span> {
&#32;&#32;<span class="home-code-string">"Checkout service"</span>
}
<span class="home-code-keyword">@skills</span> {
&#32;&#32;security-review: {
&#32;&#32;&#32;&#32;description: <span class="home-code-string">"Review code"</span>
&#32;&#32;}
}
<span class="home-code-keyword">@agents</span> {
&#32;&#32;reviewer: {
&#32;&#32;&#32;&#32;skills: [<span class="home-code-string">"security-review"</span>]
&#32;&#32;&#32;&#32;mcpServers: [<span class="home-code-string">"issues"</span>]
&#32;&#32;}
}
<span class="home-code-keyword">@hooks</span> {
&#32;&#32;validate: {
&#32;&#32;&#32;&#32;event: <span class="home-code-string">"post-tool-use"</span>
&#32;&#32;}
}</code></pre>
</div>
<div class="home-compile-arrow" aria-hidden="true"><i></i></div>
<div class="home-output-file home-output-file--claude">
<span>Claude Code</span>
<code>CLAUDE.md</code>
</div>
<div class="home-compile-arrow" aria-hidden="true"><i></i></div>
<div class="home-output-file home-output-file--github">
<span>GitHub Copilot</span>
<code>.github/agents/reviewer.md</code>
</div>
<div class="home-compile-arrow" aria-hidden="true"><i></i></div>
<div class="home-output-file home-output-file--factory">
<span>Factory AI</span>
<code>.factory/skills/security-review/</code>
</div>
<div class="home-compile-arrow" aria-hidden="true"><i></i></div>
<div class="home-output-file home-output-file--cursor">
<span>Cursor</span>
<code>.cursor/rules/project.mdc</code>
</div>
<div class="home-compile-arrow home-compile-arrow--more" aria-hidden="true"><span>+44</span></div>
<div class="home-output-more">+ 44 targets</div>
</div>
</section>
<div class="home-platforms" aria-label="Supported platforms">
<span class="home-platforms__label">Native output for</span>
<span>Claude Code</span>
<span>GitHub Copilot</span>
<span>Cursor</span>
<span>Codex</span>
<span>Factory AI</span>
<span>Gemini CLI</span>
<span>OpenCode</span>
<a href="reference/formatters/">and 41 more</a>
</div>
<section class="home-section home-section--capabilities">
<div class="home-section__intro">
<div class="home-eyebrow">One language, complete platform</div>
<h2>More than instruction files</h2>
<p>Model the complete operating environment for AI coding agents, then let each formatter emit the richest native representation its platform supports.</p>
</div>
<div class="home-capability-grid">
<a href="reference/language/#identity" class="home-capability">
<span class="home-capability__token">@identity</span>
<h3>Instructions and policy</h3>
<p>Project context, standards, restrictions, examples, and path-specific rules.</p>
</a>
<a href="features/skills/" class="home-capability">
<span class="home-capability__token">@skills</span>
<h3>Portable skills</h3>
<p>Reusable capabilities with resources, scripts, dependencies, and typed contracts.</p>
</a>
<a href="features/agents/" class="home-capability">
<span class="home-capability__token">@agents</span>
<h3>Specialized agents</h3>
<p>Roles, models, tool policies, skills, permissions, and MCP access.</p>
</a>
<a href="features/integrations/" class="home-capability">
<span class="home-capability__token">@mcpServers</span>
<h3>Tools and integrations</h3>
<p>MCP servers and reusable plugins defined once at project level.</p>
</a>
<a href="features/automation/" class="home-capability">
<span class="home-capability__token">@hooks</span>
<h3>Automation</h3>
<p>Lifecycle hooks, repeatable workflows, and scoped monorepo builds.</p>
</a>
<a href="guides/policy-engine/" class="home-capability">
<span class="home-capability__token">policies</span>
<h3>Governance</h3>
<p>Inheritance boundaries, protected properties, registry controls, and CI validation.</p>
</a>
</div>
</section>
<section class="home-section home-compose">
<div class="home-section__intro">
<div class="home-eyebrow">Prompts as code</div>
<h2>Inherit, compose, and extend</h2>
<p>Configuration is composable source, not copied text. Inherit a shared base, mix in reusable fragments, and override only what changes - with deterministic, reviewable merges.</p>
</div>
<div class="home-compose__layout">
<div class="home-code-window home-compose__code">
<div class="home-window-bar">
<span class="home-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
<span>project.prs</span>
<span class="home-window-status">source</span>
</div>
<pre><code><span class="home-code-comment"># IS-A: inherit the organization base</span>
<span class="home-code-keyword">@inherit</span> <span class="home-code-reference">@company/platform</span>

<span class="home-code-comment"># HAS-A: compose reusable fragments</span>
<span class="home-code-keyword">@use</span> <span class="home-code-reference">@core/security</span>
<span class="home-code-keyword">@use</span> <span class="home-code-reference">@fragments/testing</span>

<span class="home-code-comment"># override only what changes</span>
<span class="home-code-keyword">@extend</span> standards.code {
&#32;&#32;framework: <span class="home-code-string">"react"</span>
}

<span class="home-code-keyword">@extend</span> restrictions {
&#32;&#32;- <span class="home-code-string">"Use functional components only"</span>
}</code></pre>

</div>
<div class="home-compose__ops">
<a href="guides/inheritance/" class="home-compose__op">
<span class="home-compose__op-token">@inherit</span>
<div>
<h3>Inherit a base</h3>
<p>Single-parent "IS-A" chains from organization to team to project. Blocks merge with predictable rules.</p>
</div>
</a>
<a href="guides/inheritance/#composition-with-use" class="home-compose__op">
<span class="home-compose__op-token">@use</span>
<div>
<h3>Compose fragments</h3>
<p>Mix in multiple "HAS-A" capabilities like security or testing. Later imports win on conflicts.</p>
</div>
</a>
<a href="guides/inheritance/#using-extend" class="home-compose__op">
<span class="home-compose__op-token">@extend</span>
<div>
<h3>Extend and override</h3>
<p>Patch specific paths, append or negate references, and seal properties that layers cannot change.</p>
</div>
</a>
</div>
</div>
</section>
<section class="home-section home-section--steps">
<div class="home-section__intro">
<div class="home-eyebrow">A deterministic toolchain</div>
<h2>From intent to native files</h2>
<p>PromptScript brings compiler guarantees to agent configuration without hiding platform-specific capabilities.</p>
</div>
<div class="home-step-grid">
<div class="home-step">
<span class="home-step__number">01</span>
<h3>Define</h3>
<p>Compose organization, team, and project configuration from versioned <code>.prs</code> sources.</p>
<code class="home-step__command">@inherit @company/platform</code>
</div>
<div class="home-step">
<span class="home-step__number">02</span>
<h3>Validate</h3>
<p>Catch syntax, broken references, policy violations, and unsafe referenced content before deployment.</p>
<code class="home-step__command">prs validate --strict</code>
</div>
<div class="home-step">
<span class="home-step__number">03</span>
<h3>Compile</h3>
<p>Generate deterministic, reviewable files that every selected agent platform understands natively.</p>
<code class="home-step__command">prs compile</code>
</div>
</div>
</section>
<section class="home-section home-native" id="native-output">
<div class="home-native__copy">
<div class="home-eyebrow">Native, not lowest common denominator</div>
<h2>Every platform gets the files it expects</h2>
<p>PromptScript preserves one source model while formatters map supported capabilities to native instructions, agents, skills, commands, hooks, and integrations.</p>
<ul class="home-check-list">
<li>Rich target-specific output where supported</li>
<li>Deterministic diffs ready for code review</li>
<li>No runtime proxy between developers and their tools</li>
<li>New targets without rewriting source configuration</li>
</ul>
<a href="reference/formatters/" class="home-text-link">Explore all 48 target formats <span>→</span></a>
</div>
<div class="home-native__files">
<div class="home-target-card">
<div><strong>Claude Code</strong><span>full native output</span></div>
<code>CLAUDE.md</code>
<code>.claude/agents/reviewer.md</code>
<code>.claude/skills/security-review/SKILL.md</code>
<code>.claude/settings.json</code>
</div>
<div class="home-target-card">
<div><strong>GitHub Copilot</strong><span>full native output</span></div>
<code>.github/copilot-instructions.md</code>
<code>.github/agents/reviewer.md</code>
<code>.github/skills/security-review/SKILL.md</code>
<code>.github/prompts/review.prompt.md</code>
</div>
<div class="home-target-card">
<div><strong>Factory AI</strong><span>full native output</span></div>
<code>AGENTS.md</code>
<code>.factory/droids/reviewer.md</code>
<code>.factory/skills/security-review/SKILL.md</code>
</div>
</div>
</section>
<section class="home-scale">
<div class="home-scale__copy">
<div class="home-eyebrow">Built for one repo or an organization</div>
<h2>Change policy once. Propagate with control.</h2>
<p>Keep shared standards in Git, inherit them through explicit layers, pin remote dependencies, and enforce the result in CI.</p>
<div class="home-scale__links">
<a href="guides/enterprise/">Enterprise setup</a>
<a href="guides/registry/">Git registry</a>
<a href="guides/security/">Security model</a>
</div>
</div>
<div class="home-scale__diagram" aria-label="Organization policies flow to teams, projects, and native platform files">
<div class="home-scale__node home-scale__node--org">
<span>Organization</span>
<code>@company/platform</code>
</div>
<div class="home-scale__connector"><i></i><i></i><i></i></div>
<div class="home-scale__row">
<div class="home-scale__node"><span>Frontend</span><code>@team/web</code></div>
<div class="home-scale__node"><span>Backend</span><code>@team/services</code></div>
<div class="home-scale__node"><span>Data</span><code>@team/data</code></div>
</div>
<div class="home-scale__down">↓</div>
<div class="home-scale__projects">100+ project repositories</div>
<div class="home-scale__outputs">
<span>Policies</span><span>Skills</span><span>Agents</span><span>Native files</span>
</div>
</div>
</section>
<section class="home-section home-section--adopt">
<div class="home-section__intro">
<div class="home-eyebrow">Adopt without a rewrite</div>
<h2>Start from where you are</h2>
<p>Create a new platform definition, import existing agent files, or establish shared configuration for many repositories.</p>
</div>
<div class="home-path-grid">
<a href="getting-started/" class="home-path-card">
<span>New project</span>
<h3>Initialize in minutes</h3>
<code>prs init</code>
<p>Detect the stack, choose targets, and generate a validated starting point.</p>
<strong>Start the tutorial →</strong>
</a>
<a href="guides/import/" class="home-path-card">
<span>Existing setup</span>
<h3>Import what already works</h3>
<code>prs import CLAUDE.md</code>
<p>Convert current Claude, Copilot, Cursor, AGENTS.md, and other instruction files.</p>
<strong>See import options →</strong>
</a>
<a href="guides/enterprise/" class="home-path-card">
<span>Organization</span>
<h3>Build a control plane</h3>
<code>@inherit @company/platform</code>
<p>Layer organization policy, team capabilities, and project context with Git-native governance.</p>
<strong>Plan the rollout →</strong>
</a>
</div>
</section>
<section class="home-proof">
<a class="home-video-card" href="https://www.youtube.com/watch?v=7sHMn-DbZig" target="_blank" rel="noopener noreferrer">
<img src="https://img.youtube.com/vi/7sHMn-DbZig/maxresdefault.jpg" alt="PromptScript introduction video" loading="lazy" width="1280" height="720">
<span class="home-video-card__play" aria-hidden="true">▶</span>
<span class="home-video-card__label">Watch the introduction</span>
</a>
<div class="home-proof__copy">
<div class="home-eyebrow">See it before installing</div>
<h2>Explore PromptScript in your browser</h2>
<p>Edit a real PromptScript source and inspect generated output without changing your local environment.</p>
<div class="home-proof__actions">
<a href="/playground/" class="home-button home-button--primary">Open playground</a>
<a href="examples/" class="home-text-link">Browse examples <span>→</span></a>
</div>
</div>
</section>
<section class="home-final-cta">
<div>
<div class="home-eyebrow">One source of truth</div>
<h2>Give every AI agent the right context.</h2>
<p>Start with one repository today. Scale the same model across teams when you are ready.</p>
</div>
<div class="home-final-cta__actions">
<a href="getting-started/" class="home-button home-button--primary">Get started</a>
<a href="https://github.com/mrwogu/promptscript" class="home-button home-button--secondary">View on GitHub</a>
</div>
</section>
</div>
