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
export const validateLabelV2 = ajv.compile(readSchema('prompt-release-label-v2.json'));
export const validateReleaseReport = ajv.compile(readSchema('release-report-v1.json'));

// The approval report refers to the approval record schema by URL, so it gets its own instance.
const approvalAjv = new Ajv({ strict: true, allowUnionTypes: true });
approvalAjv.addSchema(readSchema('approval-record-v1.json'));
export const validateApprovalReport = approvalAjv.compile(readSchema('approval-report-v1.json'));
export const validateAuditLog = ajv.compile(readSchema('audit-log-v1.json'));
