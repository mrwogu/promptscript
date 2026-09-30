# Browser Compiler API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# browser-compiler/src

Browser-compatible PromptScript compiler.

Provides in-memory compilation for browser environments (playgrounds, web editors).
Uses a virtual file system instead of Node.js fs operations.

## Example

```typescript
import { compile, VirtualFileSystem, getBundledRegistryFiles } from '@promptscript/browser-compiler';

// Create virtual file system with project files
const files = new Map([
  ['project.prs', `
    @meta { id: "my-project" syntax: "1.0.0" }
    @identity { """You are a helpful assistant.""" }
  `],
]);

// Optionally add bundled registry files for @inherit support
const registry = getBundledRegistryFiles();
for (const [path, content] of Object.entries(registry)) {
  files.set(path, content);
}

// Compile
const result = await compile(files, 'project.prs');

if (result.success) {
  for (const [outputPath, output] of result.outputs) {
    console.log(`${outputPath}:`, output.content);
  }
} else {
  console.error('Compilation errors:', result.errors);
}
```

## Classes

- [BrowserCompiler](https://getpromptscript.dev/api-reference/browser-compiler/src/classes/BrowserCompiler/index.md)
- [BrowserResolver](https://getpromptscript.dev/api-reference/browser-compiler/src/classes/BrowserResolver/index.md)
- [VirtualFileSystem](https://getpromptscript.dev/api-reference/browser-compiler/src/classes/VirtualFileSystem/index.md)

## Interfaces

- [BrowserCompilerOptions](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/BrowserCompilerOptions/index.md)
- [BrowserResolverOptions](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/BrowserResolverOptions/index.md)
- [CompileError](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileError/index.md)
- [CompileOptions](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileOptions/index.md)
- [CompileResult](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)
- [CompileStats](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileStats/index.md)
- [ResolvedAST](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/ResolvedAST/index.md)
- [TargetConfig](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/TargetConfig/index.md)

## Type Aliases

- [CompileWarning](https://getpromptscript.dev/api-reference/browser-compiler/src/type-aliases/CompileWarning/index.md)
- [~~FormatterName~~](https://getpromptscript.dev/api-reference/browser-compiler/src/type-aliases/FormatterName/index.md)

## Variables

- [BUNDLED\_REGISTRY](https://getpromptscript.dev/api-reference/browser-compiler/src/variables/BUNDLED_REGISTRY/index.md)
- [CORE\_BASE](https://getpromptscript.dev/api-reference/browser-compiler/src/variables/CORE_BASE/index.md)
- [CORE\_QUALITY](https://getpromptscript.dev/api-reference/browser-compiler/src/variables/CORE_QUALITY/index.md)
- [CORE\_SECURITY](https://getpromptscript.dev/api-reference/browser-compiler/src/variables/CORE_SECURITY/index.md)

## Functions

- [compile](https://getpromptscript.dev/api-reference/browser-compiler/src/functions/compile/index.md)
- [compileFor](https://getpromptscript.dev/api-reference/browser-compiler/src/functions/compileFor/index.md)

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