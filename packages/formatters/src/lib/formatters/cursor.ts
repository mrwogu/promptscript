import type { Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter';
import type { FormatterOutput } from '../types';

/**
 * Formatter for Cursor rules.
 * Outputs: `.cursorrules` (plain text, NOT markdown)
 */
export class CursorFormatter extends BaseFormatter {
  readonly name = 'cursor';
  readonly outputPath = '.cursorrules';
  readonly description = 'Cursor rules (plain text)';

  format(ast: Program): FormatterOutput {
    const lines: string[] = [];

    const intro = this.intro(ast);
    if (intro) lines.push(intro);

    const techStack = this.techStack(ast);
    if (techStack) lines.push(techStack);

    const codeStyle = this.codeStyle(ast);
    if (codeStyle) lines.push(codeStyle);

    const commands = this.commands(ast);
    if (commands) lines.push(commands);

    const never = this.never(ast);
    if (never) lines.push(never);

    return {
      path: this.outputPath,
      content: lines.join('\n\n'),
    };
  }

  private intro(ast: Program): string {
    const identity = this.findBlock(ast, 'identity');
    const context = this.findBlock(ast, 'context');

    let project = 'the project';
    if (context) {
      const projectProp = this.getProp(context.content, 'project');
      if (projectProp) {
        project = this.valueToString(projectProp);
      }
    }

    if (!project || project === 'the project') {
      if (identity) {
        const text = this.extractText(identity.content);
        const lines = text.split('\n');
        const firstLine = (lines[0] ?? '').trim();
        if (firstLine) {
          project = firstLine;
        }
      }
    }

    const org = this.getMetaField(ast, 'org');
    const orgSuffix = org ? ` at ${org}` : '';

    return `You are working on ${project}${orgSuffix}.`;
  }

  private techStack(ast: Program): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const code = this.getProp(standards.content, 'code');
    if (!code || typeof code !== 'object' || Array.isArray(code)) return null;

    const codeObj = code as Record<string, Value>;
    const items: string[] = [];

    this.collectTechItems(items, codeObj['languages']);
    this.collectTechItems(items, codeObj['frameworks']);
    this.collectTechItems(items, codeObj['testing']);

    return items.length > 0 ? `Tech stack: ${items.join(', ')}` : null;
  }

  private collectTechItems(items: string[], value: Value | undefined): void {
    if (!value) return;
    const arr = Array.isArray(value) ? value : [value];
    for (const item of arr) {
      items.push(String(item));
    }
  }

  private codeStyle(ast: Program): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const code = this.getProp(standards.content, 'code');
    if (!code || typeof code !== 'object' || Array.isArray(code)) return null;

    const codeObj = code as Record<string, Value>;
    const items: string[] = [];

    this.collectStyleItems(items, codeObj['style']);
    this.collectStyleItems(items, codeObj['patterns']);

    if (items.length === 0) return null;

    const formattedItems = items.map((i) => '- ' + i).join('\n');
    return `Code style:\n${formattedItems}`;
  }

  private collectStyleItems(items: string[], value: Value | undefined): void {
    if (!value) return;
    const arr = Array.isArray(value) ? value : [value];
    for (const item of arr) {
      items.push(this.valueToString(item));
    }
  }

  private commands(ast: Program): string | null {
    const block = this.findBlock(ast, 'shortcuts');
    if (!block) return null;

    const props = this.getProps(block.content);
    if (Object.keys(props).length === 0) return null;

    let content = 'Commands:\n';

    for (const [cmd, desc] of Object.entries(props)) {
      const lines = this.valueToString(desc).split('\n');
      const shortDesc = lines[0] ?? '';
      content += `${cmd} - ${shortDesc}\n`;
    }

    return content.trim();
  }

  private never(ast: Program): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    let content = 'Never:\n';

    if (block.content.type === 'ArrayContent') {
      for (const item of block.content.elements) {
        content += `- ${this.valueToString(item)}\n`;
      }
      return content.trim();
    }

    if (block.content.type === 'TextContent') {
      const lines = block.content.value.trim().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          content += trimmed.startsWith('-') ? trimmed + '\n' : '- ' + trimmed + '\n';
        }
      }
      return content.trim();
    }

    return null;
  }
}
