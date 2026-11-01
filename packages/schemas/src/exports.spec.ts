import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaDir = join(__dirname, '../../../schema');
const packageJsonPath = join(__dirname, '../package.json');

interface SchemasManifest {
  exports: Record<string, string>;
}

function readManifest(): SchemasManifest {
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as SchemasManifest;
}

describe('schemas package exports', () => {
  it('exports every file in schema/ and nothing else', () => {
    const files = new Set(readdirSync(schemaDir).filter((name) => name.endsWith('.json')));
    const exported = new Set(
      Object.keys(readManifest().exports)
        .filter((key) => key !== './package.json')
        .map((key) => key.slice(2))
    );

    expect(exported, 'add the file to exports in packages/schemas/package.json').toEqual(files);
  });

  it('points each subpath at the file of the same name', () => {
    for (const [key, target] of Object.entries(readManifest().exports)) {
      expect(target).toBe(key);
    }
  });
});
