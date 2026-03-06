import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { ConventionRenderer } from '../convention-renderer.js';
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
    description: 'Multifile + additional skill supporting files',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Configuration for a Factory AI command.
 */
interface FactoryCommandConfig {
  /** Command name (stripped of leading slashes) */
  name: string;
  /** Description of the command */
  description: string;
  /** Command prompt/instruction content */
  content: string;
  /** Agent to execute the command */
  agent?: string;
  /** Handoff definitions for multi-agent workflows */
  handoffs?: FactoryHandoff[];
  /** Allowed tools for this command */
  tools?: string[];
}

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
 * Configuration for a Factory AI skill.
 */
interface FactorySkillConfig {
  /** Skill name (lowercase, hyphens) */
  name: string;
  /** Description of when to use the skill */
  description: string;
  /** Whether user can invoke via slash command */
  userInvocable: boolean;
  /** Whether to disable automatic AI invocation */
  disableModelInvocation: boolean;
  /** Skill content/instructions */
  content: string;
  /** Allowed tools */
  allowedTools?: string[];
  /** Resource files to copy alongside SKILL.md */
  resources?: Array<{ relativePath: string; content: string }>;
}

/**
 * Formatter for Factory AI (droid) instructions.
 *
 * Factory AI uses AGENTS.md as its main configuration file and
 * .factory/skills/<name>/SKILL.md for reusable skills.
 *
 * Supports three versions:
 * - **simple** (default): Single `AGENTS.md` file
 * - **multifile**: AGENTS.md + `.factory/skills/<name>/SKILL.md` for each skill
 * - **full**: Multifile + additional supporting files for skills
 *
 * @example
 * ```yaml
 * targets:
 *   - factory  # uses simple mode
 *   - factory:
 *       version: multifile
 *   - factory:
 *       version: full
 * ```
 *
 * @see https://docs.factory.ai/cli/configuration
 */
export class FactoryFormatter extends BaseFormatter {
  readonly name = 'factory';
  readonly outputPath = 'AGENTS.md';
  readonly description = 'Factory AI AGENTS.md (Markdown)';
  readonly defaultConvention = 'markdown';

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof FACTORY_VERSIONS {
    return FACTORY_VERSIONS;
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
   * Resolve version string to FactoryVersion.
   */
  private resolveVersion(version?: string): FactoryVersion {
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
      sections.push('# AGENTS.md\n');
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

    // Generate skill files
    const skills = this.extractSkills(ast);
    for (const skill of skills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Generate command files
    const commands = this.extractCommands(ast);
    for (const command of commands) {
      additionalFiles.push(this.generateCommandFile(command));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push('# AGENTS.md\n');
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

    // Generate skill files
    const skills = this.extractSkills(ast);
    for (const skill of skills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Generate command files
    const commands = this.extractCommands(ast);
    for (const command of commands) {
      additionalFiles.push(this.generateCommandFile(command));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push('# AGENTS.md\n');
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Skill File Generation
  // ============================================================

  /**
   * Extract skill configurations from @skills block.
   */
  private extractSkills(ast: Program): FactorySkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: FactorySkillConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!this.isSafeSkillName(name)) continue;
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
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
        });
      }
    }

    return skills;
  }

