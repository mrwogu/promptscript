import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const schemaDir = join(__dirname, '../../../schema');

// The schemas of docs/reference/json-output.md
const STABLE_SCHEMAS = [
  'diff-v1.json',
  'release-report-v1.json',
  'approval-report-v1.json',
  'audit-log-v1.json',
  'eval-report-v1.json',
  'eval-comparison-v1.json',
  'validate-report-v1.json',
];

const MARK = /(Open|Closed) enum:/;

// Constants that are the discriminator of a value, so they need a mark like an enum
const MARKED_CONSTS = new Set(['type', 'approverSource']);

// Conditions only look at a value, they do not define it
const SKIPPED_KEYWORDS = new Set(['if', 'not']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describes(node: Record<string, unknown>): boolean {
  return typeof node['description'] === 'string' && MARK.test(node['description']);
}

function findUnmarked(node: unknown, pointer: string, found: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => findUnmarked(item, `${pointer}/${index}`, found));
    return;
  }
  if (!isRecord(node)) return;

  if ('enum' in node && !describes(node)) found.push(pointer);

  for (const [key, child] of Object.entries(node)) {
    if (SKIPPED_KEYWORDS.has(key)) continue;
    if (key === 'properties' && isRecord(child)) {
      for (const [name, property] of Object.entries(child)) {
        if (MARKED_CONSTS.has(name) && isRecord(property) && 'const' in property) {
          if (!describes(property)) found.push(`${pointer}/properties/${name}`);
        }
      }
    }
    findUnmarked(child, `${pointer}/${key}`, found);
  }
}

describe('enum marks in stable schemas', () => {
  it.each(STABLE_SCHEMAS)('%s marks every enum as open or closed', (file) => {
    const schema: unknown = JSON.parse(readFileSync(join(schemaDir, file), 'utf-8'));
    const found: string[] = [];

    findUnmarked(schema, '', found);

    expect(found, 'add "Open enum:" or "Closed enum:" to the description').toEqual([]);
  });
});
