# CLI API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# cli/src

Command-line interface for PromptScript.

Compile, validate, and manage AI instructions at enterprise scale.
main entry point for the CLI application.

## Enumerations

- [LogLevel](https://getpromptscript.dev/api-reference/cli/src/enumerations/LogLevel/index.md)

## Interfaces

- [BuildCompilationDiffOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/BuildCompilationDiffOptions/index.md)
- [CheckOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/CheckOptions/index.md)
- [CLIContext](https://getpromptscript.dev/api-reference/cli/src/interfaces/CLIContext/index.md)
- [CompilationDiffChange](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)
- [CompilationDiffReport](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffReport/index.md)
- [CompilationDiffSummary](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffSummary/index.md)
- [CompileOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompileOptions/index.md)
- [DiffLocation](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffLocation/index.md)
- [DiffOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffOptions/index.md)
- [DiffWarning](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)
- [ImportCommandOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/ImportCommandOptions/index.md)
- [InitOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/InitOptions/index.md)
- [PullOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/PullOptions/index.md)
- [UpdateInfo](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md)
- [ValidateOptions](https://getpromptscript.dev/api-reference/cli/src/interfaces/ValidateOptions/index.md)

## Type Aliases

- [DiffChangeKind](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffChangeKind/index.md)
- [DiffOwnership](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffOwnership/index.md)

## Variables

- [CONFIG\_FILES](https://getpromptscript.dev/api-reference/cli/src/variables/CONFIG_FILES/index.md)
- [ConsoleOutput](https://getpromptscript.dev/api-reference/cli/src/variables/ConsoleOutput/index.md)
- [DIFF\_SCHEMA\_URL](https://getpromptscript.dev/api-reference/cli/src/variables/DIFF_SCHEMA_URL/index.md)
- [DIFF\_SCHEMA\_VERSION](https://getpromptscript.dev/api-reference/cli/src/variables/DIFF_SCHEMA_VERSION/index.md)

## Functions

- [buildCompilationDiff](https://getpromptscript.dev/api-reference/cli/src/functions/buildCompilationDiff/index.md)
- [checkCommand](https://getpromptscript.dev/api-reference/cli/src/functions/checkCommand/index.md)
- [checkForUpdates](https://getpromptscript.dev/api-reference/cli/src/functions/checkForUpdates/index.md)
- [compileCommand](https://getpromptscript.dev/api-reference/cli/src/functions/compileCommand/index.md)
- [createCompilationDiffErrorReport](https://getpromptscript.dev/api-reference/cli/src/functions/createCompilationDiffErrorReport/index.md)
- [createSpinner](https://getpromptscript.dev/api-reference/cli/src/functions/createSpinner/index.md)
- [diffCommand](https://getpromptscript.dev/api-reference/cli/src/functions/diffCommand/index.md)
- [fetchLatestVersion](https://getpromptscript.dev/api-reference/cli/src/functions/fetchLatestVersion/index.md)
- [findConfigFile](https://getpromptscript.dev/api-reference/cli/src/functions/findConfigFile/index.md)
- [forceCheckForUpdates](https://getpromptscript.dev/api-reference/cli/src/functions/forceCheckForUpdates/index.md)
- [getCacheDir](https://getpromptscript.dev/api-reference/cli/src/functions/getCacheDir/index.md)
- [getCachePath](https://getpromptscript.dev/api-reference/cli/src/functions/getCachePath/index.md)
- [getContext](https://getpromptscript.dev/api-reference/cli/src/functions/getContext/index.md)
- [importCommand](https://getpromptscript.dev/api-reference/cli/src/functions/importCommand/index.md)
- [initCommand](https://getpromptscript.dev/api-reference/cli/src/functions/initCommand/index.md)
- [isQuiet](https://getpromptscript.dev/api-reference/cli/src/functions/isQuiet/index.md)
- [isVerbose](https://getpromptscript.dev/api-reference/cli/src/functions/isVerbose/index.md)
- [loadConfig](https://getpromptscript.dev/api-reference/cli/src/functions/loadConfig/index.md)
- [printUpdateNotification](https://getpromptscript.dev/api-reference/cli/src/functions/printUpdateNotification/index.md)
- [pullCommand](https://getpromptscript.dev/api-reference/cli/src/functions/pullCommand/index.md)
- [run](https://getpromptscript.dev/api-reference/cli/src/functions/run/index.md)
- [setContext](https://getpromptscript.dev/api-reference/cli/src/functions/setContext/index.md)
- [updateCheckCommand](https://getpromptscript.dev/api-reference/cli/src/functions/updateCheckCommand/index.md)
- [validateCommand](https://getpromptscript.dev/api-reference/cli/src/functions/validateCommand/index.md)