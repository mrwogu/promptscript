import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { importFile } from '../importer.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('instruction file import', () => {
  const testDir = join(tmpdir(), 'prs-import-test-' + Date.now());

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should import instruction file with applyTo as @guards named entry', async () => {
    const content = [
      '---',
      'applyTo:',
      '  - "apps/admin/**/*.ts"',
      '  - "apps/webview/**/*.ts"',
      '---',
      '',
      '# Angular Component Standards',
      '',
      'Use OnPush change detection.',
    ].join('\n');

    const filepath = join(testDir, 'angular-components.instructions.md');
    await writeFile(filepath, content);

    const result = await importFile(filepath, { format: 'github' });

    expect(result.prsContent).toContain('@guards');
    expect(result.prsContent).toContain('angular-components');
    expect(result.prsContent).toContain('apps/admin/**/*.ts');
    expect(result.prsContent).toContain('Use OnPush change detection.');
  });
});
