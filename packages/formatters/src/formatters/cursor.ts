import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

/**
 * Supported Cursor format versions.
 */
export type CursorVersion = 'modern' | 'legacy' | 'multifile' | 'frontmatter';

/**
 * Cursor formatter version information.
 */
export const CURSOR_VERSIONS = {
  modern: {
    name: 'modern',
    description: 'MDC format with YAML frontmatter (.cursor/rules/project.mdc)',
    outputPath: '.cursor/rules/project.mdc',
    cursorVersion: '0.45+',
    introduced: '2024-12',
  },
  frontmatter: {
    name: 'frontmatter',
    description: 'Alias for modern format (MDC with YAML frontmatter)',
    outputPath: '.cursor/rules/project.mdc',
    cursorVersion: '0.45+',
    introduced: '2024-12',
  },
  multifile: {
    name: 'multifile',
    description: 'Multiple MDC files with glob-based targeting',
    outputPath: '.cursor/rules/project.mdc',
    cursorVersion: '0.45+',
    introduced: '2024-12',
  },
  legacy: {
    name: 'legacy',
    description: 'Plain text format (.cursorrules) - DEPRECATED',
    outputPath: '.cursorrules',
    cursorVersion: '< 0.45',
    deprecated: true,
    deprecatedSince: '2024-12',
  },
} as const;

/**
 * Configuration for glob-based rule files.
 */
interface GlobConfig {
  /** Name used for the output file */
  name: string;
  /** Glob patterns to match */
  patterns: string[];
  /** Description for frontmatter */
  description: string;
}

/**
 * Formatter for Cursor rules.
 *
 * Supports two versions:
 * - **modern** (default): `.cursor/rules/project.mdc` with YAML frontmatter
 * - **legacy**: `.cursorrules` plain text (deprecated)
 *
 * @example
 * ```yaml
 * # Modern format (default)
 * targets:
 *   - cursor
 *
 * # Legacy format for older Cursor versions
 * targets:
 *   - cursor:
 *       version: legacy
 * ```
 *
 * @see https://cursor.com/docs/context/rules
 */
export class CursorFormatter extends BaseFormatter {
  readonly name = 'cursor';
  readonly outputPath = CURSOR_VERSIONS.modern.outputPath;
  readonly description = 'Cursor rules (MDC with frontmatter)';
  readonly defaultConvention = 'markdown';

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof CURSOR_VERSIONS {
    return CURSOR_VERSIONS;
  }

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    // Validate convention - Cursor only supports markdown
    const convention = options?.convention ?? this.defaultConvention;
    if (convention !== 'markdown') {
      const conventionName = typeof convention === 'string' ? convention : 'custom';
      throw new Error(
        `Cursor formatter does not support '${conventionName}' convention. ` +
          `Only 'markdown' convention is supported for Cursor targets.`
      );
    }

    const version = this.resolveVersion(options?.version);

    if (version === 'legacy') {
      return this.formatLegacy(ast, options);
    }

    if (version === 'multifile') {
      return this.formatMultifile(ast, options);
    }

