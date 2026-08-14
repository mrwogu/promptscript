import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from './base-formatter.js';
import type { ConventionRenderer } from './convention-renderer.js';
import type { FormatOptions, FormatterOutput, FormatterWarning } from './types.js';
import { extractHooks, type HookTarget } from './hook-adapters.js';
import {
  appendTargetHookCapabilityWarnings,
  getTargetHookCapabilityWarnings,
} from './hook-capability-warnings.js';
import {
  findMcpServersBlock,
  extractMcpServers,
  serializeMcpServersToJsonString,
  serializeMcpServersToToml,
} from './mcp-helpers.js';
import { resolveSectionTitle, resolveSourceSectionTitle } from './section-title-resolver.js';

/**
 * Configuration for a markdown-based command file.
 */
export interface MarkdownCommandConfig {
  /** Command name (without leading slash) */
  name: string;
  /** Description */
  description: string;
  /** Optional argument hint */
  argumentHint?: string;
  /** Command content/instructions */
  content: string;
}

/**
 * Configuration for a markdown-based skill file.
 */
export interface MarkdownSkillConfig {
  /** Skill name */
  name: string;
  /** Description */
  description: string;
  /** Optional argument hint */
  argumentHint?: string;
  /** Skill content/instructions */
  content: string;
  /** Resource files to copy alongside the skill file */
  resources?: Array<{
    relativePath: string;
    content: string;
    origin?: string;
    executable?: boolean;
  }>;
  /** Raw frontmatter from source SKILL.md for pass-through */
  rawFrontmatter?: string;
  /** License identifier from SKILL.md frontmatter */
  license?: string;
  /** Pre-extracted examples from the skill's nested examples property */
  examples?: Array<{ name: string; input: string; output: string; description?: string }>;
  /**
   * Relative output directory underneath the target's skill folder.
   * Overrides the default `<dotDir>/skills/<name>` layout when provided.
   */
  outputDir?: string;
}

/**
 * Configuration for a markdown-based agent file.
 */
export interface MarkdownAgentConfig {
  /** Agent name */
  name: string;
  /** Description */
  description: string;
  /** Agent content/instructions */
  content: string;
}

/**
 * Section name keys that can be customized via config.
 */
export type SectionNameKey =
  | 'project'
  | 'techStack'
  | 'architecture'
  | 'context'
  | 'codeStandards'
  | 'gitCommits'
  | 'configFiles'
  | 'commands'
  | 'postWork'
  | 'documentation'
  | 'diagrams'
  | 'knowledge'
  | 'restrictions'
  | 'examples';

/**
 * Configuration for a markdown instruction formatter.
 */
export interface MarkdownFormatterConfig {
  /** Formatter name (e.g. 'opencode', 'gemini') */
  name: string;
  /** Default output file path (e.g. 'OPENCODE.md') */
  outputPath: string;
  /** Human-readable description */
  description: string;
  /** Default output convention */
  defaultConvention: string;
  /** Main file header (e.g. '# OPENCODE.md') */
  mainFileHeader: string;
  /** Dot directory for additional files (e.g. '.opencode') */
  dotDir: string;
  /** Skill file name (e.g. 'SKILL.md' or 'skill.md') */
  skillFileName: string;
  /** Whether this formatter supports agents */
  hasAgents: boolean;
  /** Whether this formatter supports commands */
  hasCommands: boolean;
  /** Whether this formatter supports skills */
  hasSkills: boolean;
  /** Whether skills are included in multifile mode (default: false, only in full) */
  skillsInMultifile?: boolean;
  /** Custom section header names */
  sectionNames?: Partial<Record<SectionNameKey, string>>;
  /** Transform function for restriction items */
  restrictionsTransform?: (s: string) => string;
  /** MCP config file path (e.g. '.windsurf/mcp_config.json'). If set, @mcpServers block is emitted to this path. */
  mcpConfigPath?: string;
  /** MCP config format (default: 'json') */
  mcpConfigFormat?: 'json' | 'toml';
  /** Hook settings file path (e.g. '.cursor/hooks.json'). If set, @hooks block is emitted to this path. */
  hooksConfigPath?: string;
  /** Hook adapter target name (default: same as formatter name) */
  hookAdapterTarget?: 'claude' | 'cursor' | 'codex' | 'factory';
  /** PromptScript blocks omitted by this target with compatibility warnings. */
  unsupportedBlocks?: readonly string[];
}

