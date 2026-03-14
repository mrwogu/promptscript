import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type QwenCodeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: QwenCodeFormatter, VERSIONS: QWEN_CODE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'qwen-code',
    outputPath: '.qwen/rules/project.md',
    description: 'Qwen Code rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.qwen',
  });
