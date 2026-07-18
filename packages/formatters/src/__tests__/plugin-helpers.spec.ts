import { describe, it, expect } from 'vitest';
import type { Program, Value } from '@promptscript/core';
import {
  extractPlugins,
  serializePluginsToJson,
  serializePluginNamesToYaml,
  findPluginsBlock,
  generatePluginsJsonFile,
} from '../plugin-helpers.js';

const loc = { file: 'test.prs', line: 1, column: 0, offset: 0 };

function makePluginsBlock(plugins: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'plugins',
        content: {
          type: 'ObjectContent',
          properties: plugins,
          loc,
        },
        loc,
      },
    ],
    uses: [],
    extends: [],
    loc,
  };
}

describe('plugin-helpers', () => {
  describe('findPluginsBlock', () => {
    it('should find plugins block', () => {
      const ast = makePluginsBlock({});
      expect(findPluginsBlock(ast)).toBeDefined();
    });

    it('should return undefined when no plugins block', () => {
      const ast: Program = {
        type: 'Program',
        blocks: [],
        uses: [],
        extends: [],
        loc,
      };
      expect(findPluginsBlock(ast)).toBeUndefined();
    });
  });

  describe('extractPlugins', () => {
    it('should extract plugin with all fields', () => {
      const ast = makePluginsBlock({
        'security-suite': {
          description: 'Security tooling',
          version: '1.0.0',
          source: 'npm',
          url: 'https://example.com',
          skills: ['security-review'],
          hooks: ['protect-files'],
          mcpServers: ['scanner'],
          references: ['base-plugin'],
        },
      });
      const plugins = extractPlugins(findPluginsBlock(ast)!);
      expect(plugins).toHaveLength(1);
      expect(plugins[0]!.name).toBe('security-suite');
      expect(plugins[0]!.version).toBe('1.0.0');
      expect(plugins[0]!.source).toBe('npm');
      expect(plugins[0]!.skills).toEqual(['security-review']);
      expect(plugins[0]!.hooks).toEqual(['protect-files']);
      expect(plugins[0]!.mcpServers).toEqual(['scanner']);
      expect(plugins[0]!.references).toEqual(['base-plugin']);
    });

    it('should extract minimal plugin', () => {
      const ast = makePluginsBlock({
        simple: { description: 'Simple plugin' },
      });
      const plugins = extractPlugins(findPluginsBlock(ast)!);
      expect(plugins[0]!.name).toBe('simple');
      expect(plugins[0]!.description).toBe('Simple plugin');
      expect(plugins[0]!.version).toBeUndefined();
    });

    it('should skip non-object values', () => {
      const ast = makePluginsBlock({
        bad: 'not-object' as unknown as Record<string, Value>,
      });
      expect(extractPlugins(findPluginsBlock(ast)!)).toHaveLength(0);
    });

    it('should return empty for non-ObjectContent', () => {
      const ast: Program = {
        type: 'Program',
        blocks: [
          {
            type: 'Block',
            name: 'plugins',
            content: { type: 'TextContent', value: 'text', loc },
            loc,
          },
        ],
        uses: [],
        extends: [],
        loc,
      };
      expect(extractPlugins(findPluginsBlock(ast)!)).toHaveLength(0);
    });
  });

  describe('serializePluginsToJson', () => {
    it('should produce valid JSON with plugins wrapper', () => {
      const ast = makePluginsBlock({
        'my-plugin': { version: '1.0.0', source: 'npm' },
      });
      const plugins = extractPlugins(findPluginsBlock(ast)!);
      const json = serializePluginsToJson(plugins);
      const parsed = JSON.parse(json) as { plugins: Record<string, unknown> };
      expect(parsed.plugins).toBeDefined();
      expect(parsed.plugins['my-plugin']).toBeDefined();
    });
  });

  describe('generatePluginsJsonFile', () => {
    it('should wrap serialized plugins with the requested path', () => {
      const ast = makePluginsBlock({
        'my-plugin': { version: '1.0.0', source: 'npm' },
      });
      const plugins = extractPlugins(findPluginsBlock(ast)!);

      const output = generatePluginsJsonFile(plugins, '.factory/plugins.json');
      const parsed = JSON.parse(output.content) as {
        plugins: Record<string, Record<string, unknown>>;
      };

      expect(output.path).toBe('.factory/plugins.json');
      expect(parsed.plugins['my-plugin']).toEqual({
        version: '1.0.0',
        source: 'npm',
      });
    });
  });

  describe('serializePluginNamesToYaml', () => {
    it('should produce YAML array of names', () => {
      const ast = makePluginsBlock({
        alpha: { version: '1.0.0' },
        beta: { version: '2.0.0' },
      });
      const plugins = extractPlugins(findPluginsBlock(ast)!);
      const yaml = serializePluginNamesToYaml(plugins);
      expect(yaml).toBe('["alpha", "beta"]');
    });

    it('should return empty array for no plugins', () => {
      expect(serializePluginNamesToYaml([])).toBe('[]');
    });
  });
});
