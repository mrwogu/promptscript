# resolveProjectPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveProjectPath()

> **resolveProjectPath**(`projectRoot`, `baseDir`, `value`): `string` \| `undefined`

Defined in: [eval/src/paths.ts:46](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/paths.ts#L46)

Resolve a relative path written in a suite against `baseDir` and return its
real path. Returns undefined when the value is absolute, has a drive letter,
a UNC prefix or a NUL byte, when its real path leaves the project root
through `..` or a symlink, when it is a dangling symlink or a link loop, or
when it cannot be resolved for any other reason. Callers read
the returned path, not the value, so the checked path is the path that is
read.

## Parameters

### projectRoot

`string`

Project root directory

### baseDir

`string`

Directory the value is relative to

### value

`string`

Path as written

## Returns

`string` \| `undefined`

The real path inside the project, or undefined when refused