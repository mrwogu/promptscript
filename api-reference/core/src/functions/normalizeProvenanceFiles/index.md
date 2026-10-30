# normalizeProvenanceFiles()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeProvenanceFiles()

> **normalizeProvenanceFiles**(`trace`, `projectRoot`, `options?`): [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/provenance-files.ts:204](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/provenance-files.ts#L204)

Rewrite every file in a provenance trace so no machine path survives.

Covers `entry`, every `source` (entries, history steps, chain links, nested traces) and
absolute `target` values. A file is named by how it was resolved:
- a file reached through a registry or pack reference becomes the authored reference,
  whether it sits in a git cache or a vendored directory;
- a file under `projectRoot` becomes a relative POSIX path (symbolic links resolved,
  Unicode NFC);
- anything else, or anything that would still be absolute, climb above the root or carry a
  drive letter, becomes `external:<basename>`.

The function is pure. It never reads the file system except through the optional `realpath`.

## Parameters

### trace

[`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Trace from a resolver

### projectRoot

`string` \| `undefined`

Project root the in-root paths are relative to

### options?

[`NormalizeProvenanceOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/NormalizeProvenanceOptions/index.md) = `{}`

Optional symbolic link resolver

## Returns

[`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

A new trace. The input is not changed.

## Example

```ts
const safe = normalizeProvenanceFiles(program.provenance, '/work/app');
```