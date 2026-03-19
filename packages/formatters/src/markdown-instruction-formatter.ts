import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from './base-formatter.js';
import type { ConventionRenderer } from './convention-renderer.js';
import type { FormatOptions, FormatterOutput } from './types.js';

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
  /** Skill content/instructions */
  content: string;
  /** Resource files to copy alongside the skill file */
  resources?: Array<{ relativePath: string; content: string }>;
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
  | 'codeStandards'
  | 'gitCommits'
  | 'configFiles'
  | 'postWork'
  | 'restrictions';

/**
 * Default section names used by most markdown formatters.
 */
const DEFAULT_SECTION_NAMES: Record<SectionNameKey, string> = {
  codeStandards: 'Code Style',
  gitCommits: 'Git Commits',
  configFiles: 'Config Files',
  postWork: 'Post-Work Verification',
  restrictions: 'Restrictions',
};

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
    return `${this.config.dotDir}/skills`;
  }

  override getSkillFileName(): string | null {
    return this.config.skillFileName;
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
      const skills = this.extractSkills(ast);
      for (const skill of skills) {
        additionalFiles.push(this.generateSkillFile(skill));
      }
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
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
      const skills = this.extractSkills(ast);
      for (const skill of skills) {
        additionalFiles.push(this.generateSkillFile(skill));
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
    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    this.addCommonSections(ast, renderer, sections);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  // ============================================================
  // Section Name Resolution
  // ============================================================

  protected getSectionName(key: SectionNameKey): string {
    return this.config.sectionNames?.[key] ?? DEFAULT_SECTION_NAMES[key];
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

  protected extractSkills(ast: Program): MarkdownSkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: MarkdownSkillConfig[] = [];
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

  protected generateSkillFile(config: MarkdownSkillConfig): FormatterOutput {
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

    const skillDirPath = `${this.config.dotDir}/skills/${config.name}`;
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
    this.addSection(sections, this.codeStandards(ast, renderer));
    this.addSection(sections, this.gitCommits(ast, renderer));
    this.addSection(sections, this.configFiles(ast, renderer));
    this.addSection(sections, this.commands(ast, renderer));
    this.addSection(sections, this.postWork(ast, renderer));
    this.addSection(sections, this.documentation(ast, renderer));
    this.addSection(sections, this.diagrams(ast, renderer));
    this.addSection(sections, this.knowledgeContent(ast, renderer));
    this.addSection(sections, this.restrictions(ast, renderer));
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
      if (context?.content.type === 'MixedContent' && context.content.text) {
        text = context.content.text.value.trim();
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
    return renderer.renderSection('Project', normalizedText) + '\n';
  }

  protected techStack(ast: Program, renderer: ConventionRenderer): string | null {
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

  protected extractTechStackFromContext(context: ReturnType<typeof this.findBlock>): string[] {
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
    if (!archMatch) return null;

    const content = archMatch.replace('## Architecture', '');
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return renderer.renderSection('Architecture', normalizedContent.trim()) + '\n';
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
    return renderer.renderSection(this.getSectionName('codeStandards'), content) + '\n';
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

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection(this.getSectionName('gitCommits'), content) + '\n';
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

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection(this.getSectionName('configFiles'), content) + '\n';
  }

  protected commands(ast: Program, renderer: ConventionRenderer): string | null {
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

  protected postWork(ast: Program, renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const match = this.extractSectionWithCodeBlock(text, '## Post-Work Verification');
    if (!match) return null;

    const content = match.replace('## Post-Work Verification', '');
    const normalizedContent = this.normalizeMarkdownForPrettier(content);
    return renderer.renderSection(this.getSectionName('postWork'), normalizedContent.trim()) + '\n';
  }

  protected documentation(ast: Program, renderer: ConventionRenderer): string | null {
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

    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection('Diagrams', content) + '\n';
  }

  /**
   * Render remaining @knowledge text content that isn't consumed by other sections.
   * Strips "## Development Commands" and "## Post-Work Verification" sub-sections
   * since those are already rendered by commands() and postWork().
   */
  protected knowledgeContent(ast: Program, _renderer: ConventionRenderer): string | null {
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
    return normalizedContent + '\n';
  }

  protected restrictions(ast: Program, renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractRestrictionsItems(block.content);
    if (items.length === 0) return null;
    const content = renderer.renderList(items);
    return renderer.renderSection(this.getSectionName('restrictions'), content) + '\n';
  }

  protected extractRestrictionsItems(content: Block['content']): string[] {
    if (content.type === 'ArrayContent') {
      return content.elements.map((item: Value) =>
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
