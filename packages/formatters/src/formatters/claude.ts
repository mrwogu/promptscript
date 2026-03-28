import type { Block, ClaudeVersion, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { ConventionRenderer } from '../convention-renderer.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

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
    description: 'Main + modular rules (.claude/rules/*.md) + commands (.claude/commands/*.md)',
    outputPath: 'CLAUDE.md',
  },
  full: {
    name: 'full',
    description:
      'Multifile + skills (.claude/skills/) + agents (.claude/agents/) + commands (.claude/commands/) + local memory',
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
  /** Resolved guard dependencies (injected by resolver) */
  __resolvedRequires?: Array<{ name: string; content: string }>;
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
  /** Prevent Claude from auto-invoking this skill; keeps it user-only */
  disableModelInvocation?: boolean;
  /** Hint shown in autocomplete UI when invoking with arguments */
  argumentHint?: string;
  /** Model to use for this skill (e.g. sonnet, opus, haiku, or full model ID) */
  model?: string;
  /** Skill content/instructions */
  content: string;
  /** Resource files to copy alongside SKILL.md */
  resources?: Array<{ relativePath: string; content: string }>;
  /** Raw frontmatter from source SKILL.md for pass-through */
  rawFrontmatter?: string;
}

/**
 * Configuration for a Claude command file.
 */
interface ClaudeCommandConfig {
  /** Command name (without leading slash) */
  name: string;
  /** Description */
  description: string;
  /** Command content/instructions */
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
  /** Maximum number of agentic turns before stopping */
  maxTurns?: number;
  /** Memory scope: user, project, or local */
  memory?: 'user' | 'project' | 'local';
  /** MCP server names this agent has access to */
  mcpServers?: string[];
  /** Lifecycle hooks for the agent */
  hooks?: Record<string, unknown>;
  /** Whether the agent runs as a background process */
  background?: boolean;
  /** Isolation mode for the agent */
  isolation?: 'worktree';
  /** System prompt content */
  content: string;
}

