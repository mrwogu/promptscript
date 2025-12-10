import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter';
import type { FormatOptions, FormatterOutput } from '../types';

/**
 * Formatter for Claude Code instructions.
 * Outputs: `CLAUDE.md`
 *
 * Claude CLAUDE.md format aims to be comprehensive while remaining readable.
 * It includes all sections that GitHub Copilot formatter generates.
 */
export class ClaudeFormatter extends BaseFormatter {
  readonly name = 'claude';
  readonly outputPath = 'CLAUDE.md';
  readonly description = 'Claude Code instructions (concise Markdown)';
  readonly defaultConvention = 'markdown';

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const sections: string[] = [];

    sections.push('# CLAUDE.md\n');

    // Core sections
    this.addSection(sections, this.project(ast));
    this.addSection(sections, this.techStack(ast));
    this.addSection(sections, this.architecture(ast));

    // Standards sections
    this.addSection(sections, this.codeStandards(ast));
    this.addSection(sections, this.gitCommits(ast));
    this.addSection(sections, this.configFiles(ast));

    // Commands and workflow
    this.addSection(sections, this.commands(ast));
    this.addSection(sections, this.postWork(ast));

    // Guidelines
    this.addSection(sections, this.documentation(ast));
    this.addSection(sections, this.diagrams(ast));
    this.addSection(sections, this.donts(ast));

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
    };
  }

  private addSection(sections: string[], content: string | null): void {
    if (content) sections.push(content);
  }

  private project(ast: Program): string | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const text = this.extractText(identity.content);
    // Include full identity for completeness
    const cleanText = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)
      .join('\n');

    return `## Project\n${cleanText}\n`;
  }

  private techStack(ast: Program): string | null {
    const context = this.findBlock(ast, 'context');
    if (context) {
      const items = this.extractTechStackFromContext(context);
      if (items.length > 0) return `## Tech Stack\n${items.join(', ')}\n`;
    }

    const standards = this.findBlock(ast, 'standards');
    if (standards) {
      const items = this.extractTechStackFromStandards(standards);
      if (items.length > 0) return `## Tech Stack\n${items.join(', ')}\n`;
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

  private architecture(ast: Program): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    const text = this.extractText(context.content);
    const archMatch = /## Architecture[\s\S]*?```[\s\S]*?```/.exec(text);
    return archMatch ? archMatch[0] + '\n' : null;
  }

  private codeStandards(ast: Program): string | null {
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
      const ts = props['typescript'];
      if (ts && typeof ts === 'object' && !Array.isArray(ts)) {
        const tsObj = ts as Record<string, Value>;
        if (tsObj['strictMode']) items.push('Strict TypeScript, no `any`');
        if (tsObj['exports']) items.push('Named exports only');
      }

      const naming = props['naming'];
      if (naming && typeof naming === 'object' && !Array.isArray(naming)) {
        const n = naming as Record<string, Value>;
        if (n['files']) items.push(`Files: ${this.valueToString(n['files'])}`);
      }

      const testing = props['testing'];
      if (testing && typeof testing === 'object' && !Array.isArray(testing)) {
        const t = testing as Record<string, Value>;
        const parts: string[] = [];
        if (t['framework']) parts.push(this.valueToString(t['framework']));
        if (t['coverage']) parts.push(`>${this.valueToString(t['coverage'])}% coverage`);
        if (parts.length > 0) items.push(`Testing: ${parts.join(', ')}`);
      }
    }

    if (items.length === 0) return null;
    return `## Code Style\n${items.map((i) => '- ' + i).join('\n')}\n`;
  }

  private gitCommits(ast: Program): string | null {
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
    return `## Git Commits\n${items.map((i) => '- ' + i).join('\n')}\n`;
  }

  private configFiles(ast: Program): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const config = this.getProp(standards.content, 'config');
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;

    const c = config as Record<string, Value>;
    const items: string[] = [];

    if (c['eslint']) items.push(`ESLint: ${this.valueToString(c['eslint'])}`);
    if (c['viteRoot']) items.push(`Vite root: ${this.valueToString(c['viteRoot'])}`);

    if (items.length === 0) return null;
    return `## Config Files\n${items.map((i) => '- ' + i).join('\n')}\n`;
  }

  private commands(ast: Program): string | null {
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

    let content = '## Commands\n```\n' + commandLines.join('\n') + '\n```\n';

    if (knowledge) {
      const text = this.extractText(knowledge.content);
      const match = /## Development Commands[\s\S]*?```[\s\S]*?```/.exec(text);
      if (match) content += '\n' + match[0] + '\n';
    }

    return content;
  }

  private postWork(ast: Program): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const match = /## Post-Work Verification[\s\S]*?```[\s\S]*?```/.exec(text);
    return match ? match[0] + '\n' : null;
  }

  private documentation(ast: Program): string | null {
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
    return `## Documentation\n${items.map((i) => '- ' + i).join('\n')}\n`;
  }

  private diagrams(ast: Program): string | null {
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
    return `## Diagrams\n${items.map((i) => '- ' + i).join('\n')}\n`;
  }

  private donts(ast: Program): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractDontsItems(block.content);
    if (items.length === 0) return null;
    return `## Don'ts\n${items.map((i) => '- ' + i).join('\n')}\n`;
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
      // Parser converts dash-lists to ObjectContent with 'items' property
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
