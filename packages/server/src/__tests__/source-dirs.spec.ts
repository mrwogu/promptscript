import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolveSourceDir, resolveFileGlobs, resolveWatchPaths } from '../source-dirs.js';

describe('resolveSourceDir', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-srcdir-'));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('returns .promptscript when no config file exists', async () => {
    expect(await resolveSourceDir(workspace)).toBe('.promptscript');
  });

  it('returns .promptscript when config has no input.entry', async () => {
    await writeFile(join(workspace, 'promptscript.yaml'), 'targets:\n  - claude\n');
    expect(await resolveSourceDir(workspace)).toBe('.promptscript');
  });

  it('returns directory from input.entry in promptscript.yaml', async () => {
    await writeFile(
      join(workspace, 'promptscript.yaml'),
      'input:\n  entry: src/prompts/project.prs\n'
    );
    expect(await resolveSourceDir(workspace)).toBe('src/prompts');
  });

  it('reads promptscript.yml when .yaml does not exist', async () => {
    await writeFile(join(workspace, 'promptscript.yml'), 'input:\n  entry: custom/main.prs\n');
    expect(await resolveSourceDir(workspace)).toBe('custom');
  });

  it('prefers .yaml over .yml', async () => {
    await writeFile(
      join(workspace, 'promptscript.yaml'),
      'input:\n  entry: from-yaml/project.prs\n'
    );
    await writeFile(join(workspace, 'promptscript.yml'), 'input:\n  entry: from-yml/project.prs\n');
    expect(await resolveSourceDir(workspace)).toBe('from-yaml');
  });
});

describe('resolveFileGlobs', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-globs-'));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('returns default globs when no config', async () => {
    const globs = await resolveFileGlobs(workspace);
    expect(globs).toEqual(['.promptscript/**/*.prs', 'promptscript.yaml', 'promptscript.yml']);
  });

  it('uses custom source dir from config', async () => {
    await writeFile(join(workspace, 'promptscript.yaml'), 'input:\n  entry: ai/prompts/main.prs\n');
    const globs = await resolveFileGlobs(workspace);
    expect(globs).toEqual(['ai/prompts/**/*.prs', 'promptscript.yaml', 'promptscript.yml']);
  });
});

describe('resolveWatchPaths', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-watch-'));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('returns default watch paths when no config', async () => {
    const paths = await resolveWatchPaths(workspace);
    expect(paths).toEqual([
      join(workspace, '.promptscript'),
      join(workspace, 'promptscript.yaml'),
      join(workspace, 'promptscript.yml'),
    ]);
  });

  it('uses custom source dir from config', async () => {
    await writeFile(join(workspace, 'promptscript.yaml'), 'input:\n  entry: custom/dir/main.prs\n');
    const paths = await resolveWatchPaths(workspace);
    expect(paths).toEqual([
      join(workspace, 'custom/dir'),
      join(workspace, 'promptscript.yaml'),
      join(workspace, 'promptscript.yml'),
    ]);
  });
});
