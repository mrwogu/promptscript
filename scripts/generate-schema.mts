#!/usr/bin/env ts-node
/**
 * Generates JSON Schema from TypeScript types.
 *
 * Usage: pnpm schema:generate
 */

import { createGenerator, type Config } from 'ts-json-schema-generator';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: Config = {
  path: path.resolve(__dirname, '../packages/core/src/types/config.ts'),
  tsconfig: path.resolve(__dirname, '../tsconfig.base.json'),
  type: 'PromptScriptConfig',
  schemaId: 'https://getpromptscript.dev/latest/schema/config.json',
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

async function main(): Promise<void> {
  console.log('Generating JSON Schema from TypeScript types...');
  console.log(`  Source: ${config.path}`);
  console.log(`  Type: ${config.type}`);
  console.log(`  Output: ${outputPath}`);

  const generator = createGenerator(config);
  const schema = generator.createSchema(config.type);

  // Add schema metadata
  const enrichedSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: config.schemaId,
    title: 'PromptScript Configuration',
    description: 'Configuration schema for promptscript.yaml files',
    ...schema,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(enrichedSchema, null, 2) + '\n');

  console.log('✅ Schema generated successfully!');
}

main().catch((error) => {
  console.error('❌ Failed to generate schema:', error);
  process.exit(1);
});