    return this.formatModern(ast, options);
  }

  /**
   * Resolve version string to CursorVersion.
   */
  private resolveVersion(version?: string): CursorVersion {
    if (version === 'legacy') {
      return 'legacy';
    }
    if (version === 'multifile') {
      return 'multifile';
    }
    if (version === 'frontmatter') {
      return 'modern';
    }
    return 'modern';
  }

  /**
   * Format for modern Cursor (0.45+) with MDC frontmatter.
   */
  private formatModern(ast: Program, options?: FormatOptions): FormatterOutput {
    const sections: string[] = [];

    // Add YAML frontmatter
    const frontmatter = this.frontmatter(ast);
    sections.push(frontmatter);

    this.addCommonSections(ast, sections);

    return {
      path: options?.outputPath ?? CURSOR_VERSIONS.modern.outputPath,
      content: sections.join('\n\n') + '\n',
    };
  }

  /**
   * Format for legacy Cursor (< 0.45) with plain .cursorrules.
   * @deprecated Use modern format for Cursor 0.45+
   */
  private formatLegacy(ast: Program, options?: FormatOptions): FormatterOutput {
    const sections: string[] = [];

    // No frontmatter for legacy format
    this.addCommonSections(ast, sections);

    return {
      path: options?.outputPath ?? CURSOR_VERSIONS.legacy.outputPath,
      content: sections.join('\n\n') + '\n',
    };
  }

  /**
   * Format for multifile Cursor with glob-based targeting.
   * Generates separate .mdc files for different glob patterns.
   */
  private formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const additionalFiles: FormatterOutput[] = [];

    // Extract globs from @guards block
    const globs = this.extractGlobs(ast);

    // Generate glob-specific rule files
    for (const globConfig of globs) {
      const globFile = this.generateGlobFile(ast, globConfig);
      if (globFile) {
        additionalFiles.push(globFile);
      }
    }

    // Generate shortcuts/commands file if shortcuts exist
    const shortcutsFile = this.generateShortcutsFile(ast);
    if (shortcutsFile) {
      additionalFiles.push(shortcutsFile);
    }

    // Main file with alwaysApply: true for core rules
    const mainSections: string[] = [];
    mainSections.push(this.frontmatter(ast));
    mainSections.push(this.intro(ast));

    const techStack = this.techStack(ast);
    if (techStack) mainSections.push(techStack);

    const architecture = this.architecture(ast);
    if (architecture) mainSections.push(architecture);

    const codeStyle = this.codeStyle(ast);
    if (codeStyle) mainSections.push(codeStyle);

    const gitCommits = this.gitCommits(ast);
    if (gitCommits) mainSections.push(gitCommits);

    const configFiles = this.configFiles(ast);
    if (configFiles) mainSections.push(configFiles);

    const postWork = this.postWork(ast);
    if (postWork) mainSections.push(postWork);

    const documentation = this.documentation(ast);
    if (documentation) mainSections.push(documentation);

    const diagrams = this.diagrams(ast);
    if (diagrams) mainSections.push(diagrams);

    const never = this.never(ast);
    if (never) mainSections.push(never);

    return {
      path: options?.outputPath ?? CURSOR_VERSIONS.modern.outputPath,
      content: mainSections.join('\n\n') + '\n',
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  /**
   * Extract glob patterns from @guards block.
   */
  private extractGlobs(ast: Program): GlobConfig[] {
    const guards = this.findBlock(ast, 'guards');
    if (!guards) return [];

    const globs: GlobConfig[] = [];
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
      const otherPatterns = globPatterns.filter(
        (p) => typeof p === 'string' && !tsPatterns.includes(p) && !testPatterns.includes(p)
      );

      if (tsPatterns.length > 0) {
        globs.push({
          name: 'typescript',
          patterns: tsPatterns as string[],
          description: 'TypeScript-specific rules',
        });
      }

      if (testPatterns.length > 0) {
        globs.push({
          name: 'testing',
          patterns: testPatterns as string[],
          description: 'Testing-specific rules',
        });
      }

      if (otherPatterns.length > 0) {
        globs.push({
          name: 'files',
          patterns: otherPatterns as string[],
          description: 'File-specific rules',
        });
      }
    }

    return globs;
  }

  /**
   * Generate a glob-specific rule file.
   */
  private generateGlobFile(ast: Program, config: GlobConfig): FormatterOutput | null {
    const sections: string[] = [];

    // Frontmatter with globs
    const fm = [
      '---',
      `description: "${config.description}"`,
      `globs:`,
      ...config.patterns.map((p) => `  - "${p}"`),
      '---',
    ];
    sections.push(fm.join('\n'));

    // Add relevant content based on file type
    if (config.name === 'typescript') {
      const codeStyle = this.codeStyle(ast);
      if (codeStyle) sections.push(codeStyle);
    }

    if (config.name === 'testing') {
      sections.push('## Testing Guidelines');
      sections.push('Follow project testing conventions and patterns.');
    }

    // Only return if we have content beyond frontmatter
    if (sections.length <= 1) return null;

    return {
      path: `.cursor/rules/${config.name}.mdc`,
      content: sections.join('\n\n') + '\n',
    };
  }

  /**
   * Generate shortcuts/commands file for manual activation.
   */
  private generateShortcutsFile(ast: Program): FormatterOutput | null {
    const block = this.findBlock(ast, 'shortcuts');
    if (!block) return null;

    const props = this.getProps(block.content);
    if (Object.keys(props).length === 0) return null;

    const sections: string[] = [];

    // Frontmatter for manual activation (via @mention)
    sections.push(
      ['---', 'description: "Project shortcuts and commands"', 'alwaysApply: false', '---'].join(
        '\n'
      )
    );

    const lines: string[] = ['## Commands'];
    for (const [cmd, desc] of Object.entries(props)) {
      const descStr = this.valueToString(desc);
      if (typeof desc === 'object' && !Array.isArray(desc)) {
        // Complex shortcut with steps
        const descObj = desc as Record<string, Value>;
        lines.push(`\n### ${cmd}`);
        if (descObj['description']) {
          lines.push(this.valueToString(descObj['description']));
        }
        if (Array.isArray(descObj['steps'])) {
          lines.push('\n**Steps:**');
          descObj['steps'].forEach((step, i) => {
            lines.push(`${i + 1}. ${this.valueToString(step)}`);
          });
        }
      } else {
        lines.push(`- **${cmd}**: ${descStr.split('\n')[0]}`);
      }
    }
    sections.push(lines.join('\n'));

    return {
      path: '.cursor/rules/shortcuts.mdc',
      content: sections.join('\n\n') + '\n',
    };
  }

  /**
   * Add common sections shared between modern and legacy formats.
   */
  private addCommonSections(ast: Program, sections: string[]): void {
    const intro = this.intro(ast);
    if (intro) sections.push(intro);

    const techStack = this.techStack(ast);
    if (techStack) sections.push(techStack);

    const architecture = this.architecture(ast);
    if (architecture) sections.push(architecture);

    const codeStyle = this.codeStyle(ast);
    if (codeStyle) sections.push(codeStyle);

    const gitCommits = this.gitCommits(ast);
    if (gitCommits) sections.push(gitCommits);

    const configFiles = this.configFiles(ast);
    if (configFiles) sections.push(configFiles);

    const commands = this.commands(ast);
    if (commands) sections.push(commands);

    const devCommands = this.devCommands(ast);
    if (devCommands) sections.push(devCommands);

    const postWork = this.postWork(ast);
    if (postWork) sections.push(postWork);

    const documentation = this.documentation(ast);
    if (documentation) sections.push(documentation);

    const diagrams = this.diagrams(ast);
    if (diagrams) sections.push(diagrams);

    const never = this.never(ast);
    if (never) sections.push(never);
  }

  private intro(ast: Program): string {
    const projectInfo = this.extractProjectInfo(ast);

    // If project text starts with "You are", use it directly
    if (projectInfo.text.toLowerCase().startsWith('you are')) {
      return projectInfo.text;
    }

    const orgSuffix = projectInfo.org ? ` at ${projectInfo.org}` : '';
    return `You are working on ${projectInfo.text}${orgSuffix}.`;
  }

  /**
   * Generate YAML frontmatter for Cursor MDC format.
   * @see https://cursor.com/docs/context/rules
   */
  private frontmatter(ast: Program): string {
    const description = this.extractProjectDescription(ast);
    const lines = ['---', `description: "${description}"`, 'alwaysApply: true', '---'];
    return lines.join('\n');
  }

  private extractProjectDescription(ast: Program): string {
    // Try to get project name from meta
    const name = this.getMetaField(ast, 'name');
    if (name) {
      return `Project rules for ${name}`;
    }

    // Try to extract from context.project
    const context = this.findBlock(ast, 'context');
    if (context) {
      const projectText = this.getProp(context.content, 'project');
      if (projectText && typeof projectText === 'string') {
        // Extract project name from description (first noun/name)
        const regex = /working on\s+(\w+)/i;
        const match = regex.exec(projectText);
        if (match) {
          return `Project rules for ${match[1]}`;
        }
      }
    }

    return 'Project-specific rules';
  }

  private extractProjectInfo(ast: Program): { text: string; org: string | null } {
    const org = this.getMetaField(ast, 'org') ?? null;

    // Try context.project first (new structure)
    const context = this.findBlock(ast, 'context');
    if (context) {
      const projectText = this.getProp(context.content, 'project');
      if (projectText && typeof projectText === 'string') {
        return { text: projectText.trim(), org };
      }
    }

    // Fall back to identity block
    const identity = this.findBlock(ast, 'identity');
    if (identity) {
      const text = this.extractText(identity.content);
      const firstLine = text.split('\n')[0]?.trim();
      if (firstLine) {
        return { text: firstLine, org };
      }
    }

    return { text: 'the project', org };
  }

  private techStack(ast: Program): string | null {
    const items = this.extractTechStackItems(ast);
    return items.length > 0 ? `Tech stack: ${items.join(', ')}` : null;
  }

  private extractTechStackItems(ast: Program): string[] {
    const items: string[] = [];
    const context = this.findBlock(ast, 'context');

    if (context) {
      this.extractTechFromContext(context.content, items);
    }

    // Fall back to standards.code structure
    if (items.length === 0) {
      this.extractTechFromStandards(ast, items);
    }

    return items;
  }

  private extractTechFromContext(content: Block['content'], items: string[]): void {
    // Try tech-stack key first
    const tech = this.getProp(content, 'tech-stack');
    if (tech) items.push(...this.extractListItems(tech));

    // Also check individual fields
    const languages = this.getProp(content, 'languages');
    if (languages) this.collectValueItems(items, languages);

    const runtime = this.getProp(content, 'runtime');
    if (runtime) items.push(this.valueToString(runtime));

    const monorepo = this.getProp(content, 'monorepo');
    if (monorepo && typeof monorepo === 'object' && !Array.isArray(monorepo)) {
      const mono = monorepo as Record<string, Value>;
      if (mono['tool']) items.push(`${this.valueToString(mono['tool'])}`);
      if (mono['packageManager'])
        items.push(`${this.valueToString(mono['packageManager'])} workspaces`);
    }
  }

  private extractTechFromStandards(ast: Program, items: string[]): void {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return;

    const code = this.getProp(standards.content, 'code');
    if (code && typeof code === 'object' && !Array.isArray(code)) {
      const codeObj = code as Record<string, Value>;
      this.collectValueItems(items, codeObj['languages']);
      this.collectValueItems(items, codeObj['frameworks']);
      this.collectValueItems(items, codeObj['testing']);
    }
  }

  private architecture(ast: Program): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    // First try explicit architecture property
    const arch = this.getProp(context.content, 'architecture');
    if (arch) {
      const text = typeof arch === 'string' ? arch : this.valueToString(arch);
      if (text.trim()) return `Architecture:\n${text.trim()}`;
    }

    // Fall back to extracting text which may contain architecture info
    const text = this.extractText(context.content);
    if (text?.includes('Architecture')) {
      return text.trim();
    }

    return null;
  }

  private codeStyle(ast: Program): string | null {
    const items = this.extractCodeStyleItems(ast);
    if (items.length === 0) return null;
    return `Code style:\n${items.map((i) => '- ' + i).join('\n')}`;
  }

  private extractCodeStyleItems(ast: Program): string[] {
    // Only extract code-related standards (not git, config, diagrams, documentation)
    const codeKeys = ['typescript', 'naming', 'errors', 'testing'];

    // Try context.standards first (new structure)
    const context = this.findBlock(ast, 'context');
    if (context) {
      const standards = this.getProp(context.content, 'standards');
      if (standards && typeof standards === 'object' && !Array.isArray(standards)) {
        const filtered = this.filterByKeys(standards as Record<string, Value>, codeKeys);
        if (Object.keys(filtered).length > 0) {
          return this.extractNestedRules(filtered);
        }
      }
    }

    // Try @standards block directly
    const standardsBlock = this.findBlock(ast, 'standards');
    if (standardsBlock) {
      const props = this.getProps(standardsBlock.content);
      const filtered = this.filterByKeys(props, codeKeys);
      if (Object.keys(filtered).length > 0) {
        return this.extractNestedRules(filtered);
      }
    }

    return [];
  }

  private filterByKeys(obj: Record<string, Value>, keys: string[]): Record<string, Value> {
    const result: Record<string, Value> = {};
    for (const key of keys) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  private extractNestedRules(obj: Record<string, Value>): string[] {
    const items: string[] = [];
    for (const rules of Object.values(obj)) {
      this.flattenRules(rules, items);
    }
    return items;
  }

  private flattenRules(rules: Value, items: string[]): void {
    if (Array.isArray(rules)) {
      this.extractStringArray(rules, items);
      return;
    }

    if (rules && typeof rules === 'object') {
      this.extractFromObject(rules as Record<string, Value>, items);
      return;
    }

    if (typeof rules === 'string') {
      items.push(rules);
    }
  }

  private extractStringArray(arr: Value[], items: string[]): void {
    for (const item of arr) {
      if (typeof item === 'string') items.push(item);
    }
  }

  private extractFromObject(obj: Record<string, Value>, items: string[]): void {
    for (const [key, rule] of Object.entries(obj)) {
      if (Array.isArray(rule)) {
        this.extractStringArray(rule, items);
      } else if (typeof rule === 'string') {
        items.push(`${key}: ${rule}`);
      }
      // Skip booleans, numbers, nested objects
    }
  }

  private gitCommits(ast: Program): string | null {
    // Try @standards.git first
    const standardsBlock = this.findBlock(ast, 'standards');
    if (standardsBlock) {
      const git = this.getProp(standardsBlock.content, 'git');
      if (git && typeof git === 'object' && !Array.isArray(git)) {
        const items = this.extractGitItems(git as Record<string, Value>);
        if (items.length > 0) {
          return `Git Commits:\n${items.map((i) => '- ' + i).join('\n')}`;
        }
      }
    }

    // Fall back to context.git-commits
    const context = this.findBlock(ast, 'context');
    if (context) {
      const commits = this.getProp(context.content, 'git-commits');
      if (commits && typeof commits === 'object' && !Array.isArray(commits)) {
        const items = this.extractGitItems(commits as Record<string, Value>);
        if (items.length > 0) {
          return `Git Commits:\n${items.map((i) => '- ' + i).join('\n')}`;
        }
      }
    }

    return null;
  }

  private extractGitItems(obj: Record<string, Value>): string[] {
    const items: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'types' && Array.isArray(value)) {
        const types = value.map((v) => this.valueToString(v)).join(', ');
        items.push(`types: ${types}`);
      } else if (typeof value === 'string') {
        items.push(`${key}: ${value}`);
      } else if (typeof value === 'number') {
        items.push(`${key}: ${value}`);
      }
    }
    return items;
  }

  private configFiles(ast: Program): string | null {
    const items = this.extractConfigItems(ast);
    if (items.length === 0) return null;
    return `Config:\n${items.map((i) => '- ' + i).join('\n')}`;
  }

  private extractConfigItems(ast: Program): string[] {
    // Try @standards.config first
    const standardsBlock = this.findBlock(ast, 'standards');
    if (standardsBlock) {
      const config = this.getProp(standardsBlock.content, 'config');
      const items = this.extractConfigFromObject(config);
      if (items.length > 0) return items;
    }

    // Fall back to context.configuration-files
    const context = this.findBlock(ast, 'context');
    if (context) {
      const config = this.getProp(context.content, 'configuration-files');
      return this.extractConfigFromObjectWithList(config);
    }

    return [];
  }

  private extractConfigFromObject(config: Value | undefined): string[] {
    if (!config || typeof config !== 'object' || Array.isArray(config)) return [];
    const items: string[] = [];
    for (const [key, value] of Object.entries(config as Record<string, Value>)) {
      if (typeof value === 'string') {
        items.push(`${key}: ${value}`);
      }
    }
    return items;
  }

  private extractConfigFromObjectWithList(config: Value | undefined): string[] {
    if (!config || typeof config !== 'object' || Array.isArray(config)) return [];
    const items: string[] = [];
    for (const [key, value] of Object.entries(config as Record<string, Value>)) {
      const valueItems = this.extractListItems(value);
      if (valueItems.length > 0) {
        items.push(`${key}: ${valueItems.join('; ')}`);
      }
    }
    return items;
  }

  private commands(ast: Program): string | null {
    const block = this.findBlock(ast, 'shortcuts');
    if (!block) return null;

    const props = this.getProps(block.content);
    if (Object.keys(props).length === 0) return null;

    const lines: string[] = [];
    for (const [cmd, desc] of Object.entries(props)) {
      const shortDesc = this.valueToString(desc).split('\n')[0] ?? '';
      lines.push(`${cmd} - ${shortDesc}`);
    }

    return lines.length > 0 ? `Commands:\n${lines.join('\n')}` : null;
  }

  private devCommands(ast: Program): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const match = this.extractSectionWithCodeBlock(text, '## Development Commands');
    if (!match) return null;

    const content = match.replace('## Development Commands', '').trim();
    return `Development Commands:\n${content}`;
  }

  private postWork(ast: Program): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const match = this.extractSectionWithCodeBlock(text, '## Post-Work Verification');
    if (!match) return null;

    const content = match.replace('## Post-Work Verification', '').trim();
    return `Post-Work Verification:\n${content}`;
  }

  private documentation(ast: Program): string | null {
    const items = this.extractDocItems(ast);
    if (items.length === 0) return null;
    return `Documentation:\n${items.map((i) => '- ' + i).join('\n')}`;
  }

  private extractDocItems(ast: Program): string[] {
    // Try @standards.documentation first
    const standardsBlock = this.findBlock(ast, 'standards');
    if (standardsBlock) {
      const docs = this.getProp(standardsBlock.content, 'documentation');
      const items = this.extractStringValuesFromObject(docs);
      if (items.length > 0) return items;
    }

    // Fall back to context.documentation-verification
    const context = this.findBlock(ast, 'context');
    if (context) {
      const docs = this.getProp(context.content, 'documentation-verification');
      if (docs) return this.extractListItems(docs);
    }

    return [];
  }

  private extractStringValuesFromObject(obj: Value | undefined): string[] {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
    const items: string[] = [];
    for (const value of Object.values(obj as Record<string, Value>)) {
      if (typeof value === 'string') items.push(value);
    }
    return items;
  }

  private diagrams(ast: Program): string | null {
    const items = this.extractDiagramItems(ast);
    if (items.length === 0) return null;
    return `Diagrams:\n${items.map((i) => '- ' + i).join('\n')}`;
  }

  private extractDiagramItems(ast: Program): string[] {
    // Try @standards.diagrams first
    const standardsBlock = this.findBlock(ast, 'standards');
    if (standardsBlock) {
      const diag = this.getProp(standardsBlock.content, 'diagrams');
      const items = this.parseDiagramObject(diag, 'format');
      if (items.length > 0) return items;
    }

    // Fall back to context.diagrams
    const context = this.findBlock(ast, 'context');
    if (context) {
      const diag = this.getProp(context.content, 'diagrams');
      return this.parseDiagramObject(diag, 'tool');
    }

    return [];
  }

  private parseDiagramObject(diag: Value | undefined, formatKey: string): string[] {
    if (!diag || typeof diag !== 'object' || Array.isArray(diag)) return [];
    const diagObj = diag as Record<string, Value>;
    const items: string[] = [];
    if (diagObj[formatKey]) items.push(`Use ${this.valueToString(diagObj[formatKey])}`);
    if (diagObj['types'] && Array.isArray(diagObj['types'])) {
      items.push(`Types: ${diagObj['types'].map((t) => this.valueToString(t)).join(', ')}`);
    }
    return items;
  }

  private never(ast: Program): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractNeverItems(block.content);
    if (items.length === 0) return null;

    return `Never:\n${items.map((i) => '- ' + i).join('\n')}`;
  }

  private extractNeverItems(content: Block['content']): string[] {
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

  private extractListItems(value: Value): string[] {
    if (Array.isArray(value)) {
      return value.map((v) => this.valueToString(v));
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, Value>;
      const items: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        items.push(`${key}: ${this.valueToString(val)}`);
      }
      return items;
    }
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((l) => l.trim().replace(/^-\s*/, ''))
        .filter((l) => l.length > 0);
    }
    return [this.valueToString(value)];
  }

  private collectValueItems(items: string[], value: Value | undefined): void {
    if (!value) return;
    const arr = Array.isArray(value) ? value : [value];
    for (const item of arr) {
      items.push(this.valueToString(item));
    }
  }
}
