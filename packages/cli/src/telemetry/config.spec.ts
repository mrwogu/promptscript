import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveCliTelemetryConfig, setUserTelemetryEnabled } from './config.js';

const directories: string[] = [];
const originalEnvironment = process.env;

function directory(): string {
  const value = mkdtempSync(join(tmpdir(), 'promptscript-cli-telemetry-'));
  directories.push(value);
  return value;
}

beforeEach(() => {
  process.env = {};
});

afterEach(() => {
  process.env = originalEnvironment;
  for (const value of directories.splice(0)) {
    rmSync(value, { recursive: true, force: true });
  }
});

describe('resolveCliTelemetryConfig', () => {
  it('loads project and user vetoes before enabling telemetry', async () => {
    const cwd = directory();
    const userConfigPath = join(cwd, 'user.yaml');
    writeFileSync(join(cwd, 'promptscript.yaml'), "id: project\nsyntax: '1.0'\ntelemetry: true\n");
    writeFileSync(userConfigPath, "version: '1'\ntelemetry: false\n");

    const config = await resolveCliTelemetryConfig({
      cwd,
      userConfigPath,
      cacheDirectory: join(cwd, 'cache'),
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('user config');
  });

  it('treats project telemetry false as a hard veto', async () => {
    const cwd = directory();
    const userConfigPath = join(cwd, 'user.yaml');
    writeFileSync(join(cwd, 'promptscript.yaml'), "id: project\nsyntax: '1.0'\ntelemetry: false\n");
    writeFileSync(userConfigPath, "version: '1'\ntelemetry: true\n");
    process.env['PROMPTSCRIPT_TELEMETRY'] = 'true';

    const config = await resolveCliTelemetryConfig({ cwd, userConfigPath });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('project config');
  });

  it('fails closed for a missing explicit project config', async () => {
    const cwd = directory();

    const config = await resolveCliTelemetryConfig({
      cwd,
      config: 'missing.yaml',
      userConfigPath: join(cwd, 'user.yaml'),
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });

  it('fails closed for a missing environment-selected project config', async () => {
    const cwd = directory();
    process.env['PROMPTSCRIPT_CONFIG'] = 'missing.yaml';

    const config = await resolveCliTelemetryConfig({
      cwd,
      userConfigPath: join(cwd, 'user.yaml'),
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });

  it('fails closed for a whitespace-only environment config path', async () => {
    const cwd = directory();
    process.env['PROMPTSCRIPT_CONFIG'] = '   ';

    const config = await resolveCliTelemetryConfig({
      cwd,
      userConfigPath: join(cwd, 'user.yaml'),
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });

  it('fails closed for invalid user configuration', async () => {
    const cwd = directory();
    const userConfigPath = join(cwd, 'user.yaml');
    writeFileSync(userConfigPath, "version: '1'\ntelemetry: [\n");

    const config = await resolveCliTelemetryConfig({ cwd, userConfigPath });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });

  it('fails closed for non-boolean project telemetry configuration', async () => {
    const cwd = directory();
    writeFileSync(
      join(cwd, 'promptscript.yaml'),
      "id: project\nsyntax: '1.0'\ntelemetry: sometimes\n"
    );

    const config = await resolveCliTelemetryConfig({
      cwd,
      userConfigPath: join(cwd, 'missing-user.yaml'),
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });

  it('enables telemetry when no project config exists and no veto applies', async () => {
    const cwd = directory();

    const config = await resolveCliTelemetryConfig({
      cwd,
      userConfigPath: join(cwd, 'missing-user.yaml'),
    });

    expect(config.enabled).toBe(true);
  });
});

describe('setUserTelemetryEnabled', () => {
  it('preserves YAML comments while updating telemetry', async () => {
    const cwd = directory();
    const configPath = join(cwd, 'config.yaml');
    writeFileSync(configPath, "# Keep this comment\nversion: '1'\ntelemetry: true\n");

    await setUserTelemetryEnabled(false, configPath);

    const content = readFileSync(configPath, 'utf8');
    expect(content).toContain('# Keep this comment');
    expect(content).toContain('telemetry: false');
  });

  it('creates a minimal user config atomically', async () => {
    const cwd = directory();
    const configPath = join(cwd, 'nested', 'config.yaml');

    await setUserTelemetryEnabled(true, configPath);

    expect(readFileSync(configPath, 'utf8')).toContain('telemetry: true');
  });

  it('does not overwrite invalid user config', async () => {
    const cwd = directory();
    const configPath = join(cwd, 'config.yaml');
    const source = "version: '1'\ntelemetry: [\n";
    writeFileSync(configPath, source);

    await expect(setUserTelemetryEnabled(false, configPath)).rejects.toThrow(
      'Cannot update invalid YAML user config'
    );

    expect(readFileSync(configPath, 'utf8')).toBe(source);
  });
});
