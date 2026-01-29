import type { Block, GithubVersion, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { ConventionRenderer } from '../convention-renderer.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

/**
 * GitHub formatter version information.
 */
export const GITHUB_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single file output (.github/copilot-instructions.md)',
    outputPath: '.github/copilot-instructions.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Main + path-specific instructions (.github/instructions/) + prompts',
    outputPath: '.github/copilot-instructions.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + skills (.github/skills/) + agents (.github/agents/) + AGENTS.md',
    outputPath: '.github/copilot-instructions.md',
  },
} as const;

/**
 * Configuration for a path-specific instruction file.
 */
interface InstructionConfig {
  /** File name (without extension) */
  name: string;
  /** Glob patterns this instruction applies to */
  applyTo: string[];
  /** Optional agent exclusion */
  excludeAgent?: string;
  /** Description for the instruction */
  description: string;
  /** Content of the instruction */
  content: string;
}

/**
 * Configuration for a prompt file.
 */
interface PromptConfig {
  /** Prompt name */
  name: string;
  /** Description */
  description: string;
  /** Whether to run in agent mode */
  mode?: 'agent';
  /** Allowed tools in agent mode */
  tools?: string[];
  /** Prompt content */
  content: string;
}

/**
 * Configuration for a skill.
 */
interface SkillConfig {
  /** Skill name */
  name: string;
  /** Description */
  description: string;
  /** Whether to disable model invocation */
  disableModelInvocation?: boolean;
  /** Skill content/instructions */
  content: string;
}

/**
 * Configuration for a GitHub Copilot custom agent.
 *
 * @see https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents
 */
interface GitHubAgentConfig {
  /** Agent name (used for filename) */
  name: string;
  /** Description of what the agent does */
  description: string;
  /** Tools the agent can use */
  tools?: string[];
  /** AI model to use (e.g., 'gpt-4o', 'claude-3.5-sonnet') */
  model?: string;
  /** System prompt content */
  content: string;
}

/**
 * Mapping from PromptScript/Claude Code tool names to GitHub Copilot canonical tool names.
 *
 * GitHub Copilot uses specific tool names that differ from Claude Code aliases.
 * @see https://docs.github.com/en/copilot/reference/custom-agents-configuration
 */
const TOOL_NAME_MAPPING: Record<string, string> = {
  // Read tools
  Read: 'read',
  NotebookRead: 'read',
  // Edit tools
  Edit: 'edit',
  MultiEdit: 'edit',
  Write: 'edit',
  NotebookEdit: 'edit',
  // Search tools
  Grep: 'search',
  Glob: 'search',
  // Execute tools
  Bash: 'execute',
  // Web tools
  WebFetch: 'web',
  WebSearch: 'web',
  // Agent tools
  Task: 'agent',
  // Todo tools
  TodoWrite: 'todo',
  TodoRead: 'todo',
};

/**
 * Mapping from PromptScript/Claude Code model names to GitHub Copilot model names.
 *
 * GitHub Copilot uses full model names (e.g., "Claude Sonnet 4") while Claude Code
 * uses short aliases (e.g., "sonnet").
 *
 * @see https://code.visualstudio.com/docs/copilot/customization/custom-agents
 */
const MODEL_NAME_MAPPING: Record<string, string> = {
  // Claude models - default aliases map to latest versions (4.5)
  sonnet: 'Claude Sonnet 4.5',
  opus: 'Claude Opus 4.5',
  haiku: 'Claude Haiku 4.5',
  // Explicit version mappings
  'sonnet-4': 'Claude Sonnet 4',
  'sonnet-4.5': 'Claude Sonnet 4.5',
  'opus-4': 'Claude Opus 4',
  'opus-4.5': 'Claude Opus 4.5',
  'haiku-4': 'Claude Haiku 4',
  'haiku-4.5': 'Claude Haiku 4.5',
  // OpenAI models (pass through if already in correct format)
  'gpt-4o': 'GPT-4o',
  'gpt-4.1': 'GPT-4.1',
  'gpt-5': 'GPT-5',
  'gpt-5-mini': 'GPT-5 mini',
  // Special values
  inherit: '', // Empty string means omit the model property
  auto: 'Auto',
};

