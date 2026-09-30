# getPackageInfo()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getPackageInfo()

> **getPackageInfo**(`baseDir`, `relativePath?`): `PackageInfo`

Defined in: [core/src/utils/package.ts:31](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/package.ts#L31)

Get package information from a package.json file.

## Parameters

### baseDir

`string`

Base directory containing package.json (typically __dirname of the caller)

### relativePath?

`string` = `'../package.json'`

Relative path to package.json from baseDir (default: '../package.json')

## Returns

`PackageInfo`

Package information

## Example

```typescript
// In src/cli.ts
const pkg = getPackageInfo(__dirname);
console.log(pkg.version); // "1.0.0"
```