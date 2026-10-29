# releaseBuildCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releaseBuildCommand()

> **releaseBuildCommand**(`options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/build.ts:57](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/commands/release/build.ts#L57)

Compile the prompts and store each bundle under its content hash, then write the
manifest. A bundle file that exists is verified and never rewritten.

## Parameters

### options

`ReleaseCommandOptions`

## Returns

`Promise`\<`void`\>