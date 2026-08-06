import type { RuntimeMetadata } from './types.js';

interface RuntimeInput {
  platform?: NodeJS.Platform;
  architecture?: string;
  nodeVersion?: string;
}

function operatingSystem(platform: NodeJS.Platform): RuntimeMetadata['os'] {
  switch (platform) {
    case 'darwin':
      return 'darwin';
    case 'linux':
      return 'linux';
    case 'win32':
      return 'windows';
    default:
      return 'other';
  }
}

function architecture(value: string): RuntimeMetadata['arch'] {
  switch (value) {
    case 'arm64':
      return 'arm64';
    case 'x64':
      return 'x86_64';
    default:
      return 'other';
  }
}

export function runtimeMetadata(appVersion: string, input: RuntimeInput = {}): RuntimeMetadata {
  return {
    app_version: appVersion,
    runtime_version: (input.nodeVersion ?? process.versions.node).split('.')[0] ?? '0',
    os: operatingSystem(input.platform ?? process.platform),
    arch: architecture(input.architecture ?? process.arch),
  };
}