  /**
   * Generate a .factory/skills/<name>/SKILL.md file.
   */
  private generateSkillFile(config: FactorySkillConfig): FormatterOutput {
    const lines: string[] = [];

    // Factory uses hyphens in skill names (e.g. speckit-plan, not speckit.plan)
    const skillName = config.name.replace(/\./g, '-');

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${skillName}`);
    lines.push(`description: ${this.yamlString(config.description)}`);
    lines.push('---');
    lines.push('');

    if (config.content) {
      // Skill content is a standalone file - preserve verbatim without Prettier normalization
      const dedentedContent = this.dedent(config.content);
      lines.push(dedentedContent);
    }

    const skillDirPath = `.factory/skills/${config.name}`;
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
   * A shortcut becomes a command file when it has `prompt: true` or multiline `content`.
   */
  private extractCommands(ast: Program): FactoryCommandConfig[] {
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

  /**
   * Extract handoff definitions from a handoffs value.
   */
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

  /**
   * Generate a .factory/commands/<name>.md file.
   */
  private generateCommandFile(config: FactoryCommandConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`description: ${this.yamlString(config.description)}`);
    if (config.agent) {
      lines.push(`agent: ${config.agent}`);
    }
    if (config.tools && config.tools.length > 0) {
      const toolsArray = config.tools.map((t) => `'${t}'`).join(', ');
      lines.push(`tools: [${toolsArray}]`);
    }
    if (config.handoffs && config.handoffs.length > 0) {
      lines.push('handoffs: ');
      for (const handoff of config.handoffs) {
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

    if (config.content) {
      // Command content is a standalone file - preserve it verbatim without
      // Prettier normalization (no asterisk escaping, no extra blank lines)
      const dedentedContent = this.dedent(config.content);
      lines.push(dedentedContent);
    }

    return {
      path: `.factory/commands/${config.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // YAML Helpers
  // ============================================================

  /**
   * Format a string for YAML output.
   * Uses unquoted style when safe, otherwise quotes with appropriate style.
   */
  private yamlString(value: string): string {
    // In YAML block context, most characters are safe. Quote only when necessary:
    // - starts with indicator char ({, [, *, &, !, |, >, ', ", %, @, `)
    // - contains ': ' (colon-space = mapping)
    // - contains ' #' (space-hash = comment)
    // - is a YAML reserved word
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

    // Use double quotes if contains apostrophe, single quotes otherwise
    if (value.includes("'")) {
      // Escape backslashes and double quotes inside double-quoted YAML strings
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    return `'${value}'`;
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
    this.addSection(sections, this.restrictions(ast, renderer));
  }

  private addSection(sections: string[], content: string | null): void {
    if (content) sections.push(content);
  }

  private project(ast: Program, renderer: ConventionRenderer): string | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const text = this.extractText(identity.content);
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

    const content = archMatch.replace('## Architecture', '');
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return renderer.renderSection('Architecture', normalizedContent.trim()) + '\n';
  }

  private codeStandards(ast: Program, renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const extracted = this.standardsExtractor.extract(standards.content);
    const items: string[] = [];

    for (const entry of extracted.codeStandards.values()) {
      items.push(...entry.items);
    }

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Conventions & Patterns', content) + '\n';
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
    return renderer.renderSection('Git Workflows', content) + '\n';
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
    return renderer.renderSection('Configuration', content) + '\n';
  }

  private commands(ast: Program, renderer: ConventionRenderer): string | null {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    const knowledge = this.findBlock(ast, 'knowledge');

    const commandLines: string[] = [];

    if (shortcuts) {
      const props = this.getProps(shortcuts.content);
      for (const [cmd, desc] of Object.entries(props)) {
        const shortDesc = this.valueToString(desc).split('\n')[0] ?? '';
        commandLines.push(`${cmd.padEnd(10)} - ${shortDesc}`.trimEnd());
      }
    }

    if (commandLines.length === 0) return null;

    let content = renderer.renderCodeBlock(commandLines.join('\n'));

    if (knowledge) {
      const text = this.extractText(knowledge.content);
      const match = this.extractSectionWithCodeBlock(text, '## Development Commands');
      if (match) {
        const devCmds = match.replace('## Development Commands', '');
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

    const content = match.replace('## Post-Work Verification', '');
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return renderer.renderSection('Build & Test', normalizedContent.trim()) + '\n';
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

  private restrictions(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractRestrictionsItems(block.content);
    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection("Don'ts", content) + '\n';
  }

  private extractRestrictionsItems(content: Block['content']): string[] {
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
