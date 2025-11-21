import type { Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter';
import type { FormatterOutput } from '../types';

/**
 * Formatter for Claude Code instructions.
 * Outputs: `CLAUDE.md`
 */
export class ClaudeFormatter extends BaseFormatter {
  readonly name = 'claude';
  readonly outputPath = 'CLAUDE.md';
  readonly description = 'Claude Code instructions (concise Markdown)';

  format(ast: Program): FormatterOutput {
    const sections: string[] = [];

    sections.push('# CLAUDE.md\n');

    const project = this.project(ast);
    if (project) sections.push(project);

    const techStack = this.techStack(ast);
    if (techStack) sections.push(techStack);

    const commands = this.commands(ast);
    if (commands) sections.push(commands);

    const codeStyle = this.codeStyle(ast);
    if (codeStyle) sections.push(codeStyle);

    const donts = this.donts(ast);
    if (donts) sections.push(donts);

    return {
      path: this.outputPath,
      content: sections.join('\n'),
    };
  }

  private project(ast: Program): string | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const text = this.extractText(identity.content);
    const lines = text.split('\n');
    const firstLine = (lines[0] ?? '').trim();

    return `## Project\n${firstLine}\n`;
  }

  private techStack(ast: Program): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const code = this.getProp(standards.content, 'code');
    if (!code || typeof code !== 'object' || Array.isArray(code)) return null;

    const codeObj = code as Record<string, Value>;
    const items: string[] = [];

    const languages = codeObj['languages'];
    if (languages) {
      const langs = Array.isArray(languages) ? languages : [languages];
      items.push(...langs.map(String));
    }

    const frameworks = codeObj['frameworks'];
    if (frameworks) {
      const fws = Array.isArray(frameworks) ? frameworks : [frameworks];
      items.push(...fws.map(String));
    }

    const testing = codeObj['testing'];
    if (testing) {
      const tests = Array.isArray(testing) ? testing : [testing];
      items.push(...tests.map(String));
    }

    return items.length > 0 ? `## Tech Stack\n${items.join(', ')}\n` : null;
  }

  private commands(ast: Program): string | null {
    const block = this.findBlock(ast, 'shortcuts');
    if (!block) return null;

    const props = this.getProps(block.content);
    if (Object.keys(props).length === 0) return null;

    let content = '## Commands\n```\n';

    for (const [cmd, desc] of Object.entries(props)) {
      const lines = this.valueToString(desc).split('\n');
      const shortDesc = (lines[0] ?? '').substring(0, 40);
      content += `${cmd.padEnd(10)} - ${shortDesc}\n`;
    }

    content += '```\n';
    return content;
  }

  private codeStyle(ast: Program): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const code = this.getProp(standards.content, 'code');
    if (!code || typeof code !== 'object' || Array.isArray(code)) return null;

    const codeObj = code as Record<string, Value>;
    const items: string[] = [];

    this.addStyleItems(items, codeObj['style']);
    this.addStyleItems(items, codeObj['patterns']);

    if (items.length === 0) return null;

    const formattedItems = items.map((i) => '- ' + i).join('\n');
    return `## Code Style\n${formattedItems}\n`;
  }

  private addStyleItems(items: string[], value: Value | undefined): void {
    if (!value) return;
    const arr = Array.isArray(value) ? value : [value];
    for (const item of arr) {
      items.push(this.valueToString(item));
    }
  }

  private donts(ast: Program): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    let content = "## Don'ts\n";

    if (block.content.type === 'ArrayContent') {
      for (const item of block.content.elements) {
        content += `- ${this.valueToString(item)}\n`;
      }
      return content;
    }

    if (block.content.type === 'TextContent') {
      const lines = block.content.value.trim().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          content += trimmed.startsWith('-') ? `${trimmed}\n` : `- ${trimmed}\n`;
        }
      }
      return content;
    }

    return null;
  }
}
