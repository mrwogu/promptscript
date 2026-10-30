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

interface SchemaTarget {
  /** Source file under packages/core/src/types that declares the type */
  source: string;
  type: string;
  schemaId: string;
  title: string;
  output: string;
}

const GENERATED_SCHEMAS: SchemaTarget[] = [
  {
    source: 'prompt-bundle.ts',
    type: 'PromptBundleV1',
    schemaId: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
    title: 'PromptScript Prompt Bundle v1',
    output: '../schema/prompt-bundle-v1.json',
  },
  {
    source: 'prompt-bundle.ts',
    type: 'PromptBundleIndexV1',
    schemaId: 'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json',
    title: 'PromptScript Prompt Bundle Index v1',
    output: '../schema/prompt-bundle-index-v1.json',
  },
  {
    source: 'prompt-bundle.ts',
    type: 'PromptReleaseLabelV1',
    schemaId: 'https://getpromptscript.dev/schema/prompt-release-label/v1.json',
    title: 'PromptScript Prompt Release Label v1',
    output: '../schema/prompt-release-label-v1.json',
  },
  {
    source: 'prompt-bundle.ts',
    type: 'PromptReleaseLabelV2',
    schemaId: 'https://getpromptscript.dev/schema/prompt-release-label/v2.json',
    title: 'PromptScript Prompt Release Label v2',
    output: '../schema/prompt-release-label-v2.json',
  },
  {
    source: 'eval.ts',
    type: 'EvalDatasetRowV1',
    schemaId: 'https://getpromptscript.dev/schema/eval-dataset-row/v1.json',
    title: 'PromptScript Eval Dataset Row v1',
    output: '../schema/eval-dataset-row-v1.json',
  },
  {
    source: 'eval.ts',
    type: 'EvalSuiteV1',
    schemaId: 'https://getpromptscript.dev/schema/eval-suite/v1.json',
    title: 'PromptScript Eval Suite v1',
    output: '../schema/eval-suite-v1.json',
  },
  {
    source: 'eval.ts',
    type: 'EvalLabelRowV1',
    schemaId: 'https://getpromptscript.dev/schema/eval-label-row/v1.json',
    title: 'PromptScript Eval Label Row v1',
    output: '../schema/eval-label-row-v1.json',
  },
  {
    source: 'eval.ts',
    type: 'EvalCacheEntryV1',
    schemaId: 'https://getpromptscript.dev/schema/eval-cache-entry/v1.json',
    title: 'PromptScript Eval Cache Entry v1',
    output: '../schema/eval-cache-entry-v1.json',
  },
  {
    source: 'eval.ts',
    type: 'EvalReportV1',
    schemaId: 'https://getpromptscript.dev/schema/eval-report/v1.json',
    title: 'PromptScript Eval Report v1',
    output: '../schema/eval-report-v1.json',
  },
  {
    source: 'eval.ts',
    type: 'EvalComparisonV1',
    schemaId: 'https://getpromptscript.dev/schema/eval-comparison/v1.json',
    title: 'PromptScript Eval Comparison v1',
    output: '../schema/eval-comparison-v1.json',
  },
  {
    source: 'approval.ts',
    type: 'ApprovalRecordV1',
    schemaId: 'https://getpromptscript.dev/schema/approval-record/v1.json',
    title: 'PromptScript Approval Record v1',
    output: '../schema/approval-record-v1.json',
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

function generateTypeSchema(target: SchemaTarget): JsonObject {
  const generator = createGenerator({
    ...config,
    path: path.resolve(__dirname, '../packages/core/src/types', target.source),
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

  // Row keys name prompt inputs and output properties, so they follow the bundle key rule
  if (target.type === 'EvalDatasetRowV1') {
    const properties = mapNode(schema, 'properties');
    mapNode(properties, 'inputs')['propertyNames'] = KEY_NAMES;
    const expected = mapNode(properties, 'expected')['anyOf'];
    const expectedObject = Array.isArray(expected)
      ? expected.find((branch) => isObject(branch) && branch['type'] === 'object')
      : undefined;
    if (!isObject(expectedObject))
      throw new Error('Generated schema has no "expected" object to patch');
    expectedObject['propertyNames'] = KEY_NAMES;
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

  for (const target of GENERATED_SCHEMAS) {
    const file = path.resolve(__dirname, target.output);
    console.log(`  Output: ${file}`);
    fs.writeFileSync(file, JSON.stringify(generateTypeSchema(target), null, 2) + '\n');
  }

  console.log('✅ Schema generated successfully!');
}

main().catch((error) => {
  console.error('❌ Failed to generate schema:', error);
  process.exit(1);
});