/**
 * Supported version types for markdown instruction formatters.
 */
export type MarkdownVersion = 'simple' | 'multifile' | 'full';

/**
 * Abstract base class for markdown-based instruction formatters.
 *
 * Provides shared section extraction logic (project, tech stack, architecture,
 * code standards, git commits, config files, commands, post-work, documentation,
 * diagrams, restrictions) and standard simple/multifile/full mode implementations.
 *
 * Subclasses configure behavior via `MarkdownFormatterConfig` and can override
 * specific methods for format-specific customization.
 */
export abstract class MarkdownInstructionFormatter extends BaseFormatter {
  readonly name: string;
  readonly outputPath: string;
  readonly description: string;
  readonly defaultConvention: string;

  protected readonly config: MarkdownFormatterConfig;

  constructor(config: MarkdownFormatterConfig) {
    super();
    this.config = config;
    this.name = config.name;
    this.outputPath = config.outputPath;
    this.description = config.description;
    this.defaultConvention = config.defaultConvention;
  }

  override getSkillBasePath(): string | null {
    if (!this.config.hasSkills) return null;
    return `${this.config.dotDir}/skills`;
  }

  override getSkillFileName(): string | null {
    if (!this.config.hasSkills) return null;
    return this.config.skillFileName;
  }

  override referencesMode(): 'directory' | 'inline' | 'none' {
    return this.config.hasSkills ? 'directory' : 'none';
  }

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const version = this.resolveVersion(options?.version);
    let output: FormatterOutput;

    if (version === 'full') {
      output = this.formatFull(ast, options);
    } else if (version === 'multifile') {
      output = this.formatMultifile(ast, options);
    } else {
      output = this.formatSimple(ast, options);
    }

    const hookWarnings = getTargetHookCapabilityWarnings(ast, this.name, version);
    const hasEnabledHooks = this.hasEnabledHooks(ast);
    const unsupportedWarnings = this.getUnsupportedBlockWarnings(
      ast,
      hookWarnings.length > 0 || !hasEnabledHooks ? new Set(['hooks']) : undefined
    );
    const warnedOutput =
      unsupportedWarnings.length > 0
        ? { ...output, warnings: [...(output.warnings ?? []), ...unsupportedWarnings] }
        : output;

