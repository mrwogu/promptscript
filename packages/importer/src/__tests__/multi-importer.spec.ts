import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { importMultipleFiles } from '../multi-importer.js';

const fixturesDir = resolve(__dirname, 'fixtures');

describe('importMultipleFiles', () => {
  it('imports multiple files and returns modular output', async () => {
    const result = await importMultipleFiles(
      [resolve(fixturesDir, 'sample-claude.md'), resolve(fixturesDir, 'sample-copilot.md')],
      { projectName: 'test-project' }
    );
    expect(result.files.has('project.prs')).toBe(true);
    expect(result.files.get('project.prs')).toContain('@meta {');
    expect(result.files.get('project.prs')).toContain('@use ./');
    expect(result.overallConfidence).toBeGreaterThan(0);
  });

  it('project.prs contains @identity block', async () => {
    const result = await importMultipleFiles([resolve(fixturesDir, 'sample-claude.md')], {
      projectName: 'my-proj',
    });
    expect(result.files.get('project.prs')).toContain('@identity');
  });

  it('only emits files with content', async () => {
    const result = await importMultipleFiles([resolve(fixturesDir, 'sample-claude.md')], {
      projectName: 'test',
    });
    for (const [, content] of result.files) {
      expect(content.trim().length).toBeGreaterThan(0);
    }
  });

  it('returns per-file confidence reports', async () => {
    const result = await importMultipleFiles(
      [resolve(fixturesDir, 'sample-claude.md'), resolve(fixturesDir, 'sample-copilot.md')],
      { projectName: 'test' }
    );
    expect(result.perFileReports).toHaveLength(2);
    expect(result.perFileReports[0]!.file).toContain('sample-claude.md');
    expect(result.perFileReports[0]!.sectionCount).toBeGreaterThan(0);
  });

  it('reports deduplication count', async () => {
    const result = await importMultipleFiles(
      [resolve(fixturesDir, 'sample-claude.md'), resolve(fixturesDir, 'sample-copilot.md')],
      { projectName: 'test' }
    );
    expect(typeof result.deduplicatedCount).toBe('number');
  });

  it('skips files that fail to import with warnings', async () => {
    const result = await importMultipleFiles(
      [resolve(fixturesDir, 'sample-claude.md'), '/nonexistent/file.md'],
      { projectName: 'test' }
    );
    expect(result.files.has('project.prs')).toBe(true);
    expect(result.warnings.some((w) => w.includes('/nonexistent/file.md'))).toBe(true);
  });

  it('handles single file input', async () => {
    const result = await importMultipleFiles([resolve(fixturesDir, 'sample-claude.md')], {
      projectName: 'single',
    });
    expect(result.files.has('project.prs')).toBe(true);
  });

  it('returns empty project scaffold when all imports fail', async () => {
    const result = await importMultipleFiles(['/nonexistent/a.md', '/nonexistent/b.md'], {
      projectName: 'empty-proj',
    });
    expect(result.files.has('project.prs')).toBe(true);
    const content = result.files.get('project.prs')!;
    expect(content).toContain('@meta {');
    expect(content).toContain('id: "empty-proj"');
    expect(content).toContain('@identity {');
    expect(content).toContain('No content could be imported');
    expect(result.perFileReports).toHaveLength(0);
    expect(result.deduplicatedCount).toBe(0);
    expect(result.overallConfidence).toBe(0);
    expect(result.warnings).toHaveLength(2);
  });
});
