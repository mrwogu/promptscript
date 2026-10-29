# CLIContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CLIContext

Defined in: [cli/src/output/console.ts:21](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/output/console.ts#L21)

Global CLI context for sharing state across commands.

## Properties

### colors

> **colors**: `boolean`

Defined in: [cli/src/output/console.ts:25](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/output/console.ts#L25)

Whether colors are enabled

***

### logLevel

> **logLevel**: [`LogLevel`](https://getpromptscript.dev/api-reference/cli/src/enumerations/LogLevel/index.md)

Defined in: [cli/src/output/console.ts:23](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/output/console.ts#L23)

Current log level

***

### outputStream

> **outputStream**: `"stdout"` \| `"stderr"`

Defined in: [cli/src/output/console.ts:27](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/output/console.ts#L27)

Stream for human-readable command output