/**
 * Formatter for Claude Code instructions.
 *
 * Supports three versions:
 * - **simple**: Single `CLAUDE.md` file
 * - **multifile**: Main + `.claude/rules/*.md` with path-specific rules
 * - **full** (default): Multifile + `.claude/skills/<name>/SKILL.md` + `CLAUDE.local.md`
 *
 * @example
 * ```yaml
 * targets:
 *   - claude  # uses full mode (default)
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

  override getSkillBasePath(): string | null {
    return '.claude/skills';
  }

  override getSkillFileName(): string | null {
    return 'SKILL.md';
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
    if (version === 'simple') return 'simple';
    if (version === 'multifile') return 'multifile';
    return 'full';
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

    // Generate command files
    const commands = this.extractCommands(ast);
    for (const command of commands) {
      additionalFiles.push(this.generateCommandFile(command));
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

    // Generate command files
    const commands = this.extractCommands(ast);
    for (const command of commands) {
      additionalFiles.push(this.generateCommandFile(command));
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

    // Add @CLAUDE.local.md import so Claude Code actually loads it
    if (localFile) {
      sections.push('@CLAUDE.local.md\n');
    }

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
          const resolved = obj['__resolvedRequires'];
          rules.push({
            name: key,
            paths: paths.map((p) => this.valueToString(p)),
            description: description ? this.valueToString(description) : `${key} rules`,
            content: content ? this.valueToString(content) : '',
            __resolvedRequires: Array.isArray(resolved)
              ? (resolved as Array<{ name: string; content: string }>)
              : undefined,
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

    // YAML frontmatter with paths only (description is not documented for rules files)
    lines.push('---');
    lines.push(`paths:`);
    for (const pattern of config.paths) {
      lines.push(`  - "${pattern}"`);
    }
    lines.push('---');
    lines.push('');
    lines.push(`# ${config.description}`);
    lines.push('');
    if (config.content) {
      // Dedent content and normalize for Prettier compatibility
      const dedentedContent = this.dedent(config.content);
      const normalizedContent = this.normalizeMarkdownForPrettier(dedentedContent);
      lines.push(normalizedContent);
    }

    // Append required context from resolved guard dependencies
    if (config.__resolvedRequires && config.__resolvedRequires.length > 0) {
      lines.push('');
      lines.push('## Required Context');
      lines.push('');
      for (const dep of config.__resolvedRequires) {
        lines.push(`### ${dep.name}`);
        lines.push('');
        lines.push(dep.content);
        lines.push('');
      }
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
        if (!this.isSafeSkillName(name)) continue;
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
          disableModelInvocation: obj['disableModelInvocation'] === true,
          argumentHint: obj['argumentHint'] ? this.valueToString(obj['argumentHint']) : undefined,
          model: obj['model'] ? this.valueToString(obj['model']) : undefined,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          resources:
            obj['resources'] && Array.isArray(obj['resources'])
              ? (obj['resources'] as Array<Record<string, Value>>).map((r) => ({
                  relativePath: r['relativePath'] as string,
                  content: r['content'] as string,
                }))
              : undefined,
          rawFrontmatter:
            typeof obj['__rawFrontmatter'] === 'string' ? obj['__rawFrontmatter'] : undefined,
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

    // YAML frontmatter (use quotes compatible with Prettier)
    lines.push('---');
    if (config.rawFrontmatter) {
      lines.push(config.rawFrontmatter);
    } else {
      lines.push(`name: '${config.name}'`);
      // Use double quotes if description contains apostrophe, single quotes otherwise
      const descQuote = config.description.includes("'") ? '"' : "'";
      lines.push(`description: ${descQuote}${config.description}${descQuote}`);
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
      if (config.disableModelInvocation) {
        lines.push('disable-model-invocation: true');
      }
      if (config.argumentHint) {
        lines.push(`argument-hint: '${config.argumentHint}'`);
      }
      if (config.model) {
        lines.push(`model: ${config.model}`);
      }
    }
    lines.push('---');
    lines.push('');
    if (config.content) {
      // First dedent (using lines 2+ for indent calculation since line 1 may be trimmed)
      // Then normalize for Prettier compatibility
      const dedentedContent = this.dedent(config.content);
      const normalizedContent = this.normalizeMarkdownForPrettier(dedentedContent);
      lines.push(normalizedContent);
    }

    const skillDirPath = `.claude/skills/${config.name}`;
    const resourceFiles = this.sanitizeResourceFiles(config.resources, skillDirPath);

    return {
      path: `${skillDirPath}/SKILL.md`,
      content: lines.join('\n') + '\n',
      additionalFiles: resourceFiles.length > 0 ? resourceFiles : undefined,
    };
  }

  // ============================================================
  // Command File Generation
  // ============================================================

  /**
   * Extract command configurations from @shortcuts block.
   * Commands are shortcuts with `prompt: true` or multiline `content`.
   */
  private extractCommands(ast: Program): ClaudeCommandConfig[] {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return [];

    const commands: ClaudeCommandConfig[] = [];
    const props = this.getProps(shortcuts.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // TextContent from auto-discovered command files or triple-quoted strings
        if ('type' in value && (value as Record<string, unknown>)['type'] === 'TextContent') {
          const content = this.valueToString(value);
          if (content.includes('\n')) {
            commands.push({
              name: name.replace(/^\/+/, ''),
              description: name.replace(/^\/+/, ''),
              content,
            });
          }
          continue;
        }

        const obj = value as Record<string, Value>;

        // Generate command file if it has prompt: true or multiline content
        if (obj['prompt'] === true || obj['content']) {
          commands.push({
            name: name.replace(/^\/+/, ''),
            description: obj['description'] ? this.valueToString(obj['description']) : name,
            content: obj['content'] ? this.valueToString(obj['content']) : '',
          });
        }
      }
    }

    return commands;
  }

  /**
   * Generate a .claude/commands/<name>.md file.
   */
  private generateCommandFile(config: ClaudeCommandConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter with just description
    lines.push('---');
    // Use double quotes if description contains apostrophe, single quotes otherwise
    const descQuote = config.description.includes("'") ? '"' : "'";
    lines.push(`description: ${descQuote}${config.description}${descQuote}`);
    lines.push('---');
    lines.push('');

    if (config.content) {
      // Command content is a standalone file - dedent but no Prettier normalization
      const dedentedContent = this.dedent(config.content);
      lines.push(dedentedContent);
    }

    return {
      path: `.claude/commands/${config.name}.md`,
      content: lines.join('\n') + '\n',
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
      maxTurns:
        obj['maxTurns'] !== undefined && typeof obj['maxTurns'] === 'number'
          ? obj['maxTurns']
          : undefined,
      memory: this.parseMemory(obj['memory']),
      mcpServers: this.parseStringArray(obj['mcpServers']),
      background: obj['background'] === true ? true : undefined,
      isolation: obj['isolation'] === 'worktree' ? 'worktree' : undefined,
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
   * Parse memory scope value.
   */
  private parseMemory(value: Value | undefined): 'user' | 'project' | 'local' | undefined {
    if (!value) return undefined;
    const str = this.valueToString(value);
    const validScopes = ['user', 'project', 'local'] as const;
    return validScopes.includes(str as 'user' | 'project' | 'local')
      ? (str as 'user' | 'project' | 'local')
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
      const arr = config.tools.map((t) => `'${t}'`).join(', ');
      lines.push(`tools: [${arr}]`);
    }

    if (config.disallowedTools && config.disallowedTools.length > 0) {
      const arr = config.disallowedTools.map((t) => `'${t}'`).join(', ');
      lines.push(`disallowedTools: [${arr}]`);
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

    if (config.maxTurns !== undefined) {
      lines.push(`maxTurns: ${config.maxTurns}`);
    }

    if (config.memory) {
      lines.push(`memory: ${config.memory}`);
    }

    if (config.mcpServers && config.mcpServers.length > 0) {
      const arr = config.mcpServers.map((s) => `'${s}'`).join(', ');
      lines.push(`mcpServers: [${arr}]`);
    }

    if (config.background === true) {
      lines.push('background: true');
    }

    if (config.isolation) {
      lines.push(`isolation: ${config.isolation}`);
    }

    lines.push('---');
    lines.push('');

    if (config.content) {
      // Dedent content and normalize for Prettier compatibility
      const dedentedContent = this.dedent(config.content);
      const normalizedContent = this.normalizeMarkdownForPrettier(dedentedContent);
      lines.push(normalizedContent);
    }

    return {
      path: `.claude/agents/${config.name}.md`,
      content: lines.join('\n') + '\n',
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
    this.addSection(sections, this.knowledgeContent(ast, renderer));
    this.addSection(sections, this.donts(ast, renderer));
    this.addSection(sections, this.examples(ast, renderer));
  }

  private addSection(sections: string[], content: string | null): void {
    if (content) sections.push(content);
  }

  private project(ast: Program, renderer: ConventionRenderer): string | null {
    const identity = this.findBlock(ast, 'identity');

    let text = '';
    if (identity) {
      text = this.extractText(identity.content);
    } else {
      const context = this.findBlock(ast, 'context');
      if (context?.content.type === 'MixedContent' && context.content.text) {
        text = context.content.text.value.trim();
      }
    }

    if (!text) return null;
    // Preserve paragraph breaks while trimming lines
    const cleanText = text
      .split(/\n{2,}/) // Split on paragraph breaks
      .map((para) =>
        para
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line)
          .join('\n')
      )
      .filter((para) => para)
      .join('\n\n'); // Rejoin with single blank line

    // Normalize for Prettier compatibility (blank lines before lists, etc.)
    const normalizedText = this.normalizeMarkdownForPrettier(cleanText);
    return renderer.renderSection('Project', normalizedText) + '\n';
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

    // Remove header but keep consistent indentation for normalizeMarkdownForPrettier
    const content = archMatch.replace('## Architecture', '');
    // Normalize for Prettier compatibility (strip code block indentation, etc.)
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return renderer.renderSection('Architecture', normalizedContent.trim()) + '\n';
  }

  private codeStandards(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    // Use shared extractor for consistent handling of all @standards keys
    const extracted = this.standardsExtractor.extract(standards.content);
    const items: string[] = [];

    // Collect all items from extracted code standards (dynamically iterates ALL keys)
    for (const entry of extracted.codeStandards.values()) {
      items.push(...entry.items);
    }

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Code Style', content) + '\n';
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
    if (g['scope']) items.push(`Scope: ${this.valueToString(g['scope'])}`);
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
        const shortDesc = this.valueToString(desc).split('\n')[0] ?? '';
        // Trim to avoid trailing spaces when description is empty
        commandLines.push(`${cmd.padEnd(10)} - ${shortDesc}`.trimEnd());
      }
    }

    if (commandLines.length === 0) return null;

    let content = renderer.renderCodeBlock(commandLines.join('\n'));

    if (knowledge) {
      const text = this.extractText(knowledge.content);
      const match = this.extractSectionWithCodeBlock(text, '## Development Commands');
      if (match) {
        // Remove header but keep consistent indentation for normalizeMarkdownForPrettier
        const devCmds = match.replace('## Development Commands', '');
        // Normalize for Prettier compatibility
        const normalizedDevCmds = this.normalizeMarkdownForPrettier(devCmds);
        content += '\n\n' + normalizedDevCmds.trim();
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

    // Remove header but keep consistent indentation for normalizeMarkdownForPrettier
    const content = match.replace('## Post-Work Verification', '');
    // Normalize for Prettier compatibility
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return renderer.renderSection('Post-Work Verification', normalizedContent.trim()) + '\n';
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

  /**
   * Render remaining @knowledge content not already consumed by
   * commands() (## Development Commands) or postWork() (## Post-Work Verification).
   */
  private knowledgeContent(ast: Program, _renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    if (!text) return null;

    // Remove sections already consumed by other methods
    const consumedHeaders = ['## Development Commands', '## Post-Work Verification'];
    let remaining = text;

    for (const header of consumedHeaders) {
      const headerIndex = remaining.indexOf(header);
      if (headerIndex === -1) continue;

      const afterHeader = remaining.indexOf('\n', headerIndex);
      if (afterHeader === -1) {
        remaining = remaining.substring(0, headerIndex).trimEnd();
        continue;
      }

      const nextSection = remaining.indexOf('\n## ', afterHeader);
      if (nextSection === -1) {
        remaining = remaining.substring(0, headerIndex).trimEnd();
      } else {
        remaining = remaining.substring(0, headerIndex) + remaining.substring(nextSection + 1);
      }
    }

    remaining = remaining.trim();
    if (!remaining) return null;

    return this.stripAllIndent(remaining) + '\n';
  }

  private donts(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractDontsItems(block.content);
    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection("Don'ts", content) + '\n';
  }

  private examples(ast: Program, renderer: ConventionRenderer): string | null {
    const examples = this.extractExamples(ast);
    if (examples.length === 0) return null;

    const parts: string[] = [];

    for (const example of examples) {
      parts.push(`### Example: ${example.name}`);
      if (example.description) {
        parts.push('');
        parts.push(example.description);
      }
      parts.push('');
      parts.push('**Input:**');
      parts.push('');
      parts.push('```');
      parts.push(this.dedent(example.input));
      parts.push('```');
      parts.push('');
      parts.push('**Output:**');
      parts.push('');
      parts.push('```');
      parts.push(this.dedent(example.output));
      parts.push('```');
    }

    const content = parts.join('\n');
    return renderer.renderSection('Examples', content) + '\n';
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
}
