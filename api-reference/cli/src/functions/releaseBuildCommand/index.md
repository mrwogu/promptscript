# releaseBuildCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releaseBuildCommand()

> **releaseBuildCommand**(`options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/build.ts:57](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/commands/release/build.ts#L57)

Compile the prompts and store each bundle under its content hash, then write the
manifest. A bundle file that exists is verified and never rewritten.

## Parameters

### options

`ReleaseCommandOptions`

## Returns

`Promise`\<`void`\>