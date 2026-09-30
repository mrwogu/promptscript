# getPackageVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getPackageVersion()

> **getPackageVersion**(`baseDir`, `relativePath?`): `string`

Defined in: [core/src/utils/package.ts:64](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/package.ts#L64)

Get package version from a package.json file.

## Parameters

### baseDir

`string`

Base directory containing package.json (typically __dirname of the caller)

### relativePath?

`string` = `'../package.json'`

Relative path to package.json from baseDir (default: '../package.json')

## Returns

`string`

Package version string

## Example

```typescript
// In src/cli.ts
const version = getPackageVersion(__dirname);
console.log(version); // "1.0.0"
```