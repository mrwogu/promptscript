# Compiler API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# compiler/src

Pipeline orchestration for PromptScript compilation.

This package coordinates the parsing, resolving, validating, and formatting
steps to transform PromptScript into usable artifacts.

## Classes

- [Compiler](https://getpromptscript.dev/api-reference/compiler/src/classes/Compiler/index.md)

## Interfaces

- [CanonicalFormatter](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CanonicalFormatter/index.md)
- [CompileError](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileError/index.md)
- [CompileOptions](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileOptions/index.md)
- [CompileResult](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)
- [CompilerOptions](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompilerOptions/index.md)
- [CompileStats](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileStats/index.md)
- [FormatOptions](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatOptions/index.md)
- [Formatter](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md)
- [FormatterOutput](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)
- [TargetConfig](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md)
- [Watcher](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Watcher/index.md)
- [WatchOptions](https://getpromptscript.dev/api-reference/compiler/src/interfaces/WatchOptions/index.md)

## Type Aliases

- [FormatterConstructor](https://getpromptscript.dev/api-reference/compiler/src/type-aliases/FormatterConstructor/index.md)
- [LegacyFormatter](https://getpromptscript.dev/api-reference/compiler/src/type-aliases/LegacyFormatter/index.md)
- [WatchCallback](https://getpromptscript.dev/api-reference/compiler/src/type-aliases/WatchCallback/index.md)

## Variables

- [MAX\_ENTRY\_RESOLVERS](https://getpromptscript.dev/api-reference/compiler/src/variables/MAX_ENTRY_RESOLVERS/index.md)

## Functions

- [compile](https://getpromptscript.dev/api-reference/compiler/src/functions/compile/index.md)
- [createCompiler](https://getpromptscript.dev/api-reference/compiler/src/functions/createCompiler/index.md)

## References

### createOutputPlan

Re-exports [createOutputPlan](https://getpromptscript.dev/api-reference/core/src/functions/createOutputPlan/index.md)

***

### normalizeOutputCollisionKey

Re-exports [normalizeOutputCollisionKey](https://getpromptscript.dev/api-reference/core/src/functions/normalizeOutputCollisionKey/index.md)

***

### normalizeOutputPath

Re-exports [normalizeOutputPath](https://getpromptscript.dev/api-reference/core/src/functions/normalizeOutputPath/index.md)

***

### OutputArtifact

Re-exports [OutputArtifact](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

***

### OutputPlan

Re-exports [OutputPlan](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)

***

### OutputPlanArtifactRole

Re-exports [OutputPlanArtifactRole](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanArtifactRole/index.md)

***

### OutputPlanCandidate

Re-exports [OutputPlanCandidate](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanCandidate/index.md)

***

### OutputPlanCollision

Re-exports [OutputPlanCollision](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanCollision/index.md)

***

### OutputPlanCollisionResolution

Re-exports [OutputPlanCollisionResolution](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanCollisionResolution/index.md)

***

### OutputPlanFile

Re-exports [OutputPlanFile](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)

***

### OutputPlanManagedPaths

Re-exports [OutputPlanManagedPaths](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanManagedPaths/index.md)

***

### OutputPlanPathError

Re-exports [OutputPlanPathError](https://getpromptscript.dev/api-reference/core/src/classes/OutputPlanPathError/index.md)