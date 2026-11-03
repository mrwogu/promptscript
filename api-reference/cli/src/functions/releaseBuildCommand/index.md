# releaseBuildCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releaseBuildCommand()

> **releaseBuildCommand**(`options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/build.ts:71](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/commands/release/build.ts#L71)

Compile the prompts and store each bundle under its content hash, then write the
manifest. A bundle file that exists is verified and never rewritten.

## Parameters

### options

`ReleaseCommandOptions`

## Returns

`Promise`\<`void`\>