# releaseBuildCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releaseBuildCommand()

> **releaseBuildCommand**(`options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/build.ts:71](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/commands/release/build.ts#L71)

Compile the prompts and store each bundle under its content hash, then write the
manifest. A bundle file that exists is verified and never rewritten.

## Parameters

### options

`ReleaseCommandOptions`

## Returns

`Promise`\<`void`\>