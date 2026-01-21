import type { Block, ClaudeVersion, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter';
import type { ConventionRenderer } from '../convention-renderer';
import type { FormatOptions, FormatterOutput } from '../types';

/**
 * Claude formatter version information.
 */
export const CLAUDE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single file output (CLAUDE.md)',
    outputPath: 'CLAUDE.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Main + modular rules (.claude/rules/*.md)',
    outputPath: 'CLAUDE.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + skills (.claude/skills/) + agents (.claude/agents/) + local memory',
    outputPath: 'CLAUDE.md',
  },
} as const;

/**
 * Configuration for a rule file.
 */
interface RuleConfig {
  /** Rule file name (without extension) */
  name: string;
  /** Glob patterns this rule applies to */
  paths: string[];
  /** Description for the rule */
  description: string;
  /** Rule content */
  content: string;
}

/**
 * Configuration for a Claude skill.
 */
interface ClaudeSkillConfig {
  /** Skill name */
  name: string;
  /** Description */
  description: string;
  /** Context forking mode */
  context?: 'fork' | 'inherit';
  /** Agent type */
  agent?: string;
  /** Allowed tools */
  allowedTools?: string[];
  /** Whether user can invoke this skill */
  userInvocable?: boolean;
  /** Skill content/instructions */
  content: string;
}

/**
 * Valid model values for Claude agents.
 */
type ClaudeAgentModel = 'sonnet' | 'opus' | 'haiku' | 'inherit';

/**
 * Valid permission modes for Claude agents.
 */
type ClaudeAgentPermissionMode =
  | 'default'
  | 'acceptEdits'
  | 'dontAsk'
  | 'bypassPermissions'
  | 'plan';

/**
 * Configuration for a Claude subagent.
 *
 * @see https://code.claude.com/docs/en/sub-agents
 */
interface ClaudeAgentConfig {
  /** Agent name (lowercase, hyphens) - required */
  name: string;
  /** When Claude should delegate to this subagent - required */
  description: string;
  /** Tools the subagent can use (inherits all if omitted) */
  tools?: string[];
  /** Tools to deny (removed from inherited or specified list) */
  disallowedTools?: string[];
  /** Model to use: sonnet, opus, haiku, or inherit (defaults to sonnet) */
  model?: ClaudeAgentModel;
  /** Permission mode for the subagent */
  permissionMode?: ClaudeAgentPermissionMode;
  /** Skills to preload into the subagent's context at startup */
  skills?: string[];
  /** System prompt content */
  content: string;
}

/**
 * Formatter for Claude Code instructions.
 *
 * Supports three versions:
 * - **simple** (default): Single `CLAUDE.md` file
 * - **multifile**: Main + `.claude/rules/*.md` with path-specific rules
 * - **full**: Multifile + `.claude/skills/<name>/SKILL.md` + `CLAUDE.local.md`
 *
 * @example
 * ```yaml
 * targets:
 *   - claude  # uses simple mode
 *   - claude:
 *       version: multifile
 *   - claude:
 *       version: full
 * ```
 *
 * @see https://claude.com/docs/code/memory
 */
export class ClaudeFormatter extends BaseFormatter {
  readonly name = 'claude';
  readonly outputPath = 'CLAUDE.md';
  readonly description = 'Claude Code instructions (concise Markdown)';
  readonly defaultConvention = 'markdown';

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof CLAUDE_VERSIONS {
    return CLAUDE_VERSIONS;
  }

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const version = this.resolveVersion(options?.version);

    if (version === 'full') {
      return this.formatFull(ast, options);
    }

    if (version === 'multifile') {
      return this.formatMultifile(ast, options);
    }

