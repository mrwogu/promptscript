import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  resolveSourceDir,
  resolveFileGlobs,
  resolveWatchPaths,
  readProjectConfig,
  isSourceFile,
} from '../source-dirs.js';

describe('readProjectConfig', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-config-'));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('returns parsed config from promptscript.yaml', async () => {
    await writeFile(
      join(workspace, 'promptscript.yaml'),
      'targets:\n  - claude\nformatting:\n  tabWidth: 4\n'
    );
    const config = await readProjectConfig(workspace);
    expect(config).toEqual({ targets: ['claude'], formatting: { tabWidth: 4 } });
  });

  it('returns null when no config file exists', async () => {
    const config = await readProjectConfig(workspace);
    expect(config).toBeNull();
  });

  it('falls back to promptscript.yml', async () => {
    await writeFile(
      join(workspace, 'promptscript.yml'),
      'targets:\n  - cursor\nformatting:\n  tabWidth: 2\n'
    );
    const config = await readProjectConfig(workspace);
    expect(config).toEqual({ targets: ['cursor'], formatting: { tabWidth: 2 } });
  });

  it('returns null for invalid YAML', async () => {
    await writeFile(join(workspace, 'promptscript.yaml'), ': :\n  bad: [unclosed\n');
    const config = await readProjectConfig(workspace);
    expect(config).toBeNull();
  });
});

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

describe('isSourceFile', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-source-file-'));
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('accepts .prs files under the source dir and the config files', async () => {
    expect(await isSourceFile(workspace, join(workspace, '.promptscript/team.prs'))).toBe(true);
    expect(await isSourceFile(workspace, join(workspace, '.promptscript/a/b.prs'))).toBe(true);
    expect(await isSourceFile(workspace, join(workspace, 'promptscript.yaml'))).toBe(true);
    expect(await isSourceFile(workspace, join(workspace, 'promptscript.yml'))).toBe(true);
  });

  it('rejects other files in the workspace', async () => {
    expect(await isSourceFile(workspace, join(workspace, '.env'))).toBe(false);
    expect(await isSourceFile(workspace, join(workspace, 'team.prs'))).toBe(false);
    expect(await isSourceFile(workspace, join(workspace, '.promptscript/notes.md'))).toBe(false);
    expect(await isSourceFile(workspace, join(workspace, 'sub/promptscript.yaml'))).toBe(false);
  });

  it('follows the source dir from the config entry', async () => {
    await writeFile(join(workspace, 'promptscript.yaml'), 'input:\n  entry: ai/prompts/main.prs\n');
    expect(await isSourceFile(workspace, join(workspace, 'ai/prompts/main.prs'))).toBe(true);
    expect(await isSourceFile(workspace, join(workspace, '.promptscript/team.prs'))).toBe(false);
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
