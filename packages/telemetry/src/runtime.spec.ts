import { describe, expect, it } from 'vitest';
import { runtimeMetadata } from './runtime.js';

describe('runtimeMetadata', () => {
  it.each([
    ['darwin', 'arm64', 'darwin', 'arm64'],
    ['linux', 'x64', 'linux', 'x86_64'],
    ['win32', 'ia32', 'windows', 'other'],
    ['aix', 'riscv64', 'other', 'other'],
  ] as const)(
    'normalizes %s and %s',
    (platform, architecture, expectedOs, expectedArchitecture) => {
      const metadata = runtimeMetadata('1.16.0', {
        platform,
        architecture,
        nodeVersion: '24.3.0',
      });

      expect(metadata).toEqual({
        app_version: '1.16.0',
        runtime_version: '24',
        os: expectedOs,
        arch: expectedArchitecture,
      });
    }
  );
});
