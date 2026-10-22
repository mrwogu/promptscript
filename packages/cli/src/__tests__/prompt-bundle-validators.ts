import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';

const readSchema = (name: string): object =>
  JSON.parse(
    readFileSync(new URL(`../../../../schema/${name}`, import.meta.url), 'utf8')
  ) as object;

const ajv = new Ajv({ strict: true, allowUnionTypes: true });

/** Compile a generated schema from the repository `schema/` directory in strict mode. */
export const compileSchema = (name: string): ReturnType<typeof ajv.compile> =>
  ajv.compile(readSchema(name));

export const validateBundle = ajv.compile(readSchema('prompt-bundle-v1.json'));
export const validateIndex = ajv.compile(readSchema('prompt-bundle-index-v1.json'));
export const validateLabel = ajv.compile(readSchema('prompt-release-label-v1.json'));
