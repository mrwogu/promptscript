# getPackageInfo()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getPackageInfo()

> **getPackageInfo**(`baseDir`, `relativePath?`): `PackageInfo`

Defined in: [core/src/utils/package.ts:31](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/utils/package.ts#L31)

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