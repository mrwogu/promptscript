# createSimpleMarkdownFormatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createSimpleMarkdownFormatter()

> **createSimpleMarkdownFormatter**(`opts`): [`SimpleFormatterResult`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterResult/index.md)

Defined in: [formatters/src/create-simple-formatter.ts:178](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L178)

Factory that creates a concrete `MarkdownInstructionFormatter` subclass
and its companion `VERSIONS` constant from a small set of parameters.

Every formatter produced by this factory has identical runtime behaviour
to the hand-written classes it replaces --- no method overrides, just
different constructor config.

## Parameters

### opts

[`SimpleFormatterOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterOptions/index.md)

## Returns

[`SimpleFormatterResult`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterResult/index.md)

## Example

```ts
export const { Formatter: WindsurfFormatter, VERSIONS: WINDSURF_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'windsurf',
    outputPath: '.windsurf/rules/project.md',
    description: 'Windsurf rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.windsurf',
  });
export type WindsurfVersion = 'simple' | 'multifile' | 'full';
```