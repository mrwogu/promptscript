# normalizeProvenanceFiles()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeProvenanceFiles()

> **normalizeProvenanceFiles**(`trace`, `projectRoot`, `options?`): [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/provenance-files.ts:204](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/provenance-files.ts#L204)

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