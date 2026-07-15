import type { Program, Value } from '@promptscript/core';
import { posix } from 'path';
import type { ConventionRenderer } from '../convention-renderer.js';
import {
  MarkdownInstructionFormatter,
  type MarkdownAgentConfig,
  type MarkdownCommandConfig,
  type MarkdownSkillConfig,
} from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

/**
 * Supported Factory AI format versions.
 */
export type FactoryVersion = 'simple' | 'multifile' | 'full';

/**
 * Factory AI formatter version information.
 */
export const FACTORY_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single AGENTS.md file',
    outputPath: 'AGENTS.md',
  },
  multifile: {
    name: 'multifile',
    description: 'AGENTS.md + .factory/skills/<name>/SKILL.md',
    outputPath: 'AGENTS.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + droids + additional supporting files',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Handoff definition for Factory AI multi-agent workflows.
 */
interface FactoryHandoff {
  /** Display label */
  label: string;
  /** Target agent identifier */
  agent: string;
  /** Prompt to send to target agent */
  prompt: string;
  /** Whether to send immediately */
  send?: boolean;
}

/**
 * Extended command config with Factory-specific fields.
 */
interface FactoryCommandConfig extends MarkdownCommandConfig {
  /** Agent to execute the command */
  agent?: string;
  /** Handoff definitions for multi-agent workflows */
  handoffs?: FactoryHandoff[];
  /** Allowed tools for this command */
  tools?: string[];
}

/**
 * Extended skill config with Factory-specific fields.
 */
interface FactorySkillConfig extends MarkdownSkillConfig {
  /** Whether user can invoke via slash command */
  userInvocable: boolean;
  /** Whether to disable automatic AI invocation */
  disableModelInvocation: boolean;
  /** Allowed tools */
  allowedTools?: string[];
}

/**
 * Valid reasoning effort levels for Factory AI droids.
 */
type FactoryReasoningEffort = 'low' | 'medium' | 'high';

/**
 * Configuration for a Factory AI droid (subagent).
 */
interface FactoryDroidConfig extends MarkdownAgentConfig {
  /** Model to use (e.g., 'inherit', 'claude-sonnet-4-5-20250929') */
  model?: string;
  /** Reasoning effort level */
  reasoningEffort?: FactoryReasoningEffort;
  /** Model for Specification Mode planning (mixed models) */
  specModel?: string;
  /** Reasoning effort for Specification Mode model */
  specReasoningEffort?: FactoryReasoningEffort;
  /** Tool access: category name or array of tool IDs */
  tools?: string | string[];
}

/**
 * Always-on rule file emitted for Factory split rules mode.
 */
interface FactoryRuleFile {
  /** Human-readable label used in the AGENTS.md index */
  label: string;
  /** Safe path relative to the project root */
  path: string;
  /** Markdown file content */
  content: string;
}

/**
 * Formatter for Factory AI instructions.
 *
 * Factory AI uses AGENTS.md as its main configuration file and
 * .factory/skills/<name>/SKILL.md for reusable skills.
 *
 * Supports three versions:
 * - **simple**: Single `AGENTS.md` file
 * - **multifile**: AGENTS.md + `.factory/skills/<name>/SKILL.md` for each skill
 * - **full** (default): Multifile + additional supporting files for skills
 *
 * @example
 * ```yaml
 * targets:
 *   - factory  # uses full mode (default)
 *   - factory:
 *       version: multifile
 *   - factory:
 *       version: full
 * ```
 *
 * @see https://docs.factory.ai/cli/configuration
 */
export class FactoryFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'factory',
      outputPath: 'AGENTS.md',
      description: 'Factory AI AGENTS.md (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# AGENTS.md',
      dotDir: '.factory',
      skillFileName: 'SKILL.md',
      hasAgents: true,
      hasCommands: true,
      hasSkills: true,
      skillsInMultifile: true,
      sectionNames: {
        codeStandards: 'Conventions & Patterns',
        gitCommits: 'Git Workflows',
        configFiles: 'Configuration',
        postWork: 'Build & Test',
        restrictions: "Don'ts",
      },
      restrictionsTransform: (s: string) => s.replace(/^Never\s+/i, "Don't "),
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof FACTORY_VERSIONS {
    return FACTORY_VERSIONS;
  }

  override referencesMode(): 'directory' | 'inline' | 'none' {
    return 'directory';
  }

  protected override codeStandards(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const extracted = this.standardsExtractor.extract(standards.content);
    const subsections: string[] = [];

    for (const key of Object.keys(this.getProps(standards.content))) {
      const entry = extracted.codeStandards.get(key);
      if (!entry) continue;
      if (entry.items.length === 0) continue;

      subsections.push(renderer.renderSection(entry.title, renderer.renderList(entry.items), 2));
    }

    if (subsections.length === 0) return null;

    return (
      renderer.renderSection(this.getSectionName('codeStandards'), subsections.join('\n\n')) + '\n'
    );
  }

  override format(ast: Program, options?: FormatOptions): FormatterOutput {
    if (
      options?.version !== undefined &&
      !Object.prototype.hasOwnProperty.call(FACTORY_VERSIONS, options.version)
    ) {
      throw new Error(
        `Unsupported Factory version '${options.version}'. Expected 'simple', 'multifile', or 'full'.`
      );
    }

    const version = this.resolveVersion(options?.version);
    const configuredRulesMode: unknown = options?.targetConfig?.rulesMode;
    if (
      configuredRulesMode !== undefined &&
      configuredRulesMode !== 'monolith' &&
      configuredRulesMode !== 'split'
    ) {
      throw new Error(
        `Invalid Factory rulesMode '${String(configuredRulesMode)}'. Expected 'monolith' or 'split'.`
      );
    }
    const rulesMode = configuredRulesMode ?? 'monolith';

    if (rulesMode === 'split' && this.createRenderer(options).getConvention().name !== 'markdown') {
      throw new Error(
        "Factory rulesMode 'split' requires the Markdown convention. Change the Factory target convention or use rulesMode 'monolith'."
      );
    }

    if (rulesMode === 'split' && !this.isProjectRelativeOutputPath(this.getOutputPath(options))) {
      throw new Error(
        "Factory rulesMode 'split' requires a project-relative outputPath without parent traversal so AGENTS.md can link to generated rules."
      );
    }

    if (rulesMode === 'split' && version === 'simple') {
      throw new Error(
        "Factory rulesMode 'split' requires version 'multifile' or 'full'. Change the Factory target version or use rulesMode 'monolith'."
      );
    }

    const output = super.format(ast, options);
    return {
      ...output,
      managedOutputDirectories: ['.factory/rules'],
    };
  }

  // ============================================================
  // Command File Generation (Factory-specific)
  // ============================================================

  protected override extractCommands(ast: Program): FactoryCommandConfig[] {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return [];

    const commands: FactoryCommandConfig[] = [];
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
          const handoffs = this.extractHandoffs(obj['handoffs']);
          commands.push({
            name: name.replace(/^\/+/, ''),
            description: obj['description'] ? this.valueToString(obj['description']) : name,
            content: obj['content'] ? this.valueToString(obj['content']) : '',
            agent: obj['agent'] ? this.valueToString(obj['agent']) : undefined,
            handoffs: handoffs.length > 0 ? handoffs : undefined,
            tools:
              obj['tools'] && Array.isArray(obj['tools'])
                ? obj['tools'].map((t) => this.valueToString(t))
                : undefined,
          });
        }
      }
    }

    return commands;
  }

  protected override generateCommandFile(config: MarkdownCommandConfig): FormatterOutput {
    const factoryConfig = config as FactoryCommandConfig;
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`description: ${this.yamlString(factoryConfig.description)}`);
    if (factoryConfig.agent) {
      lines.push(`agent: ${factoryConfig.agent}`);
    }
    if (factoryConfig.tools && factoryConfig.tools.length > 0) {
      const toolsArray = factoryConfig.tools.map((t) => `'${t}'`).join(', ');
      lines.push(`tools: [${toolsArray}]`);
    }
    if (factoryConfig.handoffs && factoryConfig.handoffs.length > 0) {
      lines.push('handoffs: ');
      for (const handoff of factoryConfig.handoffs) {
        lines.push(`  - label: ${this.yamlString(handoff.label)}`);
        lines.push(`    agent: ${handoff.agent}`);
        if (handoff.prompt) {
          lines.push(`    prompt: ${this.yamlString(handoff.prompt)}`);
        }
        if (handoff.send) {
          lines.push('    send: true');
        }
      }
    }
    lines.push('---');
    lines.push('');

    if (factoryConfig.content) {
      const dedentedContent = this.dedent(factoryConfig.content);
      lines.push(dedentedContent);
    }

    return {
      path: `.factory/commands/${factoryConfig.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Skill File Generation (Factory-specific)
  // ============================================================

  protected override extractSkills(ast: Program, options?: FormatOptions): FactorySkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: FactorySkillConfig[] = [];
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
          userInvocable: obj['userInvocable'] !== false,
          disableModelInvocation: obj['disableModelInvocation'] === true,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          allowedTools:
            obj['allowedTools'] && Array.isArray(obj['allowedTools'])
              ? obj['allowedTools'].map((t) => this.valueToString(t))
              : undefined,
          resources:
            obj['resources'] && Array.isArray(obj['resources'])
              ? (obj['resources'] as Array<Record<string, Value>>).map((r) => ({
                  relativePath: r['relativePath'] as string,
                  content: r['content'] as string,
                }))
              : undefined,
          rawFrontmatter:
            typeof obj['__rawFrontmatter'] === 'string' ? obj['__rawFrontmatter'] : undefined,
          outputDir: typeof obj['__outputDir'] === 'string' ? obj['__outputDir'] : undefined,
        });
      }
    }

    return skills;
  }

  protected override generateSkillFile(
    config: MarkdownSkillConfig,
    options?: FormatOptions
  ): FormatterOutput {
    const factoryConfig = config as FactorySkillConfig;
    const lines: string[] = [];

    // Factory uses hyphens in skill names (e.g. speckit-plan, not speckit.plan)
    const skillName = factoryConfig.name.replace(/\./g, '-');

    // YAML frontmatter — filter raw frontmatter to only Factory-supported fields
    lines.push('---');
    if (factoryConfig.rawFrontmatter) {
      lines.push(...this.filterFactoryFrontmatter(factoryConfig.rawFrontmatter));
    } else {
      lines.push(`name: ${skillName}`);
      lines.push(`description: ${this.yamlString(factoryConfig.description)}`);
      if (factoryConfig.argumentHint) {
        lines.push(`argument-hint: ${this.yamlString(factoryConfig.argumentHint)}`);
      }

      // Only emit non-default values (user-invocable defaults to true)
      if (factoryConfig.userInvocable === false) {
        lines.push('user-invocable: false');
      }

      // Only emit non-default values (disable-model-invocation defaults to false)
      if (factoryConfig.disableModelInvocation === true) {
        lines.push('disable-model-invocation: true');
      }

      if (factoryConfig.allowedTools && factoryConfig.allowedTools.length > 0) {
        const toolsArray = factoryConfig.allowedTools.map((t) => `"${t}"`).join(', ');
        lines.push(`allowed-tools: [${toolsArray}]`);
      }
    }

    lines.push('---');
    lines.push('');

    if (factoryConfig.content) {
      // Skill content is a standalone file - preserve verbatim without Prettier normalization
      const dedentedContent = this.dedent(factoryConfig.content);
      lines.push(dedentedContent);
    }

    const skillDirPath = this.resolveSkillDir(
      '.factory/skills',
      factoryConfig.name,
      factoryConfig.outputDir,
      options
    );
    const resourceFiles = this.sanitizeResourceFiles(factoryConfig.resources, skillDirPath);

    const resourcesWithProvenance = resourceFiles.map((f) => {
      if (f.path.includes('/references/')) {
        return {
          ...f,
          content: `${this.referenceProvenance(f.path)}\n\n${f.content}`,
        };
      }
      return f;
    });

    return {
      path: `${skillDirPath}/SKILL.md`,
      content: lines.join('\n') + '\n',
      additionalFiles: resourcesWithProvenance.length > 0 ? resourcesWithProvenance : undefined,
    };
  }

  // ============================================================
  // Droid File Generation (Factory-specific)
  // ============================================================

  protected override extractAgents(ast: Program): FactoryDroidConfig[] {
    const agentsBlock = this.findBlock(ast, 'agents');
    if (!agentsBlock) return [];

    const droids: FactoryDroidConfig[] = [];
    const props = this.getProps(agentsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const description = obj['description'] ? this.valueToString(obj['description']) : '';
        if (!description) continue; // description is required

        droids.push({
          name: name.replace(/\./g, '-'),
          description,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          model: obj['model'] ? this.valueToString(obj['model']) : undefined,
          reasoningEffort: this.parseReasoningEffort(obj['reasoningEffort']),
          specModel: obj['specModel'] ? this.valueToString(obj['specModel']) : undefined,
          specReasoningEffort: this.parseReasoningEffort(obj['specReasoningEffort']),
          tools: this.parseDroidTools(obj['tools']),
        });
      }
    }

    return droids;
  }

  protected override generateAgentFile(config: MarkdownAgentConfig): FormatterOutput {
    const droidConfig = config as FactoryDroidConfig;
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${droidConfig.name}`);

    if (droidConfig.description) {
      lines.push(`description: ${this.yamlString(droidConfig.description)}`);
    }

    if (droidConfig.model) {
      lines.push(`model: ${droidConfig.model}`);
    }

    if (droidConfig.reasoningEffort) {
      lines.push(`reasoningEffort: ${droidConfig.reasoningEffort}`);
    }

    if (droidConfig.specModel) {
      lines.push(`specModel: ${droidConfig.specModel}`);
    }

    if (droidConfig.specReasoningEffort) {
      lines.push(`specReasoningEffort: ${droidConfig.specReasoningEffort}`);
    }

    if (droidConfig.tools) {
      if (typeof droidConfig.tools === 'string') {
        lines.push(`tools: ${droidConfig.tools}`);
      } else if (Array.isArray(droidConfig.tools) && droidConfig.tools.length > 0) {
        const toolsArray = droidConfig.tools.map((t) => `"${t}"`).join(', ');
        lines.push(`tools: [${toolsArray}]`);
      }
    }

    lines.push('---');
    lines.push('');

    if (droidConfig.content) {
      const dedentedContent = this.dedent(droidConfig.content);
      lines.push(dedentedContent);
    }

    return {
      path: `.factory/droids/${droidConfig.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Guard Skills Extraction (Factory-specific)
  // ============================================================

  /**
   * Extract FactorySkillConfig entries from @guards named entries that have applyTo arrays.
   * Skips unsafe names and names that collide with existing skill names.
   */
  private extractGuardSkills(ast: Program, existingSkillNames: Set<string>): FactorySkillConfig[] {
    const guardsBlock = this.findBlock(ast, 'guards');
    if (!guardsBlock) return [];

    const skills: FactorySkillConfig[] = [];
    const props = this.getProps(guardsBlock.content);

    for (const [rawName, value] of Object.entries(props)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;

      const obj = value as Record<string, Value>;

      // Only process named entries that have an applyTo array
      if (!obj['applyTo'] || !Array.isArray(obj['applyTo'])) continue;

      // Normalize dots to hyphens
      const name = rawName.replace(/\./g, '-');

      if (!this.isSafeSkillName(name)) continue;
      if (existingSkillNames.has(name)) continue;

      const applyTo = (obj['applyTo'] as Value[]).map((g) => this.valueToString(g));
      const baseDesc = obj['description'] ? this.valueToString(obj['description']) : name;
      const enrichedDesc =
        applyTo.length > 0 ? `${baseDesc} (applies to: ${applyTo.join(', ')})` : baseDesc;

      skills.push({
        name,
        description: enrichedDesc,
        userInvocable: true,
        disableModelInvocation: false,
        content: obj['content'] ? this.valueToString(obj['content']) : '',
      });
    }

    return skills;
  }

  /**
   * Extract guard skills unless guardsAsSkills is explicitly false.
   */
  private maybeExtractGuardSkills(
    ast: Program,
    regularSkills: FactorySkillConfig[],
    options: FormatOptions | undefined
  ): FactorySkillConfig[] {
    if (options?.targetConfig?.guardsAsSkills === false) return [];
    const existingNames = new Set(regularSkills.map((s) => s.name));
    return this.extractGuardSkills(ast, existingNames).filter((skill) =>
      this.shouldIncludeSkill(skill.name, options)
    );
  }

  /**
   * Append a "Path-specific Skills" listing section to sections when guard skills exist
   * and guardsSkillsListing is not explicitly false.
   */
  private maybeAddGuardSkillsListing(
    guardSkills: FactorySkillConfig[],
    sections: string[],
    options: FormatOptions | undefined
  ): void {
    if (guardSkills.length === 0) return;
    if (options?.targetConfig?.guardsSkillsListing === false) return;

    const lines = guardSkills.map((s) => `- **${s.name}**: ${s.description}`);
    sections.push(`## Path-specific Skills\n\n${lines.join('\n')}\n`);
  }

  // ============================================================
  // Always-on Rule File Generation (Factory-specific)
  // ============================================================

  /**
   * Generate deterministic always-on rule files in source property order.
   */
  private generateRuleFiles(ast: Program, options?: FormatOptions): FactoryRuleFile[] {
    if (options?.targetConfig?.rulesMode !== 'split') return [];

    const renderer = this.createRenderer(options);
    const files: FactoryRuleFile[] = [];
    const standards = this.findBlock(ast, 'standards');

    if (standards) {
      const usedSlugs = new Set<string>();
      for (const [topic, value] of Object.entries(this.getProps(standards.content))) {
        const items = this.extractRuleItems(value);
        if (items.length === 0) continue;

        const semantic = this.getSemanticRuleInfo(topic);
        const label = semantic?.label ?? this.humanizeRuleLabel(topic);
        const path =
          semantic?.path ??
          `.factory/rules/standards/${this.createStableRuleSlug(topic, usedSlugs)}.md`;
        const content = `# ${label}\n\n${renderer.renderList(items)}\n`;
        files.push({ label, path, content });
      }
    }

    const knowledge = this.knowledgeContent(ast, renderer);
    if (knowledge) {
      files.push({
        label: 'Knowledge',
        path: '.factory/rules/knowledge.md',
        content: `# Knowledge\n\n${knowledge.trim()}\n`,
      });
    }

    const restrictions = this.restrictions(ast, renderer);
    if (restrictions) {
      files.push({
        label: 'Restrictions',
        path: '.factory/rules/restrictions.md',
        content: this.promoteSectionHeading(restrictions, this.getSectionName('restrictions')),
      });
    }

    const examples = this.examples(ast, renderer);
    if (examples) {
      files.push({
        label: 'Examples',
        path: '.factory/rules/examples.md',
        content: this.promoteSectionHeading(examples, 'Examples'),
      });
    }

    return files;
  }

  private addSplitRulesIndex(
    sections: string[],
    ruleFiles: FactoryRuleFile[],
    options?: FormatOptions
  ): void {
    if (ruleFiles.length === 0) return;

    const outputPath = this.getOutputPath(options).replace(/\\/g, '/');
    const outputDirectory = posix.dirname(outputPath);
    const links = ruleFiles.map((rule) => {
      const relativePath = posix.relative(outputDirectory, rule.path);
      return `- [${rule.label}](${relativePath})`;
    });
    const intro =
      'Always-on rules live in `.factory/rules/`. Review the relevant rule file before editing related code:';
    sections.push(`## Rules\n\n${intro}\n\n${links.join('\n')}\n`);
  }

  private isProjectRelativeOutputPath(outputPath: string): boolean {
    const normalized = outputPath.replace(/\\/g, '/');
    return (
      normalized.length > 0 &&
      !posix.isAbsolute(normalized) &&
      !/^[a-z]:/i.test(normalized) &&
      !normalized.split('/').some((segment) => segment === '..')
    );
  }

  private addLeanSections(ast: Program, sections: string[], options?: FormatOptions): void {
    const renderer = this.createRenderer(options);
    this.addSection(sections, this.project(ast, renderer));
    this.addSection(sections, this.techStack(ast, renderer));
    this.addSection(sections, this.architecture(ast, renderer));
    this.addSection(sections, this.commands(ast, renderer));
    this.addSection(sections, this.postWork(ast, renderer));
  }

  private getSemanticRuleInfo(topic: string): { label: string; path: string } | undefined {
    const semanticRules: Record<string, { label: string; path: string }> = {
      git: { label: 'Git Workflows', path: '.factory/rules/git-workflows.md' },
      config: { label: 'Configuration', path: '.factory/rules/configuration.md' },
      documentation: { label: 'Documentation', path: '.factory/rules/documentation.md' },
      diagrams: { label: 'Diagrams', path: '.factory/rules/diagrams.md' },
    };
    return semanticRules[topic];
  }

  private extractRuleItems(value: Value): string[] {
    if (value === null || value === undefined || value === false) return [];
    if (Array.isArray(value)) {
      return value.map((item) => this.ruleValueToString(item)).filter((item) => item.length > 0);
    }
    if (typeof value === 'object' && !('type' in value)) {
      const items: string[] = [];
      for (const [key, nestedValue] of Object.entries(value as Record<string, Value>)) {
        if (nestedValue === null || nestedValue === undefined || nestedValue === false) continue;
        const label = this.humanizeRuleLabel(key);
        if (nestedValue === true) {
          items.push(label);
          continue;
        }
        const rendered = this.ruleValueToString(nestedValue);
        if (rendered) items.push(`${label}: ${rendered}`);
      }
      return items;
    }

    const rendered = this.ruleValueToString(value);
    return rendered ? [rendered] : [];
  }

  private ruleValueToString(value: Value): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value
        .map((item) => this.ruleValueToString(item))
        .filter((item) => item.length > 0)
        .join(', ');
    }
    if ('type' in value) {
      return this.valueToString(value);
    }
    return Object.entries(value as Record<string, Value>)
      .map(([key, nestedValue]) => {
        const rendered = this.ruleValueToString(nestedValue);
        return rendered ? `${this.humanizeRuleLabel(key)}: ${rendered}` : '';
      })
      .filter((item) => item.length > 0)
      .join(', ');
  }

  private humanizeRuleLabel(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private createStableRuleSlug(topic: string, usedSlugs: Set<string>): string {
    let base =
      topic
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'topic';

    if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(base)) {
      base = `rule-${base}`;
    }

    let slug = base;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(slug);
    return slug;
  }

  private promoteSectionHeading(section: string, label: string): string {
    const heading = `## ${label}`;
    const trimmed = section.trim();
    const content = trimmed.startsWith(heading)
      ? `# ${label}${trimmed.slice(heading.length)}`
      : `# ${label}\n\n${trimmed}`;
    return `${content}\n`;
  }

  // ============================================================
  // Multifile & Full Mode Overrides (adds guard skill extraction)
  // ============================================================

  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    if (this.config.hasCommands) {
      const commands = this.extractCommands(ast);
      for (const command of commands) {
        additionalFiles.push(this.generateCommandFile(command));
      }
    }

    const regularSkills: FactorySkillConfig[] = [];
    if (this.config.hasSkills && this.config.skillsInMultifile) {
      const skills = this.extractSkills(ast, options);
      for (const skill of skills) {
        additionalFiles.push(this.generateSkillFile(skill, options));
        regularSkills.push(skill as FactorySkillConfig);
      }
    }

    const guardSkills = this.maybeExtractGuardSkills(ast, regularSkills, options);
    for (const skill of guardSkills) {
      additionalFiles.push(this.generateSkillFile(skill, options));
    }

    const ruleFiles = this.generateRuleFiles(ast, options);
    additionalFiles.push(...ruleFiles);

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    if (options?.targetConfig?.rulesMode === 'split') {
      this.addLeanSections(ast, sections, options);
      this.addSplitRulesIndex(sections, ruleFiles, options);
    } else {
      this.addCommonSections(ast, renderer, sections);
    }
    this.maybeAddGuardSkillsListing(guardSkills, sections, options);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
      managedOutputDirectories: ['.factory/rules'],
    };
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    if (this.config.hasCommands) {
      const commands = this.extractCommands(ast);
      for (const command of commands) {
        additionalFiles.push(this.generateCommandFile(command));
      }
    }

    const regularSkills: FactorySkillConfig[] = [];
    if (this.config.hasSkills) {
      const skills = this.extractSkills(ast, options);
      for (const skill of skills) {
        additionalFiles.push(this.generateSkillFile(skill, options));
        regularSkills.push(skill as FactorySkillConfig);
      }
    }

    const guardSkills = this.maybeExtractGuardSkills(ast, regularSkills, options);
    for (const skill of guardSkills) {
      additionalFiles.push(this.generateSkillFile(skill, options));
    }

    if (this.config.hasAgents) {
      const agents = this.extractAgents(ast);
      for (const agent of agents) {
        additionalFiles.push(this.generateAgentFile(agent));
      }
    }

    const ruleFiles = this.generateRuleFiles(ast, options);
    additionalFiles.push(...ruleFiles);

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    if (options?.targetConfig?.rulesMode === 'split') {
      this.addLeanSections(ast, sections, options);
      this.addSplitRulesIndex(sections, ruleFiles, options);
    } else {
      this.addCommonSections(ast, renderer, sections);
    }
    this.maybeAddGuardSkillsListing(guardSkills, sections, options);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
      managedOutputDirectories: ['.factory/rules'],
    };
  }

  private parseReasoningEffort(value: Value | undefined): FactoryReasoningEffort | undefined {
    if (!value) return undefined;
    const str = this.valueToString(value);
    const valid: FactoryReasoningEffort[] = ['low', 'medium', 'high'];
    return valid.includes(str as FactoryReasoningEffort)
      ? (str as FactoryReasoningEffort)
      : undefined;
  }

  private parseDroidTools(value: Value | undefined): string | string[] | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      const arr = value.map((v) => this.valueToString(v)).filter((s) => s.length > 0);
      return arr.length > 0 ? arr : undefined;
    }
    return this.valueToString(value);
  }

  // ============================================================
  // Handoff Extraction (Factory-specific)
  // ============================================================

  private extractHandoffs(value: Value | undefined): FactoryHandoff[] {
    if (!value || !Array.isArray(value)) return [];

    const handoffs: FactoryHandoff[] = [];
    for (const item of value) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const obj = item as Record<string, Value>;
        const label = obj['label'] ? this.valueToString(obj['label']) : '';
        const agent = obj['agent'] ? this.valueToString(obj['agent']) : '';
        const prompt = obj['prompt'] ? this.valueToString(obj['prompt']) : '';

        if (label && agent) {
          handoffs.push({
            label,
            agent,
            prompt,
            send: obj['send'] === true ? true : undefined,
          });
        }
      }
    }

    return handoffs;
  }

  // ============================================================
  // Frontmatter Filtering (Factory-specific)
  // ============================================================

  /**
   * Factory AI supported frontmatter fields for skills.
   * Fields not in this set are stripped to avoid parsing failures.
   *
   * @see https://docs.factory.ai/cli/configuration/skills
   */
  private static readonly FACTORY_SKILL_FRONTMATTER_FIELDS = new Set([
    'name',
    'description',
    'user-invocable',
    'disable-model-invocation',
  ]);

  /**
   * Filter raw YAML frontmatter to only include fields that Factory AI
   * recognizes in skill SKILL.md files. Strips unsupported fields like
   * `license`, `metadata`, `compatibility`, `allowed-tools`, and comments,
   * which cause Factory to fail to load the skill.
   *
   * @param rawFrontmatter - Raw YAML frontmatter string (between --- markers)
   * @returns Array of filtered frontmatter lines
   */
  private filterFactoryFrontmatter(rawFrontmatter: string): string[] {
    const lines = rawFrontmatter.split('\n');
    const filtered: string[] = [];
    let skipBlock = false;
    let blockIndent = -1;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comment lines
      if (trimmed.startsWith('#')) continue;

      // Skip empty lines within skipped blocks
      if (skipBlock) {
        if (trimmed === '') {
          // Empty line might end a block — reset skip state and continue
          skipBlock = false;
          blockIndent = -1;
          continue;
        }
        // Check if still inside a nested block (more indented than the skipped key)
        const currentIndent = line.length - line.trimStart().length;
        if (currentIndent > blockIndent) continue;
        // Back at same/lower indent — no longer in skipped block
        skipBlock = false;
        blockIndent = -1;
      }

      if (trimmed === '') continue;

      // Detect key at this line
      const keyMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*):/);
      if (keyMatch) {
        const key = keyMatch[1]!;
        const indent = line.length - line.trimStart().length;

        if (!FactoryFormatter.FACTORY_SKILL_FRONTMATTER_FIELDS.has(key)) {
          // Skip this key and its nested block
          skipBlock = true;
          blockIndent = indent;
          continue;
        }
      }

      filtered.push(line);
    }

    return filtered;
  }

  /**
   * Filter the frontmatter of an externally-supplied SKILL.md file (such as
   * the bundled PromptScript skill injected by the compiler) so it only
   * contains fields Factory AI recognises. The body is preserved verbatim.
   * Files without a YAML frontmatter block are returned unchanged.
   */
  override transformInjectedSkillContent(content: string): string {
    if (!content.startsWith('---')) return content;

    const closing = content.indexOf('\n---', 3);
    if (closing === -1) return content;

    const rawFrontmatter = content.slice(4, closing);
    const body = content.slice(closing + 4); // skip closing ---
    const filteredLines = this.filterFactoryFrontmatter(rawFrontmatter);
    const filteredFrontmatter = filteredLines.join('\n');

    return `---\n${filteredFrontmatter}\n---${body}`;
  }
}
