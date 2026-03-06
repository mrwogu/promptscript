import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { ConventionRenderer } from '../convention-renderer.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

/**
 * Supported Gemini format versions.
 */
export type GeminiVersion = 'simple' | 'multifile' | 'full';

/**
 * Gemini formatter version information.
 */
export const GEMINI_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single GEMINI.md file',
    outputPath: 'GEMINI.md',
  },
  multifile: {
    name: 'multifile',
    description: 'GEMINI.md + .gemini/commands/<name>.toml + .gemini/skills/<name>/skill.md',
    outputPath: 'GEMINI.md',
  },
  full: {
    name: 'full',
    description: 'Multifile (Gemini has no agent concept, equivalent to multifile)',
    outputPath: 'GEMINI.md',
  },
} as const;

/**
 * Configuration for a Gemini command file.
 */
interface GeminiCommandConfig {
  /** Command name (without leading slash) */
  name: string;
  /** Description */
  description: string;
  /** Command prompt/instruction content */
  content: string;
}

/**
 * Configuration for a Gemini skill.
 */
interface GeminiSkillConfig {
  /** Skill name */
  name: string;
  /** Description */
  description: string;
  /** Skill content/instructions */
  content: string;
  /** Resource files to copy alongside skill.md */
  resources?: Array<{ relativePath: string; content: string }>;
}

/**
 * Formatter for Gemini CLI instructions.
 *
 * Gemini uses GEMINI.md as its main configuration file,
 * .gemini/commands/<name>.toml for commands (TOML format),
 * and .gemini/skills/<name>/skill.md for skills (lowercase).
 *
 * Gemini has no agent concept.
 *
 * Supports two versions:
 * - **simple** (default): Single `GEMINI.md` file
 * - **multifile**: GEMINI.md + commands (TOML) + skills
 *
 * @example
 * ```yaml
 * targets:
 *   - gemini  # uses simple mode
 *   - gemini:
 *       version: multifile
 * ```
 */
export class GeminiFormatter extends BaseFormatter {
  readonly name = 'gemini';
  readonly outputPath = 'GEMINI.md';
  readonly description = 'Gemini CLI instructions (Markdown + TOML)';
  readonly defaultConvention = 'markdown';

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof GEMINI_VERSIONS {
    return GEMINI_VERSIONS;
  }

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const version = this.resolveVersion(options?.version);

    if (version === 'multifile' || version === 'full') {
      return this.formatMultifile(ast, options);
    }

    return this.formatSimple(ast, options);
  }

  /**
   * Resolve version string to GeminiVersion.
   */
  private resolveVersion(version?: string): GeminiVersion {
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
      sections.push('# GEMINI.md\n');
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

    // Generate command files (TOML format)
    const commands = this.extractCommands(ast);
    for (const command of commands) {
      additionalFiles.push(this.generateCommandFile(command));
    }

    // Generate skill files
    const skills = this.extractSkills(ast);
    for (const skill of skills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push('# GEMINI.md\n');
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Command File Generation (TOML)
  // ============================================================

  /**
   * Extract command configurations from @shortcuts block.
   * Commands are shortcuts with `prompt: true` or multiline `content`.
   */
  private extractCommands(ast: Program): GeminiCommandConfig[] {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return [];

    const commands: GeminiCommandConfig[] = [];
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
   * Generate a .gemini/commands/<name>.toml file.
   * Uses TOML format: description = "..." and prompt = \"""...\"""
   */
  private generateCommandFile(config: GeminiCommandConfig): FormatterOutput {
    const lines: string[] = [];

    // Escape double quotes in description for TOML
    const escapedDescription = config.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`description = "${escapedDescription}"`);

    if (config.content) {
      const dedentedContent = this.dedent(config.content);
      lines.push(`prompt = """\n${dedentedContent}\n"""`);
    }

    return {
      path: `.gemini/commands/${config.name}.toml`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Skill File Generation
  // ============================================================

  /**
   * Extract skill configurations from @skills block.
   */
  private extractSkills(ast: Program): GeminiSkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: GeminiSkillConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!this.isSafeSkillName(name)) continue;
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
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
   * Generate a .gemini/skills/<name>/skill.md file (lowercase!).
   */
  private generateSkillFile(config: GeminiSkillConfig): FormatterOutput {
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${config.name}`);
    lines.push(`description: ${this.yamlString(config.description)}`);
    lines.push('---');
    lines.push('');

    if (config.content) {
      const dedentedContent = this.dedent(config.content);
      lines.push(dedentedContent);
    }

    const skillDirPath = `.gemini/skills/${config.name}`;
    const resourceFiles = this.sanitizeResourceFiles(config.resources, skillDirPath);

    return {
      path: `${skillDirPath}/skill.md`,
      content: lines.join('\n') + '\n',
      additionalFiles: resourceFiles.length > 0 ? resourceFiles : undefined,
    };
  }

  // ============================================================
  // YAML Helpers
  // ============================================================

  /**
   * Format a string for YAML output.
   */
  private yamlString(value: string): string {
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

  private restrictions(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractRestrictionsItems(block.content);
    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Restrictions', content) + '\n';
  }

  private extractRestrictionsItems(content: Block['content']): string[] {
    if (content.type === 'ArrayContent') {
      return content.elements.map((item: Value) => this.valueToString(item));
    }

    if (content.type === 'TextContent') {
      return content.value
        .trim()
        .split('\n')
        .map((line: string) => line.trim().replace(/^-\s*/, ''))
        .filter((line: string) => line.length > 0);
    }

    if (content.type === 'ObjectContent') {
      const itemsArray = this.getProp(content, 'items');
      if (Array.isArray(itemsArray)) {
        return itemsArray.map((item: unknown) => this.valueToString(item as Value));
      }
    }

    return [];
  }
}
