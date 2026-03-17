import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type OpenClawVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: OpenClawFormatter, VERSIONS: OPENCLAW_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'openclaw',
    outputPath: 'INSTRUCTIONS.md',
    description: 'OpenClaw instructions (Markdown)',
    mainFileHeader: '# INSTRUCTIONS.md',
    dotDir: '.openclaw',
  });
