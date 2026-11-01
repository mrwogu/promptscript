# @promptscript/schemas

The JSON Schemas of PromptScript, one subpath per file. No code, only data.

```text
@promptscript/schemas/config.json
@promptscript/schemas/diff-v1.json
@promptscript/schemas/prompt-bundle-v1.json
...
```

The files are copied from `schema/` in the repository when the package is built. The `$id` URL inside each schema stays the canonical id.

This package is private for now and not published. Inside this repository read the files in `schema/` directly.

## Adding a schema

Add the file to `schema/`, then add a matching line to `exports` in `package.json`. The spec in `src/exports.spec.ts` fails until you do.
