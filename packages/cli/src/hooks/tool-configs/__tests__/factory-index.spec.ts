import { describe, it, expect } from 'vitest';
import {
  ALL_TOOL_CONFIGS,
  getToolConfig,
  claudeConfig,
  factoryConfig,
  cursorConfig,
  windsurfConfig,
  clineConfig,
  copilotConfig,
  geminiConfig,
} from '../index.js';

describe('hooks/tool-configs/index', () => {
  it('ALL_TOOL_CONFIGS contains all 7 configs', () => {
    expect(ALL_TOOL_CONFIGS).toHaveLength(7);
  });

  it('ALL_TOOL_CONFIGS includes all expected tool configs', () => {
    const names = ALL_TOOL_CONFIGS.map((c) => c.name);
    expect(names).toContain('claude');
    expect(names).toContain('factory');
    expect(names).toContain('cursor');
    expect(names).toContain('windsurf');
    expect(names).toContain('cline');
    expect(names).toContain('copilot');
    expect(names).toContain('gemini');
  });

  it('ALL_TOOL_CONFIGS contains the exact exported config instances', () => {
    expect(ALL_TOOL_CONFIGS).toContain(claudeConfig);
    expect(ALL_TOOL_CONFIGS).toContain(factoryConfig);
    expect(ALL_TOOL_CONFIGS).toContain(cursorConfig);
    expect(ALL_TOOL_CONFIGS).toContain(windsurfConfig);
    expect(ALL_TOOL_CONFIGS).toContain(clineConfig);
    expect(ALL_TOOL_CONFIGS).toContain(copilotConfig);
    expect(ALL_TOOL_CONFIGS).toContain(geminiConfig);
  });

  it('getToolConfig returns correct config by name', () => {
    expect(getToolConfig('claude')).toBe(claudeConfig);
    expect(getToolConfig('factory')).toBe(factoryConfig);
    expect(getToolConfig('cursor')).toBe(cursorConfig);
    expect(getToolConfig('windsurf')).toBe(windsurfConfig);
    expect(getToolConfig('cline')).toBe(clineConfig);
    expect(getToolConfig('copilot')).toBe(copilotConfig);
    expect(getToolConfig('gemini')).toBe(geminiConfig);
  });

  it('getToolConfig returns undefined for unknown tool name', () => {
    expect(getToolConfig('unknown-tool')).toBeUndefined();
    expect(getToolConfig('')).toBeUndefined();
  });
});
