#!/usr/bin/env ts-node
/**
 * Generates JSON Schema from TypeScript types.
 *
 * Usage: pnpm schema:generate
 */

import { createGenerator, type Config } from 'ts-json-schema-generator';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Config = {
  path: path.resolve(__dirname, '../packages/core/src/types/config.ts'),
  tsconfig: path.resolve(__dirname, '../tsconfig.schema.json'),
  type: 'PromptScriptConfig',
  schemaId: 'https://getpromptscript.dev/schema/config.json',
  expose: 'export',
  topRef: false,
  jsDoc: 'extended',
  sortProps: true,
  strictTuples: false,
  skipTypeCheck: false,
  encodeRefs: true,
  extraTags: ['example', 'default'],
};

const outputPath = path.resolve(__dirname, '../schema/config.json');

type JsonObject = Record<string, unknown>;

interface BundleSchemaTarget {
  type: string;
  schemaId: string;
  title: string;
  output: string;
}

const BUNDLE_SCHEMAS: BundleSchemaTarget[] = [
  {
    type: 'PromptBundleV1',
    schemaId: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
    title: 'PromptScript Prompt Bundle v1',
    output: '../schema/prompt-bundle-v1.json',
  },
  {
    type: 'PromptBundleIndexV1',
    schemaId: 'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json',
    title: 'PromptScript Prompt Bundle Index v1',
    output: '../schema/prompt-bundle-index-v1.json',
  },
];

/**
 * Names a bundle map key must never take: `__proto__`, `prototype`, `constructor`
 * and every own property name of Object.prototype. Computed so it cannot drift.
 */
const FORBIDDEN_KEYS = [
  ...new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']),
].sort((a, b) => Number(a > b) - Number(a < b));

const KEY_NAMES = {
  pattern: '^[A-Za-z_][A-Za-z0-9_]*$',
  not: { enum: FORBIDDEN_KEYS },
};

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Closes every object level and drops the non-standard `example` keyword the
 * generator emits next to `examples`, so strict validators accept the schema.
 */
function tightenSchema(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(tightenSchema);
    return;
  }
  if (!isObject(node)) return;
  delete node['example'];
  if (node['type'] === 'object' && 'properties' in node && !('additionalProperties' in node)) {
    node['additionalProperties'] = false;
  }
  Object.values(node).forEach(tightenSchema);
}

function mapNode(parent: unknown, key: string): JsonObject {
  const node = isObject(parent) ? parent[key] : undefined;
  if (!isObject(node)) throw new Error(`Generated schema has no "${key}" object to patch`);
  return node;
}

function generateBundleSchema(target: BundleSchemaTarget): JsonObject {
  const generator = createGenerator({
    ...config,
    path: path.resolve(__dirname, '../packages/core/src/types/prompt-bundle.ts'),
    type: target.type,
    schemaId: target.schemaId,
  });
  const schema = generator.createSchema(target.type) as JsonObject;
  tightenSchema(schema);

  if (target.type === 'PromptBundleV1') {
    const definitions = mapNode(schema, 'definitions');
    const outputProperties = mapNode(
      mapNode(mapNode(definitions, 'PromptBundleOutput'), 'properties'),
      'properties'
    );
    mapNode(mapNode(schema, 'properties'), 'inputs')['propertyNames'] = KEY_NAMES;
    outputProperties['propertyNames'] = KEY_NAMES;
  }

  // The metaschema URL stays the first key of the file
  const { $schema, ...rest } = schema;
  return { $schema, $id: target.schemaId, title: target.title, ...rest };
}

async function main(): Promise<void> {
  console.log('Generating JSON Schema from TypeScript types...');
  console.log(`  Source: ${config.path}`);
  console.log(`  Type: ${config.type}`);
  console.log(`  Output: ${outputPath}`);

  const generator = createGenerator(config);
  const schema = generator.createSchema(config.type);
  const targetSourceConstraint = {
    anyOf: [
      {
        required: ['targets'],
        properties: {
          targets: { minItems: 1 },
        },
      },
      {
        required: ['builds'],
        properties: {
          builds: {
            minProperties: 1,
            additionalProperties: {
              required: ['targets'],
              properties: {
                targets: { minItems: 1 },
              },
            },
          },
        },
      },
    ],
  };
  const explicitProfileTargetsConstraint = {
    properties: {
      builds: {
        additionalProperties: {
          properties: {
            targets: { minItems: 1 },
          },
        },
      },
    },
  };

  // Add schema metadata
  const enrichedSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: config.schemaId,
    title: 'PromptScript Configuration',
    description: 'Configuration schema for promptscript.yaml files',
    ...schema,
    allOf: [...(schema.allOf ?? []), targetSourceConstraint, explicitProfileTargetsConstraint],
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(enrichedSchema, null, 2) + '\n');

  for (const target of BUNDLE_SCHEMAS) {
    const file = path.resolve(__dirname, target.output);
    console.log(`  Output: ${file}`);
    fs.writeFileSync(file, JSON.stringify(generateBundleSchema(target), null, 2) + '\n');
  }

  console.log('✅ Schema generated successfully!');
}

main().catch((error) => {
  console.error('❌ Failed to generate schema:', error);
  process.exit(1);
});