/**
 * Formatter for GitHub Copilot instructions.
 *
 * Supports three versions:
 * - **simple** (default): Single `.github/copilot-instructions.md` file
 * - **multifile**: Main + `.github/instructions/*.instructions.md` + `.github/prompts/*.prompt.md`
 * - **full**: Multifile + `.github/skills/<name>/SKILL.md` + `AGENTS.md`
 *
 * @example
 * ```yaml
 * targets:
 *   - github  # uses simple mode
 *   - github:
 *       version: multifile
 *   - github:
 *       version: full
 * ```
 *
 * @see https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot
 */
export class GitHubFormatter extends BaseFormatter {
  readonly name = 'github';
  readonly outputPath = '.github/copilot-instructions.md';
  readonly description = 'GitHub Copilot instructions (Markdown)';
  readonly defaultConvention = 'markdown';

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof GITHUB_VERSIONS {
    return GITHUB_VERSIONS;
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
   * Resolve version string to GithubVersion.
   */
  private resolveVersion(version?: string): GithubVersion {
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
      sections.push(this.header(ast));
    }

    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n\n') + '\n',
    };
  }

  // ============================================================
  // Multifile Mode
  // ============================================================

  private formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    // Generate path-specific instruction files
    const instructions = this.extractInstructions(ast);
    for (const instruction of instructions) {
      additionalFiles.push(this.generateInstructionFile(instruction));
    }

    // Generate prompt files
    const prompts = this.extractPrompts(ast);
    for (const prompt of prompts) {
      additionalFiles.push(this.generatePromptFile(prompt));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(this.header(ast));
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n\n') + '\n',
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Full Mode
  // ============================================================

  private formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    // Generate path-specific instruction files
    const instructions = this.extractInstructions(ast);
    for (const instruction of instructions) {
      additionalFiles.push(this.generateInstructionFile(instruction));
    }

    // Generate prompt files
    const prompts = this.extractPrompts(ast);
    for (const prompt of prompts) {
      additionalFiles.push(this.generatePromptFile(prompt));
    }

    // Generate skill files
    const skills = this.extractSkills(ast);
    for (const skill of skills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Generate custom agent files (.github/agents/)
    const customAgents = this.extractCustomAgents(ast);
    for (const agent of customAgents) {
      additionalFiles.push(this.generateCustomAgentFile(agent));
    }

    // Generate AGENTS.md
    const agentsFile = this.generateAgentsFile(ast);
    if (agentsFile) {
      additionalFiles.push(agentsFile);
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(this.header(ast));
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n\n') + '\n',
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Instruction File Generation
  // ============================================================

  /**
   * Extract instruction configurations from @guards block.
   */
  private extractInstructions(ast: Program): InstructionConfig[] {
    const guards = this.findBlock(ast, 'guards');
    if (!guards) return [];

    const instructions: InstructionConfig[] = [];
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
        instructions.push({
          name: 'typescript',
          applyTo: tsPatterns as string[],
          description: 'TypeScript-specific coding rules',
          content: this.getTypeScriptInstructionContent(ast),
        });
      }

      if (testPatterns.length > 0) {
        instructions.push({
          name: 'testing',
          applyTo: testPatterns as string[],
          description: 'Testing-specific rules and patterns',
          content: this.getTestingInstructionContent(ast),
        });
      }
    }

    // Handle named instruction blocks within guards
    for (const [key, value] of Object.entries(props)) {
      if (key === 'globs') continue;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const applyTo = obj['applyTo'];
        const excludeAgent = obj['excludeAgent'];
        const description = obj['description'];
        const content = obj['content'];

        if (applyTo && Array.isArray(applyTo)) {
          instructions.push({
            name: key,
            applyTo: applyTo.map((p) => this.valueToString(p)),
            excludeAgent: excludeAgent ? this.valueToString(excludeAgent) : undefined,
            description: description ? this.valueToString(description) : `${key} rules`,
            content: content ? this.valueToString(content) : '',
          });
        }
      }
    }

    return instructions;
  }

  /**
   * Generate a .github/instructions/*.instructions.md file.
   */
  private generateInstructionFile(config: InstructionConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`applyTo:`);
    for (const pattern of config.applyTo) {
      lines.push(`  - "${pattern}"`);
    }
    if (config.excludeAgent) {
      lines.push(`excludeAgent: "${config.excludeAgent}"`);
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

    return {
      path: `.github/instructions/${config.name}.instructions.md`,
      content: lines.join('\n'),
    };
  }

  /**
   * Get TypeScript instruction content from AST.
   */
  private getTypeScriptInstructionContent(ast: Program): string {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return '';

    const props = this.getProps(standards.content);
    const items: string[] = [];

    // TypeScript standards
    const ts = props['typescript'];
    if (ts && typeof ts === 'object' && !Array.isArray(ts)) {
      const tsObj = ts as Record<string, Value>;
      if (tsObj['strictMode']) items.push('- Use strict TypeScript, avoid `any` types');
      if (tsObj['useUnknown'])
        items.push(`- Use \`unknown\` ${this.valueToString(tsObj['useUnknown'])}`);
      if (tsObj['exports'])
        items.push(`- ${this.capitalize(this.valueToString(tsObj['exports']))}`);
      if (tsObj['returnTypes'])
        items.push(`- Explicit return types ${this.valueToString(tsObj['returnTypes'])}`);
    }

    // Naming standards
    const naming = props['naming'];
    if (naming && typeof naming === 'object' && !Array.isArray(naming)) {
      const n = naming as Record<string, Value>;
      if (n['files']) items.push(`- Files: \`${this.valueToString(n['files'])}\``);
      if (n['classes']) items.push(`- Classes/Interfaces: \`${this.valueToString(n['classes'])}\``);
      if (n['functions'])
        items.push(`- Functions/Variables: \`${this.valueToString(n['functions'])}\``);
    }

    return items.join('\n');
  }

  /**
   * Get testing instruction content from AST.
   */
  private getTestingInstructionContent(ast: Program): string {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return '';

    const props = this.getProps(standards.content);
    const items: string[] = [];

    const testing = props['testing'];
    if (testing && typeof testing === 'object' && !Array.isArray(testing)) {
      const t = testing as Record<string, Value>;
      if (t['filePattern']) items.push(`- Test files: \`${this.valueToString(t['filePattern'])}\``);
      if (t['pattern']) items.push(`- Follow ${this.valueToString(t['pattern'])} pattern`);
      if (t['coverage'])
        items.push(`- Target >${this.valueToString(t['coverage'])}% coverage for libraries`);
      if (t['fixtures']) items.push(`- Use fixtures ${this.valueToString(t['fixtures'])}`);
    }

    return items.length > 0 ? items.join('\n') : 'Follow project testing conventions.';
  }

  // ============================================================
  // Prompt File Generation
  // ============================================================

  /**
   * Extract prompt configurations from @shortcuts block.
   */
  private extractPrompts(ast: Program): PromptConfig[] {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return [];

    const prompts: PromptConfig[] = [];
    const props = this.getProps(shortcuts.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;

        // Check if this shortcut should be a prompt file
        if (obj['prompt'] === true || obj['type'] === 'prompt') {
          prompts.push({
            name,
            description: obj['description'] ? this.valueToString(obj['description']) : name,
            mode: obj['mode'] === 'agent' ? 'agent' : undefined,
            tools:
              obj['tools'] && Array.isArray(obj['tools'])
                ? obj['tools'].map((t) => this.valueToString(t))
                : undefined,
            content: obj['content'] ? this.valueToString(obj['content']) : '',
          });
        }
      }
    }

    return prompts;
  }

  /**
   * Generate a .github/prompts/*.prompt.md file.
   */
  private generatePromptFile(config: PromptConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter - use single quotes (Prettier default for YAML strings)
    lines.push('---');
    // Use double quotes if description contains apostrophe, single quotes otherwise
    const descQuote = config.description.includes("'") ? '"' : "'";
    lines.push(`description: ${descQuote}${config.description}${descQuote}`);
    if (config.mode === 'agent') {
      lines.push('mode: agent');
      if (config.tools && config.tools.length > 0) {
        // Map tool names and use inline YAML array format
        const mappedTools = config.tools
          .map((tool) => TOOL_NAME_MAPPING[tool] ?? tool.toLowerCase())
          .filter((t, i, arr) => arr.indexOf(t) === i); // deduplicate
        const toolsArray = mappedTools.map((t) => `'${t}'`).join(', ');
        lines.push(`tools: [${toolsArray}]`);
      }
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
      path: `.github/prompts/${config.name}.prompt.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Skill File Generation
  // ============================================================

  /**
   * Extract skill configurations from @skills block.
   */
  private extractSkills(ast: Program): SkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: SkillConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
          disableModelInvocation: obj['disableModelInvocation'] === true,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
        });
      }
    }

    return skills;
  }

  /**
   * Generate a .github/skills/<name>/SKILL.md file.
   */
  private generateSkillFile(config: SkillConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter (use quotes compatible with Prettier)
    lines.push('---');
    lines.push(`name: '${config.name}'`);
    // Use double quotes if description contains apostrophe, single quotes otherwise
    const descQuote = config.description.includes("'") ? '"' : "'";
    lines.push(`description: ${descQuote}${config.description}${descQuote}`);
    if (config.disableModelInvocation) {
      lines.push('disable-model-invocation: true');
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

    return {
      path: `.github/skills/${config.name}/SKILL.md`,
      content: lines.join('\n') + '\n',
    };
  }

  /**
   * Remove common leading indentation from multiline text.
   * Calculates minimum indent from lines 2+ only, since line 1 may have been
   * trimmed (losing its indentation) while subsequent lines retain theirs.
   */
  private dedent(text: string): string {
    const lines = text.split('\n');
    if (lines.length <= 1) return text.trim();

    // Calculate minimum indent from lines 2+ only
    const minIndent = lines
      .slice(1)
      .filter((line) => line.trim().length > 0)
      .reduce((min, line) => {
        const match = line.match(/^(\s*)/);
        const indent = match?.[1]?.length ?? 0;
        return Math.min(min, indent);
      }, Infinity);

    if (minIndent === 0 || minIndent === Infinity) {
      return text.trim();
    }

    const firstLine = lines[0] ?? '';
    return [
      firstLine.trim(),
      ...lines.slice(1).map((line) => (line.trim().length > 0 ? line.slice(minIndent) : '')),
    ]
      .join('\n')
      .trim();
  }

  // ============================================================
  // AGENTS.md Generation
  // ============================================================

  /**
   * Generate AGENTS.md file with agent-specific instructions.
   */
  private generateAgentsFile(ast: Program): FormatterOutput | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const lines: string[] = [];
    lines.push('# Agent Instructions');
    lines.push('');

    // Add identity content
    // Use stripAllIndent for AGENTS.md since identity content comes from merged sources with inconsistent indentation
    const identityText = this.extractText(identity.content);
    if (identityText) {
      lines.push('## Identity');
      lines.push('');
      lines.push(this.stripAllIndent(identityText));
      lines.push('');
    }

    // Add context if available
    const context = this.findBlock(ast, 'context');
    if (context) {
      const contextText = this.extractText(context.content);
      if (contextText) {
        lines.push('## Context');
        lines.push('');
        lines.push(this.stripAllIndent(contextText));
        lines.push('');
      }
    }

    // Add restrictions if available
    const restrictions = this.findBlock(ast, 'restrictions');
    if (restrictions) {
      const items = this.extractRestrictionItems(restrictions.content);
      if (items.length > 0) {
        lines.push('## Restrictions');
        lines.push('');
        for (const item of items) {
          lines.push(`- ${item}`);
        }
        // No trailing empty line - we add '\n' at the end
      }
    }

    return {
      path: 'AGENTS.md',
      content: lines.join('\n') + '\n',
    };
  }

  /**
   * Extract restriction items from block content.
   */
  private extractRestrictionItems(content: Block['content']): string[] {
    if (content.type === 'ArrayContent') {
      return content.elements.map((item) => this.valueToString(item));
    }

    if (content.type === 'TextContent') {
      return content.value
        .trim()
        .split('\n')
        .map((line) => line.trim().replace(/^-\s*/, ''))
        .filter((line) => line.length > 0);
    }

    if (content.type === 'ObjectContent') {
      const itemsArray = this.getProp(content, 'items');
      if (Array.isArray(itemsArray)) {
        return itemsArray.map((item: unknown) => this.valueToString(item as Value));
      }
    }

    return [];
  }

  // ============================================================
  // Custom Agent File Generation (.github/agents/)
  // ============================================================

  /**
   * Extract custom agent configurations from @agents block.
   *
   * @see https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents
   */
  private extractCustomAgents(ast: Program): GitHubAgentConfig[] {
    const agentsBlock = this.findBlock(ast, 'agents');
    if (!agentsBlock) return [];

    const agents: GitHubAgentConfig[] = [];
    const props = this.getProps(agentsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const description = obj['description'] ? this.valueToString(obj['description']) : '';
        if (!description) continue; // description is required

        agents.push({
          name,
          description,
          tools: this.parseToolsArray(obj['tools']),
          model: obj['model'] ? this.valueToString(obj['model']) : undefined,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
        });
      }
    }

    return agents;
  }

  /**
   * Parse tools array from a Value and map to GitHub Copilot canonical names.
   *
   * @see https://docs.github.com/en/copilot/reference/custom-agents-configuration
   */
  private parseToolsArray(value: Value | undefined): string[] | undefined {
    if (!value || !Array.isArray(value)) return undefined;

    const mapped = value
      .map((v) => this.valueToString(v))
      .filter((s) => s.length > 0)
      .map((tool) => TOOL_NAME_MAPPING[tool] ?? tool.toLowerCase());

    // Deduplicate (e.g., Grep and Glob both map to 'search')
    const unique = [...new Set(mapped)];

    return unique.length > 0 ? unique : undefined;
  }

  /**
   * Map a model name from PromptScript/Claude Code format to GitHub Copilot format.
   *
   * @returns The mapped model name, or undefined if the model should be omitted (e.g., "inherit")
   */
  private mapModelName(model: string | undefined): string | undefined {
    if (!model) return undefined;

    const mapped = MODEL_NAME_MAPPING[model.toLowerCase()];

    // If mapped to empty string, omit the model property
    if (mapped === '') return undefined;

    // If we have a mapping, use it; otherwise pass through as-is
    // (allows users to specify GitHub Copilot model names directly)
    return mapped ?? model;
  }

  /**
   * Generate a .github/agents/<name>.md file.
   *
   * @see https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents
   */
  private generateCustomAgentFile(config: GitHubAgentConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${config.name}`);
    lines.push(`description: ${config.description}`);

    if (config.tools && config.tools.length > 0) {
      // Use inline YAML array format as per GitHub Copilot spec
      const toolsArray = config.tools.map((t) => `'${t}'`).join(', ');
      lines.push(`tools: [${toolsArray}]`);
    }

    // Map model name to GitHub Copilot format
    const mappedModel = this.mapModelName(config.model);
    if (mappedModel) {
      lines.push(`model: ${mappedModel}`);
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
      path: `.github/agents/${config.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Common Section Methods
  // ============================================================

  private addCommonSections(ast: Program, renderer: ConventionRenderer, sections: string[]): void {
    const project = this.project(ast, renderer);
    if (project) sections.push(project);

    const techStack = this.techStack(ast, renderer);
    if (techStack) sections.push(techStack);

    const architecture = this.architecture(ast, renderer);
    if (architecture) sections.push(architecture);

    const codeStandards = this.codeStandards(ast, renderer);
    if (codeStandards) sections.push(codeStandards);

    const shortcuts = this.shortcutsSection(ast, renderer);
    if (shortcuts) sections.push(shortcuts);

    const commands = this.commands(ast, renderer);
    if (commands) sections.push(commands);

    const gitCommits = this.gitCommits(ast, renderer);
    if (gitCommits) sections.push(gitCommits);

    const configFiles = this.configFiles(ast, renderer);
    if (configFiles) sections.push(configFiles);

    const documentation = this.documentation(ast, renderer);
    if (documentation) sections.push(documentation);

    const postWork = this.postWork(ast, renderer);
    if (postWork) sections.push(postWork);

    const restrictions = this.restrictions(ast, renderer);
    if (restrictions) sections.push(restrictions);

    const diagrams = this.diagrams(ast, renderer);
    if (diagrams) sections.push(diagrams);

    const knowledge = this.knowledge(ast, renderer);
    if (knowledge) sections.push(knowledge);
  }

  private header(_ast: Program): string {
    return `# GitHub Copilot Instructions`;
  }

  private project(ast: Program, renderer: ConventionRenderer): string | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const content = this.extractText(identity.content);
    // Apply stripAllIndent to normalize merged identity content for Prettier compatibility
    return renderer.renderSection('project', this.stripAllIndent(content));
  }

  private techStack(ast: Program, renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    const props = this.getProps(context.content);
    const items: string[] = [];

    const languages = props['languages'];
    if (languages) {
      const arr = Array.isArray(languages) ? languages : [languages];
      items.push(`**Language:** ${this.formatTechItem(arr)}`);
    }

    const runtime = props['runtime'];
    if (runtime) {
      items.push(`**Runtime:** ${this.valueToString(runtime)}`);
    }

    const monorepo = props['monorepo'];
    if (monorepo && typeof monorepo === 'object' && !Array.isArray(monorepo)) {
      const mr = monorepo as Record<string, Value>;
      const tool = mr['tool'];
      const pm = mr['packageManager'];
      if (tool && pm) {
        items.push(
          `**Monorepo:** ${this.valueToString(tool)} with ${this.valueToString(pm)} workspaces`
        );
      }
    }

    if (items.length === 0) return null;

    const content = renderer.renderList(items);
    return renderer.renderSection('tech-stack', content);
  }

  private architecture(ast: Program, renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    const text = this.extractText(context.content);
    const archMatch = this.extractSectionWithCodeBlock(text, '## Architecture');
    if (!archMatch) return null;

    const content = archMatch.replace('## Architecture', '').trim();
    // Apply stripAllIndent to normalize content for Prettier compatibility
    return renderer.renderSection('architecture', this.stripAllIndent(content));
  }

  private codeStandards(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const subsections: string[] = [];

    // Iterate over all keys in @standards, not just hardcoded ones
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value)) {
        // Map 'errors' to 'error-handling' for backwards compatibility
        const sectionName = key === 'errors' ? 'error-handling' : key;
        const items = this.formatStandardsList(value);
        if (items.length > 0) {
          subsections.push(renderer.renderSection(sectionName, renderer.renderList(items), 2));
        }
      }
    }

    if (subsections.length === 0) return null;

    return renderer.renderSection('code-standards', subsections.join('\n\n'));
  }

  /**
   * Generate shortcuts section for copilot-instructions.md.
   * Includes shortcuts that don't have prompt: true (those go to .prompt.md files).
   */
  private shortcutsSection(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'shortcuts');
    if (!block) return null;

    const props = this.getProps(block.content);
    const items: string[] = [];

    for (const [name, value] of Object.entries(props)) {
      // Skip shortcuts with prompt: true (those generate separate .prompt.md files)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        if (obj['prompt'] === true || obj['type'] === 'prompt') {
          continue;
        }
        // Object without prompt: true - use description or first line of content
        const desc = obj['description'] || obj['content'] || name;
        items.push(`${name}: ${this.valueToString(desc).split('\n')[0]}`);
      } else {
        // Simple string shortcut - use first line only
        items.push(`${name}: ${this.valueToString(value).split('\n')[0]}`);
      }
    }

    if (items.length === 0) return null;
    return renderer.renderSection('shortcuts', renderer.renderList(items));
  }

  private commands(ast: Program, renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const commandsMatch = this.extractSectionWithCodeBlock(text, '## Development Commands');
    if (!commandsMatch) return null;

    const content = commandsMatch.replace('## Development Commands', '').trim();
    // Apply stripAllIndent to normalize content for Prettier compatibility
    return renderer.renderSection('commands', this.stripAllIndent(content));
  }

  private gitCommits(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const git = props['git'];
    if (!git || typeof git !== 'object' || Array.isArray(git)) return null;

    const gitObj = git as Record<string, Value>;
    const items: string[] = [];

    const format = gitObj['format'];
    if (format) {
      items.push(
        `Use [${this.valueToString(format)}](https://www.conventionalcommits.org/) format`
      );
    }

    const maxLen = gitObj['maxSubjectLength'];
    if (maxLen) {
      items.push(`Keep commit message subject line max ${this.valueToString(maxLen)} characters`);
    }

    items.push('Format: `<type>(<scope>): <description>`');

    const types = gitObj['types'];
    if (types && Array.isArray(types)) {
      items.push(`Types: \`${types.map(String).join('`, `')}\``);
    }

    const example = gitObj['example'];
    if (example) {
      items.push(`Example: \`${this.valueToString(example)}\``);
    }

    if (items.length === 0) return null;

    return renderer.renderSection('git-commits', renderer.renderList(items));
  }

  private configFiles(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const config = props['config'];
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;

    const configObj = config as Record<string, Value>;
    const subsections: string[] = [];

    const eslint = configObj['eslint'];
    if (eslint) {
      const value = this.valueToString(eslint);
      subsections.push(renderer.renderSection('eslint', `ESLint: ${value}`, 2));
    }

    const vite = configObj['viteRoot'];
    if (vite) {
      const value = this.valueToString(vite);
      subsections.push(renderer.renderSection('vite-vitest', `Vite root: ${value}`, 2));
    }

    if (subsections.length === 0) return null;

    return renderer.renderSection('configuration-files', subsections.join('\n\n'));
  }

  private documentation(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const docs = props['documentation'];
    if (!docs || typeof docs !== 'object' || Array.isArray(docs)) return null;

    const docsObj = docs as Record<string, Value>;
    const items: string[] = [];

    if (docsObj['verifyBefore']) {
      items.push(
        '**Before** making code changes, review `README.md` and relevant files in `docs/` to understand documented behavior'
      );
    }
    if (docsObj['verifyAfter']) {
      items.push(
        '**After** making code changes, verify consistency with `README.md` and `docs/` - update documentation if needed'
      );
    }
    if (docsObj['codeExamples']) {
      items.push('Ensure code examples in documentation remain accurate after modifications');
    }
    items.push('If adding new features, add corresponding documentation in `docs/`');
    items.push('If changing existing behavior, update affected documentation sections');

    if (items.length === 0) return null;

    return renderer.renderSection('documentation-verification', renderer.renderList(items));
  }

  private postWork(ast: Program, renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const postMatch = this.extractSectionWithCodeBlock(text, '## Post-Work Verification');
    if (!postMatch) return null;

    const intro =
      'After completing any code changes, run the following commands to ensure code quality:';
    const content = postMatch.replace('## Post-Work Verification', '').trim();
    // Apply stripAllIndent to normalize content for Prettier compatibility
    return renderer.renderSection(
      'post-work-verification',
      `${intro}\n${this.stripAllIndent(content)}`
    );
  }

  private restrictions(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    let items: string[] = [];

    if (block.content.type === 'ArrayContent') {
      items = block.content.elements.map((item) =>
        this.formatRestriction(this.valueToString(item))
      );
    } else if (block.content.type === 'TextContent') {
      items = block.content.value
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => this.formatRestriction(line.trim()));
    } else if (block.content.type === 'ObjectContent') {
      const itemsArray = this.getProp(block.content, 'items');
      if (Array.isArray(itemsArray)) {
        items = itemsArray.map((item: unknown) =>
          this.formatRestriction(this.valueToString(item as Value))
        );
      }
    }

    if (items.length === 0) return null;

    return renderer.renderSection('donts', renderer.renderList(items));
  }

  private diagrams(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const diag = props['diagrams'];
    if (!diag || typeof diag !== 'object' || Array.isArray(diag)) return null;

    const diagObj = diag as Record<string, Value>;
    const items: string[] = [];

    const format = diagObj['format'];
    if (format) {
      items.push(
        `Always use **${this.valueToString(format)}** syntax for diagrams in documentation`
      );
    }

    const types = diagObj['types'];
    if (types && Array.isArray(types)) {
      items.push(`Supported diagram types: ${types.map(String).join(', ')}, etc.`);
    }

    items.push('Wrap diagrams in markdown code blocks with `mermaid` language identifier');
    items.push(
      'Example:\n  ```mermaid\n  flowchart LR\n    A[Input] --> B[Process] --> C[Output]\n  ```'
    );

    if (items.length === 0) return null;

    return renderer.renderSection('diagrams', renderer.renderList(items));
  }

  private knowledge(_ast: Program, _renderer: ConventionRenderer): string | null {
    // Knowledge is distributed to other sections in this formatter
    return null;
  }

  // Helper methods

  private formatTechItem(arr: Value[]): string {
    return arr.map(String).join(', ');
  }

  private formatRestriction(text: string): string {
    const formatted = text
      .replace(/^-\s*/, '')
      .replace(/^"/, '')
      .replace(/"$/, '')
      .replace(/^Never\s+/i, "Don't ");

    return formatted;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
