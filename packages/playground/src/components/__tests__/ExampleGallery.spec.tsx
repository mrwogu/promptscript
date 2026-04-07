import { describe, it, expect } from 'vitest';
import { compile } from '@promptscript/browser-compiler';
import { EXAMPLES } from '../ExampleGallery';

describe('ExampleGallery — gallery examples compile', () => {
  // Each example shipped in the gallery must round-trip through the
  // browser compiler so users never load a broken sample. This guards
  // against syntax drift when new language features are added.
  for (const example of EXAMPLES) {
    it(`compiles example "${example.id}"`, async () => {
      const files: Record<string, string> = {};
      for (const file of example.files) {
        files[file.path] = file.content;
      }

      const entry = example.files[0]?.path;
      expect(entry).toBeDefined();

      const result = await compile(files, entry as string, {
        envVars: example.envVars,
      });

      if (!result.success) {
        const messages = result.errors.map((e) => e.message ?? String(e)).join('\n');
        throw new Error(`Example "${example.id}" failed to compile:\n${messages}`);
      }

      expect(result.success).toBe(true);
      expect(result.outputs.size).toBeGreaterThan(0);
    });
  }
});