    return this.formatSimple(ast, options);
  }

  /**
   * Resolve version string to ClaudeVersion.
   */
  private resolveVersion(version?: string): ClaudeVersion {
    if (version === 'multifile') return 'multifile';
    if (version === 'full') return 'full';
    return 'simple';
  }

  // ============================================================
  // Simple Mode (single file)
  // ============================================================

  private formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const sections: string[] = [];

    if (renderer.getConvention().name === 'markdown') {
      sections.push('# CLAUDE.md\n');
    }

    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
    };
  }

  // ============================================================
  // Multifile Mode
  // ============================================================

  private formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    // Generate rule files based on @guards
    const rules = this.extractRules(ast);
    for (const rule of rules) {
      additionalFiles.push(this.generateRuleFile(rule));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push('# CLAUDE.md\n');
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Full Mode
  // ============================================================

  private formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    // Generate rule files based on @guards
    const rules = this.extractRules(ast);
    for (const rule of rules) {
      additionalFiles.push(this.generateRuleFile(rule));
    }

    // Generate skill files
    const skills = this.extractSkills(ast);
    for (const skill of skills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Generate agent files
    const agents = this.extractAgents(ast);
    for (const agent of agents) {
      additionalFiles.push(this.generateAgentFile(agent));
    }

    // Generate CLAUDE.local.md
    const localFile = this.generateLocalFile(ast);
    if (localFile) {
      additionalFiles.push(localFile);
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push('# CLAUDE.md\n');
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Rule File Generation
  // ============================================================

  /**
   * Extract rule configurations from @guards block.
   */
  private extractRules(ast: Program): RuleConfig[] {
    const guards = this.findBlock(ast, 'guards');
    if (!guards) return [];

    const rules: RuleConfig[] = [];
    const props = this.getProps(guards.content);

    // Handle globs property (array of patterns)
    const globPatterns = props['globs'];
    if (Array.isArray(globPatterns)) {
      // Group patterns by category
      const tsPatterns = globPatterns.filter(
        (p) => typeof p === 'string' && (p.includes('.ts') || p.includes('.tsx'))
      );
      const testPatterns = globPatterns.filter(
        (p) =>
          typeof p === 'string' &&
          (p.includes('test') || p.includes('spec') || p.includes('__tests__'))
      );

      if (tsPatterns.length > 0) {
        rules.push({
          name: 'code-style',
          paths: tsPatterns as string[],
          description: 'TypeScript code style rules',
          content: this.getCodeStyleRuleContent(ast),
        });
      }

      if (testPatterns.length > 0) {
        rules.push({
          name: 'testing',
          paths: testPatterns as string[],
          description: 'Testing rules and patterns',
          content: this.getTestingRuleContent(ast),
        });
      }
    }

    // Handle named rule blocks within guards
    for (const [key, value] of Object.entries(props)) {
      if (key === 'globs') continue;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const paths = obj['paths'] ?? obj['applyTo'];
        const description = obj['description'];
        const content = obj['content'];

        if (paths && Array.isArray(paths)) {
          rules.push({
            name: key,
            paths: paths.map((p) => this.valueToString(p)),
            description: description ? this.valueToString(description) : `${key} rules`,
            content: content ? this.valueToString(content) : '',
          });
        }
      }
    }

    return rules;
  }

  /**
   * Generate a .claude/rules/*.md file.
   */
  private generateRuleFile(config: RuleConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter with paths
    lines.push('---');
    lines.push(`description: "${config.description}"`);
    lines.push(`paths:`);
    for (const pattern of config.paths) {
      lines.push(`  - "${pattern}"`);
    }
    lines.push('---');
    lines.push('');
    lines.push(`# ${config.description}`);
    lines.push('');
    if (config.content) {
      lines.push(config.content);
    }

    return {
      path: `.claude/rules/${config.name}.md`,
      content: lines.join('\n'),
    };
  }

  /**
   * Get code style rule content from AST.
   */
  private getCodeStyleRuleContent(ast: Program): string {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return '';

    const props = this.getProps(standards.content);
    const items: string[] = [];

    // TypeScript standards
    const ts = props['typescript'];
    if (ts && typeof ts === 'object' && !Array.isArray(ts)) {
      const tsObj = ts as Record<string, Value>;
      if (tsObj['strictMode']) items.push('- Strict TypeScript, no `any` types');
      if (tsObj['exports']) items.push('- Named exports only');
    }

    // Naming standards
    const naming = props['naming'];
    if (naming && typeof naming === 'object' && !Array.isArray(naming)) {
      const n = naming as Record<string, Value>;
      if (n['files']) items.push(`- Files: ${this.valueToString(n['files'])}`);
    }

    return items.join('\n');
  }

  /**
   * Get testing rule content from AST.
   */
  private getTestingRuleContent(ast: Program): string {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return '';

    const props = this.getProps(standards.content);
    const items: string[] = [];

    const testing = props['testing'];
    if (testing && typeof testing === 'object' && !Array.isArray(testing)) {
      const t = testing as Record<string, Value>;
      if (t['framework']) items.push(`- Use ${this.valueToString(t['framework'])} for testing`);
      if (t['coverage']) items.push(`- Target >${this.valueToString(t['coverage'])}% coverage`);
      if (t['pattern']) items.push(`- Follow ${this.valueToString(t['pattern'])} pattern`);
    }

    return items.length > 0 ? items.join('\n') : 'Follow project testing conventions.';
  }

  // ============================================================
  // Skill File Generation
  // ============================================================

  /**
   * Extract skill configurations from @skills block.
   */
  private extractSkills(ast: Program): ClaudeSkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: ClaudeSkillConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
          context:
            obj['context'] === 'fork' || obj['context'] === 'inherit' ? obj['context'] : undefined,
          agent: obj['agent'] ? this.valueToString(obj['agent']) : undefined,
          allowedTools:
            obj['allowedTools'] && Array.isArray(obj['allowedTools'])
              ? obj['allowedTools'].map((t) => this.valueToString(t))
              : undefined,
          userInvocable: obj['userInvocable'] === true,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
        });
      }
    }

    return skills;
  }

  /**
   * Generate a .claude/skills/<name>/SKILL.md file.
   */
  private generateSkillFile(config: ClaudeSkillConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: "${config.name}"`);
    lines.push(`description: "${config.description}"`);
    if (config.context) {
      lines.push(`context: ${config.context}`);
    }
    if (config.agent) {
      lines.push(`agent: ${config.agent}`);
    }
    if (config.allowedTools && config.allowedTools.length > 0) {
      lines.push('allowed-tools:');
      for (const tool of config.allowedTools) {
        lines.push(`  - ${tool}`);
      }
    }
    if (config.userInvocable) {
      lines.push('user-invocable: true');
    }
    lines.push('---');
    lines.push('');
    if (config.content) {
      lines.push(config.content);
    }

    return {
      path: `.claude/skills/${config.name}/SKILL.md`,
      content: lines.join('\n'),
    };
  }

  // ============================================================
  // Agent File Generation
  // ============================================================

  /**
   * Extract agent configurations from @agents block.
   */
  private extractAgents(ast: Program): ClaudeAgentConfig[] {
    const agentsBlock = this.findBlock(ast, 'agents');
    if (!agentsBlock) return [];

    const agents: ClaudeAgentConfig[] = [];
    const props = this.getProps(agentsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const agent = this.parseAgentConfig(name, obj);
        if (agent) {
          agents.push(agent);
        }
      }
    }

    return agents;
  }

  /**
   * Parse a single agent configuration from object properties.
   */
  private parseAgentConfig(name: string, obj: Record<string, Value>): ClaudeAgentConfig | null {
    const description = obj['description'] ? this.valueToString(obj['description']) : '';
    if (!description) return null; // description is required

    return {
      name,
      description,
      tools: this.parseStringArray(obj['tools']),
      disallowedTools: this.parseStringArray(obj['disallowedTools']),
      model: this.parseAgentModel(obj['model']),
      permissionMode: this.parsePermissionMode(obj['permissionMode']),
      skills: this.parseStringArray(obj['skills']),
      content: obj['content'] ? this.valueToString(obj['content']) : '',
    };
  }

  /**
   * Parse an array of strings from a Value.
   */
  private parseStringArray(value: Value | undefined): string[] | undefined {
    if (!value || !Array.isArray(value)) return undefined;
    const arr = value.map((v) => this.valueToString(v)).filter((s) => s.length > 0);
    return arr.length > 0 ? arr : undefined;
  }

  /**
   * Parse model value, validating it's a known model.
   */
  private parseAgentModel(value: Value | undefined): ClaudeAgentModel | undefined {
    if (!value) return undefined;
    const str = this.valueToString(value);
    const validModels: ClaudeAgentModel[] = ['sonnet', 'opus', 'haiku', 'inherit'];
    return validModels.includes(str as ClaudeAgentModel) ? (str as ClaudeAgentModel) : undefined;
  }

  /**
   * Parse permission mode value.
   */
  private parsePermissionMode(value: Value | undefined): ClaudeAgentPermissionMode | undefined {
    if (!value) return undefined;
    const str = this.valueToString(value);
    const validModes: ClaudeAgentPermissionMode[] = [
      'default',
      'acceptEdits',
      'dontAsk',
      'bypassPermissions',
      'plan',
    ];
    return validModes.includes(str as ClaudeAgentPermissionMode)
      ? (str as ClaudeAgentPermissionMode)
      : undefined;
  }

  /**
   * Generate a .claude/agents/<name>.md file.
   *
   * @see https://code.claude.com/docs/en/sub-agents
   */
  private generateAgentFile(config: ClaudeAgentConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${config.name}`);
    lines.push(`description: ${config.description}`);

    if (config.tools && config.tools.length > 0) {
      lines.push(`tools: ${config.tools.join(', ')}`);
    }

    if (config.disallowedTools && config.disallowedTools.length > 0) {
      lines.push(`disallowedTools: ${config.disallowedTools.join(', ')}`);
    }

    if (config.model) {
      lines.push(`model: ${config.model}`);
    }

    if (config.permissionMode) {
      lines.push(`permissionMode: ${config.permissionMode}`);
    }

    if (config.skills && config.skills.length > 0) {
      lines.push('skills:');
      for (const skill of config.skills) {
        lines.push(`  - ${skill}`);
      }
    }

    lines.push('---');
    lines.push('');

    if (config.content) {
      lines.push(config.content);
    }

    return {
      path: `.claude/agents/${config.name}.md`,
      content: lines.join('\n'),
    };
  }

  // ============================================================
  // Local Memory File Generation
  // ============================================================

  /**
   * Generate CLAUDE.local.md from @local block.
   */
  private generateLocalFile(ast: Program): FormatterOutput | null {
    const localBlock = this.findBlock(ast, 'local');
    if (!localBlock) return null;

    const content = this.extractText(localBlock.content);
    if (!content) return null;

    const lines: string[] = [];
    lines.push('# CLAUDE.local.md');
    lines.push('');
    lines.push('> Private instructions (not committed to git)');
    lines.push('');
    lines.push(content);

    return {
      path: 'CLAUDE.local.md',
      content: lines.join('\n'),
    };
  }

  // ============================================================
  // Common Section Methods
  // ============================================================

  private addCommonSections(ast: Program, renderer: ConventionRenderer, sections: string[]): void {
    this.addSection(sections, this.project(ast, renderer));
    this.addSection(sections, this.techStack(ast, renderer));
    this.addSection(sections, this.architecture(ast, renderer));
    this.addSection(sections, this.codeStandards(ast, renderer));
    this.addSection(sections, this.gitCommits(ast, renderer));
    this.addSection(sections, this.configFiles(ast, renderer));
    this.addSection(sections, this.commands(ast, renderer));
    this.addSection(sections, this.postWork(ast, renderer));
    this.addSection(sections, this.documentation(ast, renderer));
    this.addSection(sections, this.diagrams(ast, renderer));
    this.addSection(sections, this.donts(ast, renderer));
  }

  private addSection(sections: string[], content: string | null): void {
    if (content) sections.push(content);
  }

  private project(ast: Program, renderer: ConventionRenderer): string | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const text = this.extractText(identity.content);
    const cleanText = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .join('\n');

    return renderer.renderSection('Project', cleanText) + '\n';
  }

  private techStack(ast: Program, renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (context) {
      const items = this.extractTechStackFromContext(context);
      if (items.length > 0) {
        return renderer.renderSection('Tech Stack', items.join(', ')) + '\n';
      }
    }

    const standards = this.findBlock(ast, 'standards');
    if (standards) {
      const items = this.extractTechStackFromStandards(standards);
      if (items.length > 0) {
        return renderer.renderSection('Tech Stack', items.join(', ')) + '\n';
      }
    }

    return null;
  }

  private extractTechStackFromContext(context: ReturnType<typeof this.findBlock>): string[] {
    if (!context) return [];
    const props = this.getProps(context.content);
    const items: string[] = [];

    const languages = props['languages'];
    if (languages) {
      items.push(...(Array.isArray(languages) ? languages : [languages]).map(String));
    }

    const runtime = props['runtime'];
    if (runtime) items.push(this.valueToString(runtime));

    const monorepo = props['monorepo'];
    if (monorepo && typeof monorepo === 'object' && !Array.isArray(monorepo)) {
      const mr = monorepo as Record<string, Value>;
      if (mr['tool'] && mr['packageManager']) {
        items.push(
          `${this.valueToString(mr['tool'])} + ${this.valueToString(mr['packageManager'])}`
        );
      }
    }

    return items;
  }

  private extractTechStackFromStandards(standards: ReturnType<typeof this.findBlock>): string[] {
    if (!standards) return [];
    const code = this.getProp(standards.content, 'code');
    if (!code || typeof code !== 'object' || Array.isArray(code)) return [];

    const codeObj = code as Record<string, Value>;
    const items: string[] = [];

    for (const key of ['languages', 'frameworks', 'testing']) {
      const val = codeObj[key];
      if (val) items.push(...(Array.isArray(val) ? val : [val]).map(String));
    }

    return items;
  }

  private architecture(ast: Program, renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    const text = this.extractText(context.content);
    const archMatch = this.extractSectionWithCodeBlock(text, '## Architecture');
    if (!archMatch) return null;

    const content = archMatch.replace('## Architecture', '').trim();
    return renderer.renderSection('Architecture', content) + '\n';
  }

  private codeStandards(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const items: string[] = [];

    // Legacy format
    const code = props['code'];
    if (code && typeof code === 'object' && !Array.isArray(code)) {
      const codeObj = code as Record<string, Value>;
      this.addStyleItems(items, codeObj['style']);
      this.addStyleItems(items, codeObj['patterns']);
    }

    // New format - TypeScript
    if (items.length === 0) {
      this.extractTypeScriptStandards(props, items);
      this.extractNamingStandards(props, items);
      this.extractTestingStandards(props, items);
    }

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Code Style', content) + '\n';
  }

  private extractTypeScriptStandards(props: Record<string, Value>, items: string[]): void {
    const ts = props['typescript'];
    if (!ts || typeof ts !== 'object' || Array.isArray(ts)) return;

    const tsObj = ts as Record<string, Value>;
    if (tsObj['strictMode']) items.push('Strict TypeScript, no `any`');
    if (tsObj['exports']) items.push('Named exports only');
  }

  private extractNamingStandards(props: Record<string, Value>, items: string[]): void {
    const naming = props['naming'];
    if (!naming || typeof naming !== 'object' || Array.isArray(naming)) return;

    const n = naming as Record<string, Value>;
    if (n['files']) items.push(`Files: ${this.valueToString(n['files'])}`);
  }

  private extractTestingStandards(props: Record<string, Value>, items: string[]): void {
    const testing = props['testing'];
    if (!testing || typeof testing !== 'object' || Array.isArray(testing)) return;

    const t = testing as Record<string, Value>;
    const parts: string[] = [];
    if (t['framework']) parts.push(this.valueToString(t['framework']));
    if (t['coverage']) parts.push(`>${this.valueToString(t['coverage'])}% coverage`);
    if (parts.length > 0) items.push(`Testing: ${parts.join(', ')}`);
  }

  private gitCommits(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const git = this.getProp(standards.content, 'git');
    if (!git || typeof git !== 'object' || Array.isArray(git)) return null;

    const g = git as Record<string, Value>;
    const items: string[] = [];

    if (g['format']) items.push(`Format: ${this.valueToString(g['format'])}`);
    if (g['types'] && Array.isArray(g['types'])) {
      items.push(`Types: ${g['types'].map(String).join(', ')}`);
    }
    if (g['example']) items.push(`Example: \`${this.valueToString(g['example'])}\``);

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Git Commits', content) + '\n';
  }

  private configFiles(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const config = this.getProp(standards.content, 'config');
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;

    const c = config as Record<string, Value>;
    const items: string[] = [];

    if (c['eslint']) items.push(`ESLint: ${this.valueToString(c['eslint'])}`);
    if (c['viteRoot']) items.push(`Vite root: ${this.valueToString(c['viteRoot'])}`);

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Config Files', content) + '\n';
  }

  private commands(ast: Program, renderer: ConventionRenderer): string | null {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    const knowledge = this.findBlock(ast, 'knowledge');

    const commandLines: string[] = [];

    if (shortcuts) {
      const props = this.getProps(shortcuts.content);
      for (const [cmd, desc] of Object.entries(props)) {
        const shortDesc = this.valueToString(desc).split('\n')[0]?.substring(0, 40) ?? '';
        commandLines.push(`${cmd.padEnd(10)} - ${shortDesc}`);
      }
    }

    if (commandLines.length === 0) return null;

    let content = renderer.renderCodeBlock(commandLines.join('\n'));

    if (knowledge) {
      const text = this.extractText(knowledge.content);
      const match = this.extractSectionWithCodeBlock(text, '## Development Commands');
      if (match) {
        const devCmds = match.replace('## Development Commands', '').trim();
        content += '\n\n' + devCmds;
      }
    }

    return renderer.renderSection('Commands', content) + '\n';
  }

  private postWork(ast: Program, renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const match = this.extractSectionWithCodeBlock(text, '## Post-Work Verification');
    if (!match) return null;

    const content = match.replace('## Post-Work Verification', '').trim();
    return renderer.renderSection('Post-Work Verification', content) + '\n';
  }

  private documentation(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const docs = this.getProp(standards.content, 'documentation');
    if (!docs || typeof docs !== 'object' || Array.isArray(docs)) return null;

    const d = docs as Record<string, Value>;
    const items: string[] = [];

    if (d['verifyBefore']) items.push('Review docs before changes');
    if (d['verifyAfter']) items.push('Update docs after changes');
    if (d['codeExamples']) items.push('Keep code examples accurate');

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Documentation', content) + '\n';
  }

  private diagrams(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const diag = this.getProp(standards.content, 'diagrams');
    if (!diag || typeof diag !== 'object' || Array.isArray(diag)) return null;

    const d = diag as Record<string, Value>;
    const items: string[] = [];

    if (d['format']) items.push(`Use ${this.valueToString(d['format'])} for diagrams`);
    if (d['types'] && Array.isArray(d['types'])) {
      items.push(`Types: ${d['types'].map(String).join(', ')}`);
    }

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Diagrams', content) + '\n';
  }

  private donts(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractDontsItems(block.content);
    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection("Don'ts", content) + '\n';
  }

  private extractDontsItems(content: Block['content']): string[] {
    const transform = (s: string): string => s.replace(/^Never\s+/i, "Don't ");

    if (content.type === 'ArrayContent') {
      return content.elements.map((item: Value) => transform(this.valueToString(item)));
    }

    if (content.type === 'TextContent') {
      return content.value
        .trim()
        .split('\n')
        .map((line: string) => line.trim().replace(/^-\s*/, ''))
        .filter((line: string) => line.length > 0)
        .map(transform);
    }

    if (content.type === 'ObjectContent') {
      const itemsArray = this.getProp(content, 'items');
      if (Array.isArray(itemsArray)) {
        return itemsArray.map((item: unknown) => transform(this.valueToString(item as Value)));
      }
    }

    return [];
  }

  private addStyleItems(items: string[], value: Value | undefined): void {
    if (!value) return;
    const arr = Array.isArray(value) ? value : [value];
    for (const item of arr) items.push(this.valueToString(item));
  }
}