    return appendTargetHookCapabilityWarnings(warnedOutput, ast, this.name, version);
  }

  protected hasEnabledHooks(ast: Program): boolean {
    const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
    if (!hooksBlock) return false;

    return extractHooks(hooksBlock).some((hook) => {
      const targetOverride = hook.targets?.[this.name as HookTarget];
      return (targetOverride?.enabled ?? hook.enabled) !== false;
    });
  }

  /**
   * Report blocks that have no verified project-local output contract.
   * Native target files are never invented for these blocks.
   */
  protected getUnsupportedBlockWarnings(
    ast: Program,
    skippedBlocks: ReadonlySet<string> = new Set()
  ): FormatterWarning[] {
    const unsupportedBlocks = new Set(this.config.unsupportedBlocks ?? []);
    if (unsupportedBlocks.size === 0) return [];

    const warnings: FormatterWarning[] = [];
    for (const block of ast.blocks) {
      if (block.name.startsWith('__')) continue;
      const canonicalName = block.name === 'commands' ? 'shortcuts' : block.name;
      if (skippedBlocks.has(canonicalName)) continue;
      if (!unsupportedBlocks.has(canonicalName)) continue;

      const blockLabel = canonicalName === 'shortcuts' ? '@shortcuts/@commands' : `@${block.name}`;
      warnings.push({
        code: 'PS4002',
        message: `Target "${this.name}" cannot emit ${blockLabel} and will omit it.`,
        suggestion: this.getUnsupportedBlockSuggestion(canonicalName),
        location: block.loc,
      });
    }

    return warnings;
  }

  /**
   * Provide a safe migration path for an omitted block.
   */
  protected getUnsupportedBlockSuggestion(blockName: string): string {
    switch (blockName) {
      case 'skills':
        return 'Move required skill guidance into AGENTS.md-supported instruction blocks.';
      case 'agents':
        return 'Move required agent guidance into AGENTS.md-supported instruction blocks.';
      case 'shortcuts':
        return 'Move command guidance into @knowledge or another AGENTS.md-supported instruction block.';
      case 'guards':
        return 'Move scoped guidance into AGENTS.md-supported instruction blocks.';
      case 'local':
        return 'Move local guidance into the project-local AGENTS.md file.';
      case 'mcpServers':
      case 'plugins':
        return 'Configure this integration through the target runtime; no project-local Hermes contract is verified.';
      default:
        return 'Move the content into an AGENTS.md-supported instruction block.';
    }
  }

  // ============================================================
  // Version Resolution
  // ============================================================

  protected resolveVersion(version?: string): MarkdownVersion {
    if (version === 'simple') return 'simple';
    if (version === 'multifile') return 'multifile';
    return 'full';
  }

  // ============================================================
  // Simple Mode (single file)
  // ============================================================

  protected formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const sections: string[] = [];

    const frontmatter = this.generateFrontmatter(ast, options);
    if (frontmatter) {
      sections.push(frontmatter);
    }

    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
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

  protected formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    if (this.config.hasCommands) {
      const commands = this.extractCommands(ast);
      for (const command of commands) {
        additionalFiles.push(this.generateCommandFile(command));
      }
    }

    if (this.config.hasSkills && this.config.skillsInMultifile) {
      const skills = this.extractSkills(ast, options);
      for (const skill of skills) {
        additionalFiles.push(this.generateSkillFile(skill, options));
      }
    }

    // Main file content
    const sections: string[] = [];

    const frontmatter = this.generateFrontmatter(ast, options);
    if (frontmatter) {
      sections.push(frontmatter);
    }

    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    this.addCommonSections(ast, renderer, sections);

    // Generate MCP config if configured
    const mcpConfig = this.generateMcpConfig(ast);
    if (mcpConfig) additionalFiles.push(mcpConfig);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Full Mode
  // ============================================================

  protected formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    if (this.config.hasCommands) {
      const commands = this.extractCommands(ast);
      for (const command of commands) {
        additionalFiles.push(this.generateCommandFile(command));
      }
    }

    if (this.config.hasSkills) {
      const skills = this.extractSkills(ast, options);
      for (const skill of skills) {
        additionalFiles.push(this.generateSkillFile(skill, options));
      }
    }

    if (this.config.hasAgents) {
      const agents = this.extractAgents(ast);
      for (const agent of agents) {
        additionalFiles.push(this.generateAgentFile(agent));
      }
    }

    // Main file content
    const sections: string[] = [];

    const frontmatter = this.generateFrontmatter(ast, options);
    if (frontmatter) {
      sections.push(frontmatter);
    }

    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    this.addCommonSections(ast, renderer, sections);

    // Generate MCP config if configured
    const mcpConfig = this.generateMcpConfig(ast);
    if (mcpConfig) additionalFiles.push(mcpConfig);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Frontmatter Generation (AGENTS.md v1.1 experimental)
  // ============================================================

  /**
   * Generate optional YAML frontmatter for the main output file.
   * Returns undefined by default (no frontmatter, byte-compatible with existing output).
   * Override in subclasses that support AGENTS.md v1.1 frontmatter.
   */
  /**
   * Generate MCP config file from @mcpServers block if configured.
   * Returns FormatterOutput or undefined if no MCP block or no config path.
   */
  protected generateMcpConfig(ast: Program): FormatterOutput | undefined {
    if (!this.config.mcpConfigPath) return undefined;

    const mcpServersBlock = findMcpServersBlock(ast);
    if (!mcpServersBlock) return undefined;

    const servers = extractMcpServers(mcpServersBlock);
    if (servers.length === 0) return undefined;

    const format = this.config.mcpConfigFormat ?? 'json';
    if (format === 'toml') {
      return {
        path: this.config.mcpConfigPath,
        content: serializeMcpServersToToml(servers),
      };
    }

    return {
      path: this.config.mcpConfigPath,
      content: serializeMcpServersToJsonString(servers),
    };
  }

  protected generateFrontmatter(_ast: Program, _options?: FormatOptions): string | undefined {
    return undefined;
  }

  // ============================================================
  // Section Name Resolution
  // ============================================================

  protected getSectionName(ast: Program, key: SectionNameKey, defaultTitle?: string): string {
    return resolveSectionTitle(ast, key, {
      formatterTitles: this.config.sectionNames,
      ...(defaultTitle ? { defaultTitle } : {}),
    });
  }

  protected getRenderedSectionName(
    ast: Program,
    key: SectionNameKey,
    renderer: ConventionRenderer,
    defaultTitle?: string
  ): string {
    return resolveSectionTitle(ast, key, {
      formatterTitles: this.config.sectionNames,
      ...(defaultTitle ? { defaultTitle } : {}),
      sourceOverrides: renderer.getConvention().name !== 'xml',
    });
  }

  // ============================================================
  // Restriction Transform
  // ============================================================

  protected transformRestrictionItem(s: string): string {
    return this.config.restrictionsTransform ? this.config.restrictionsTransform(s) : s;
  }

  // ============================================================
  // Command Extraction & File Generation
  // ============================================================

  protected extractCommands(ast: Program): MarkdownCommandConfig[] {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return [];

    const commands: MarkdownCommandConfig[] = [];
    const props = this.getProps(shortcuts.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // TextContent from auto-discovered command files or triple-quoted strings
        if ('type' in value && (value as Record<string, unknown>)['type'] === 'TextContent') {
          const content = this.valueToString(value);
          if (content.includes('\n')) {
            const cmdName = name.replace(/^\/+/, '');
            if (!this.isSafeName(cmdName)) continue;
            commands.push({
              name: cmdName,
              description: cmdName,
              content,
            });
          }
          continue;
        }

        const obj = value as Record<string, Value>;

        // Generate command file if it has prompt: true or multiline content
        if (obj['prompt'] === true || obj['content']) {
          const cmdName = name.replace(/^\/+/, '');
          if (!this.isSafeName(cmdName)) continue;
          commands.push({
            name: cmdName,
            description: obj['description'] ? this.valueToString(obj['description']) : name,
            argumentHint: obj['argumentHint'] ? this.valueToString(obj['argumentHint']) : undefined,
            content: obj['content'] ? this.valueToString(obj['content']) : '',
          });
        }
      }
    }

    return commands;
  }

  protected generateCommandFile(config: MarkdownCommandConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`description: ${this.yamlString(config.description)}`);
    if (config.argumentHint) {
      lines.push(`argument-hint: ${this.yamlString(config.argumentHint)}`);
    }
    lines.push('---');
    lines.push('');

    if (config.content) {
      const dedentedContent = this.dedent(config.content);
      lines.push(dedentedContent);
    }

    return {
      path: `${this.config.dotDir}/commands/${config.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Skill Extraction & File Generation
  // ============================================================

  protected extractSkills(ast: Program, options?: FormatOptions): MarkdownSkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: MarkdownSkillConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!this.isSafeSkillName(name)) continue;
        if (!this.shouldIncludeSkill(name, options)) continue;
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
          argumentHint: obj['argumentHint'] ? this.valueToString(obj['argumentHint']) : undefined,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          resources:
            obj['resources'] && Array.isArray(obj['resources'])
              ? (obj['resources'] as Array<Record<string, Value>>).map((r) => ({
                  relativePath: r['relativePath'] as string,
                  content: r['content'] as string,
                  executable: typeof r['executable'] === 'boolean' ? r['executable'] : undefined,
                }))
              : undefined,
          rawFrontmatter:
            typeof obj['__rawFrontmatter'] === 'string' ? obj['__rawFrontmatter'] : undefined,
          examples: this.extractSkillExamples(obj),
          outputDir: typeof obj['__outputDir'] === 'string' ? obj['__outputDir'] : undefined,
        });
      }
    }

    return skills;
  }

  protected generateSkillFile(
    config: MarkdownSkillConfig,
    options?: FormatOptions
  ): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    if (config.rawFrontmatter) {
      lines.push(config.rawFrontmatter);
    } else {
      lines.push(`name: ${config.name}`);
      lines.push(`description: ${this.yamlString(config.description)}`);
      if (config.argumentHint) {
        lines.push(`argument-hint: ${this.yamlString(config.argumentHint)}`);
      }
    }
    lines.push('---');
    lines.push('');

    if (config.content) {
      const dedentedContent = this.dedent(config.content);
      lines.push(dedentedContent);
    }

    // Append examples section if the skill has examples
    if (config.examples && config.examples.length > 0) {
      lines.push('');
      lines.push('## Examples');
      for (const example of config.examples) {
        lines.push('');
        lines.push(`### Example: ${example.name}`);
        if (example.description) {
          const safeDescription = example.description.replace(/[\r\n]+/g, ' ').trim();
          lines.push('');
          lines.push(safeDescription);
        }
        lines.push('');
        lines.push('**Input:**');
        lines.push('');
        lines.push(this.renderCodeFence(this.dedent(example.input)));
        lines.push('');
        lines.push('**Output:**');
        lines.push('');
        lines.push(this.renderCodeFence(this.dedent(example.output)));
      }
    }

    const skillDirPath = this.resolveSkillDir(
      `${this.config.dotDir}/skills`,
      config.name,
      config.outputDir,
      options
    );
    const resourceFiles = this.sanitizeResourceFiles(config.resources, skillDirPath);

    return {
      path: `${skillDirPath}/${this.config.skillFileName}`,
      content: lines.join('\n') + '\n',
      additionalFiles: resourceFiles.length > 0 ? resourceFiles : undefined,
    };
  }

  // ============================================================
  // Agent Extraction & File Generation
  // ============================================================

  protected extractAgents(ast: Program): MarkdownAgentConfig[] {
    const agentsBlock = this.findBlock(ast, 'agents');
    if (!agentsBlock) return [];

    const agents: MarkdownAgentConfig[] = [];
    const props = this.getProps(agentsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const description = obj['description'] ? this.valueToString(obj['description']) : '';
        if (!description) continue; // description is required

        agents.push({
          name,
          description,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
        });
      }
    }

    return agents;
  }

  protected generateAgentFile(config: MarkdownAgentConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`description: ${this.yamlString(config.description)}`);
    lines.push('mode: subagent');
    lines.push('---');
    lines.push('');

    if (config.content) {
      const dedentedContent = this.dedent(config.content);
      const normalizedContent = this.normalizeMarkdownForPrettier(dedentedContent);
      lines.push(normalizedContent);
    }

    return {
      path: `${this.config.dotDir}/agents/${config.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // YAML Helpers
  // ============================================================

  protected yamlString(value: string): string {
    const needsQuoting =
      value === '' ||
      /^[{[*&!|>'"?%@`-]/.test(value) ||
      value.includes("'") ||
      value.includes('"') ||
      value.includes(': ') ||
      value.includes(' #') ||
      value === 'true' ||
      value === 'false' ||
      value === 'null' ||
      value === 'yes' ||
      value === 'no';

    if (!needsQuoting) {
      return value;
    }

    if (value.includes("'")) {
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    return `'${value}'`;
  }

  // ============================================================
  // Common Section Methods
  // ============================================================

  protected addCommonSections(
    ast: Program,
    renderer: ConventionRenderer,
    sections: string[]
  ): void {
    this.addSection(sections, this.project(ast, renderer));
    this.addSection(sections, this.techStack(ast, renderer));
    this.addSection(sections, this.architecture(ast, renderer));
    this.addSection(sections, this.context(ast, renderer));
    this.addSection(sections, this.codeStandards(ast, renderer));
    this.addSection(sections, this.gitCommits(ast, renderer));
    this.addSection(sections, this.configFiles(ast, renderer));
    this.addSection(sections, this.commands(ast, renderer));
    this.addSection(sections, this.postWork(ast, renderer));
    this.addSection(sections, this.documentation(ast, renderer));
    this.addSection(sections, this.diagrams(ast, renderer));
    this.addSection(sections, this.knowledgeContent(ast, renderer));
    this.addSection(sections, this.restrictions(ast, renderer));
    this.addSection(sections, this.examples(ast, renderer));
  }

  protected addSection(sections: string[], content: string | null): void {
    if (content) sections.push(content);
  }

  protected project(ast: Program, renderer: ConventionRenderer): string | null {
    const identity = this.findBlock(ast, 'identity');

    // Fall back to @context MixedContent text when no @identity exists.
    // MixedContent means the block has both text AND properties — the text
    // portion is clearly a project description alongside structured config.
    let text = '';
    if (identity) {
      text = this.extractText(identity.content);
    } else {
      const context = this.findBlock(ast, 'context');
      const contextTitle = resolveSourceSectionTitle(ast, 'context');
      const projectTitle = resolveSourceSectionTitle(ast, 'project');
      if (!contextTitle && context && (context.content.type === 'MixedContent' || projectTitle)) {
        text = this.extractText(context.content).trim();
      }
    }

    if (!text) return null;
    const cleanText = text
      .split(/\n{2,}/)
      .map((para) =>
        para
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line)
          .join('\n')
      )
      .filter((para) => para)
      .join('\n\n');

    const normalizedText = this.normalizeMarkdownForPrettier(cleanText);
    return (
      renderer.renderSection(
        this.getRenderedSectionName(ast, 'project', renderer),
        normalizedText
      ) + '\n'
    );
  }

  protected techStack(ast: Program, renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (context) {
      const items = this.extractTechStackFromContext(context);
      if (items.length > 0) {
        return (
          renderer.renderSection(
            this.getRenderedSectionName(ast, 'techStack', renderer),
            items.join(', ')
          ) + '\n'
        );
      }
    }

    const standards = this.findBlock(ast, 'standards');
    if (standards) {
      const items = this.extractTechStackFromStandards(standards);
      if (items.length > 0) {
        return (
          renderer.renderSection(
            this.getRenderedSectionName(ast, 'techStack', renderer),
            items.join(', ')
          ) + '\n'
        );
      }
    }

    return null;
  }

  protected extractTechStackFromContext(context: ReturnType<typeof this.findBlock>): string[] {
    if (!context) return [];
    return this.extractContextTechStackItems(this.getProps(context.content));
  }

  protected extractTechStackFromStandards(standards: ReturnType<typeof this.findBlock>): string[] {
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

  protected architecture(ast: Program, renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    const text = this.extractText(context.content);
    const archMatch = this.extractSectionWithCodeBlock(text, '## Architecture');
    if (!archMatch) {
      const property = this.contextArchitectureProperty(ast);
      if (!property) return null;
      return (
        renderer.renderSection(
          this.getRenderedSectionName(ast, 'architecture', renderer),
          property
        ) + '\n'
      );
    }

    const content = archMatch.replace('## Architecture', '');
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return (
      renderer.renderSection(
        this.getRenderedSectionName(ast, 'architecture', renderer),
        normalizedContent.trim()
      ) + '\n'
    );
  }

  /**
   * Render @context block text content as a "## Context" section.
   *
   * The "## Architecture" subsection (with code block) is stripped because
   * it is already rendered separately by {@link architecture}. Remaining
   * "## " headings are downgraded to "### " to avoid clashing with the
   * formatter's own h2 section headings. When no @identity block exists,
   * the project() fallback already consumes the full @context text, so only
   * the generic properties are rendered to avoid duplication.
   */
  protected context(ast: Program, renderer: ConventionRenderer): string | null {
    const contextBlock = this.findBlock(ast, 'context');
    if (!contextBlock) return null;

    const identity = this.findBlock(ast, 'identity');
    const textIsConsumedByProject = !identity && !resolveSourceSectionTitle(ast, 'context');
    const propertyItems = this.contextPropertyItems(ast);

    let body = '';
    if (!textIsConsumedByProject) {
      const text = this.extractText(contextBlock.content);
      // Remove the "## Architecture" section with code block (rendered by architecture())
      const archMatch = this.extractSectionWithCodeBlock(text, '## Architecture');
      const strippedText = archMatch ? text.replace(archMatch, '') : text;
      // Dedent so trimmed first line does not leave later lines nested
      const remainingText = this.dedent(strippedText);
      if (remainingText) {
        // Downgrade "## " headings to "### " to avoid h2 collisions with formatter sections
        const downgradedText = remainingText.replace(/^(\s*)## /gm, '$1### ');
        body = this.normalizeMarkdownForPrettier(downgradedText).trim();
      }
    }

    if (propertyItems.length > 0) {
      const list = renderer.renderList(propertyItems);
      body = body ? `${body}\n\n${list}` : list;
    }

    if (!body) return null;
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'context', renderer), body) + '\n'
    );
  }

  protected codeStandards(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const extracted = this.standardsExtractor.extract(standards.content);
    const items: string[] = [];

    for (const entry of extracted.codeStandards.values()) {
      items.push(...entry.items);
    }

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'codeStandards', renderer), content) +
      '\n'
    );
  }

  protected gitCommits(ast: Program, renderer: ConventionRenderer): string | null {
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

    this.appendGenericStandardItems(items, g, new Set(['format', 'types', 'scope', 'example']));

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'gitCommits', renderer), content) +
      '\n'
    );
  }

  protected configFiles(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const config = this.getProp(standards.content, 'config');
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;

    const c = config as Record<string, Value>;
    const items: string[] = [];

    if (c['eslint']) items.push(`ESLint: ${this.valueToString(c['eslint'])}`);
    if (c['viteRoot']) items.push(`Vite root: ${this.valueToString(c['viteRoot'])}`);

    this.appendGenericStandardItems(items, c, new Set(['eslint', 'viteRoot']));

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'configFiles', renderer), content) +
      '\n'
    );
  }

  protected commands(ast: Program, renderer: ConventionRenderer): string | null {
    const shortcuts = this.isBlockUnsupported('shortcuts')
      ? undefined
      : this.findBlock(ast, 'shortcuts');
    const knowledge = this.findBlock(ast, 'knowledge');

    const commandLines: string[] = [];

    if (shortcuts) {
      const props = this.getProps(shortcuts.content);
      for (const [cmd, desc] of Object.entries(props)) {
        const shortDesc = this.shortcutSummary(desc);
        commandLines.push(`${cmd.padEnd(10)} - ${shortDesc}`.trimEnd());
      }
    }

    let content = commandLines.length > 0 ? renderer.renderCodeBlock(commandLines.join('\n')) : '';

    if (knowledge) {
      const text = this.extractText(knowledge.content);
      const match = this.extractSectionWithCodeBlock(text, '## Development Commands');
      if (match) {
        const devCmds = match.replace('## Development Commands', '');
        const normalizedDevCmds = this.normalizeMarkdownForPrettier(devCmds);
        content += '\n\n' + normalizedDevCmds.trim();
      }
    }

    if (!content) return null;

    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'commands', renderer), content) + '\n'
    );
  }

  protected isBlockUnsupported(blockName: string): boolean {
    return (this.config.unsupportedBlocks ?? []).includes(blockName);
  }

  protected postWork(ast: Program, renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const match = this.extractSectionWithCodeBlock(text, '## Post-Work Verification');
    if (!match) return null;

    const content = match.replace('## Post-Work Verification', '');
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return (
      renderer.renderSection(
        this.getRenderedSectionName(ast, 'postWork', renderer),
        normalizedContent.trim()
      ) + '\n'
    );
  }

  protected documentation(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const docs = this.getProp(standards.content, 'documentation');
    if (!docs || typeof docs !== 'object' || Array.isArray(docs)) return null;

    const d = docs as Record<string, Value>;
    const items: string[] = [];

    const verifyBefore = this.documentationItem(d['verifyBefore'], 'Review docs before changes');
    if (verifyBefore) items.push(verifyBefore);
    const verifyAfter = this.documentationItem(d['verifyAfter'], 'Update docs after changes');
    if (verifyAfter) items.push(verifyAfter);
    const codeExamples = this.documentationItem(d['codeExamples'], 'Keep code examples accurate');
    if (codeExamples) items.push(codeExamples);

    this.appendGenericStandardItems(
      items,
      d,
      new Set(['verifyBefore', 'verifyAfter', 'codeExamples'])
    );

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'documentation', renderer), content) +
      '\n'
    );
  }

  protected diagrams(ast: Program, renderer: ConventionRenderer): string | null {
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

    this.appendGenericStandardItems(items, d, new Set(['format', 'types']));

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'diagrams', renderer), content) + '\n'
    );
  }

  /**
   * Render remaining @knowledge text content that isn't consumed by other sections.
   * Strips "## Development Commands" and "## Post-Work Verification" sub-sections
   * since those are already rendered by commands() and postWork().
   */
  protected knowledgeContent(
    ast: Program,
    renderer: ConventionRenderer,
    includeResolvedTitle = true
  ): string | null {
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

      // Find the end of this section (next ## header or end of text)
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

    const normalizedContent = this.stripAllIndent(remaining);
    const title =
      renderer.getConvention().name === 'xml'
        ? undefined
        : resolveSourceSectionTitle(ast, 'knowledge');
    return includeResolvedTitle && title
      ? renderer.renderSection(title, normalizedContent) + '\n'
      : normalizedContent + '\n';
  }

  protected restrictions(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractRestrictionsItems(block);
    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return (
      renderer.renderSection(this.getRenderedSectionName(ast, 'restrictions', renderer), content) +
      '\n'
    );
  }

  protected examples(ast: Program, renderer: ConventionRenderer): string | null {
    return this.renderExamplesSection(
      ast,
      renderer,
      this.getRenderedSectionName(ast, 'examples', renderer)
    );
  }

  protected extractRestrictionsItems(block: Block): string[] {
    const { content } = block;
    const listItems = this.getBlockArrayElements(block);
    if (listItems.length > 0) {
      return listItems.map((item: Value) =>
        this.transformRestrictionItem(this.valueToString(item))
      );
    }

    if (content.type === 'TextContent') {
      return content.value
        .trim()
        .split('\n')
        .map((line: string) => line.trim().replace(/^-\s*/, ''))
        .filter((line: string) => line.length > 0)
        .map((s: string) => this.transformRestrictionItem(s));
    }

    if (content.type === 'ObjectContent') {
      const itemsArray = this.getProp(content, 'items');
      if (Array.isArray(itemsArray)) {
        return itemsArray.map((item: unknown) =>
          this.transformRestrictionItem(this.valueToString(item as Value))
        );
      }
    }

    return [];
  }
}
