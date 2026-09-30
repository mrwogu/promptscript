# Resolver API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# resolver/src

Inheritance and import resolution for PromptScript files.

Handles file loading, dependency resolution, and merging of inherited properties
to produce a fully resolved AST.

## Classes

- [CompositeRegistry](https://getpromptscript.dev/api-reference/resolver/src/classes/CompositeRegistry/index.md)
- [FileLoader](https://getpromptscript.dev/api-reference/resolver/src/classes/FileLoader/index.md)
- [FileSystemRegistry](https://getpromptscript.dev/api-reference/resolver/src/classes/FileSystemRegistry/index.md)
- [GitAuthError](https://getpromptscript.dev/api-reference/resolver/src/classes/GitAuthError/index.md)
- [GitCacheManager](https://getpromptscript.dev/api-reference/resolver/src/classes/GitCacheManager/index.md)
- [GitCloneError](https://getpromptscript.dev/api-reference/resolver/src/classes/GitCloneError/index.md)
- [GitRefNotFoundError](https://getpromptscript.dev/api-reference/resolver/src/classes/GitRefNotFoundError/index.md)
- [GitRegistry](https://getpromptscript.dev/api-reference/resolver/src/classes/GitRegistry/index.md)
- [HttpRegistry](https://getpromptscript.dev/api-reference/resolver/src/classes/HttpRegistry/index.md)
- [RegistryCache](https://getpromptscript.dev/api-reference/resolver/src/classes/RegistryCache/index.md)
- [Resolver](https://getpromptscript.dev/api-reference/resolver/src/classes/Resolver/index.md)
- [VendorRegistry](https://getpromptscript.dev/api-reference/resolver/src/classes/VendorRegistry/index.md)

## Interfaces

- [BlockFilterOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/BlockFilterOptions/index.md)
- [CacheEntry](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheEntry/index.md)
- [CacheMetadata](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheMetadata/index.md)
- [CollectedSkillResources](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CollectedSkillResources/index.md)
- [CompositeRegistryOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CompositeRegistryOptions/index.md)
- [CompositionOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CompositionOptions/index.md)
- [ExpandedAlias](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ExpandedAlias/index.md)
- [FileSystemRegistryOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/FileSystemRegistryOptions/index.md)
- [GitAuthOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitAuthOptions/index.md)
- [GitCacheManagerOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitCacheManagerOptions/index.md)
- [GitRegistryOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitRegistryOptions/index.md)
- [GuardRequiresOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GuardRequiresOptions/index.md)
- [HttpRegistryOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/HttpRegistryOptions/index.md)
- [LoaderOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/LoaderOptions/index.md)
- [NativeSkillOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/NativeSkillOptions/index.md)
- [ParsedGitUrl](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedGitUrl/index.md)
- [ParsedSkillMd](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedSkillMd/index.md)
- [ParsedVersionedPath](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedVersionedPath/index.md)
- [RegistriesValidationResult](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RegistriesValidationResult/index.md)
- [Registry](https://getpromptscript.dev/api-reference/resolver/src/interfaces/Registry/index.md)
- [RemoteValidation](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RemoteValidation/index.md)
- [RemoteValidationOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/RemoteValidationOptions/index.md)
- [ReservedParamsResult](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ReservedParamsResult/index.md)
- [ResolvedAST](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolvedAST/index.md)
- [ResolveOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolveOptions/index.md)
- [ResolverOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)
- [SkillFilterOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFilterOptions/index.md)
- [SkillFrontmatterBlock](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFrontmatterBlock/index.md)
- [SkillFrontmatterLocations](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFrontmatterLocations/index.md)
- [SkillValidationIssue](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationIssue/index.md)
- [SkillValidationOptions](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationOptions/index.md)
- [SkillValidationResult](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationResult/index.md)
- [VendorManifest](https://getpromptscript.dev/api-reference/resolver/src/interfaces/VendorManifest/index.md)
- [VendorManifestEntry](https://getpromptscript.dev/api-reference/resolver/src/interfaces/VendorManifestEntry/index.md)

## Type Aliases

- [ContentType](https://getpromptscript.dev/api-reference/resolver/src/type-aliases/ContentType/index.md)
- [SkillValidationSeverity](https://getpromptscript.dev/api-reference/resolver/src/type-aliases/SkillValidationSeverity/index.md)

## Variables

- [DEFAULT\_GIT\_TIMEOUT\_MS](https://getpromptscript.dev/api-reference/resolver/src/variables/DEFAULT_GIT_TIMEOUT_MS/index.md)
- [GIT\_TIMEOUT\_ENV\_VAR](https://getpromptscript.dev/api-reference/resolver/src/variables/GIT_TIMEOUT_ENV_VAR/index.md)
- [REGISTRY\_MARKER\_PREFIX](https://getpromptscript.dev/api-reference/resolver/src/variables/REGISTRY_MARKER_PREFIX/index.md)
- [resolveUses](https://getpromptscript.dev/api-reference/resolver/src/variables/resolveUses/index.md)
- [VENDOR\_GIT\_DIR](https://getpromptscript.dev/api-reference/resolver/src/variables/VENDOR_GIT_DIR/index.md)
- [VENDOR\_MANIFEST\_FILE](https://getpromptscript.dev/api-reference/resolver/src/variables/VENDOR_MANIFEST_FILE/index.md)
- [VIRTUAL\_LOC](https://getpromptscript.dev/api-reference/resolver/src/variables/VIRTUAL_LOC/index.md)

## Functions

- [applyExtends](https://getpromptscript.dev/api-reference/resolver/src/functions/applyExtends/index.md)
- [buildAuthenticatedUrl](https://getpromptscript.dev/api-reference/resolver/src/functions/buildAuthenticatedUrl/index.md)
- [buildReferenceKey](https://getpromptscript.dev/api-reference/resolver/src/functions/buildReferenceKey/index.md)
- [buildRegistryMarker](https://getpromptscript.dev/api-reference/resolver/src/functions/buildRegistryMarker/index.md)
- [collectSkillResources](https://getpromptscript.dev/api-reference/resolver/src/functions/collectSkillResources/index.md)
- [createCompositeRegistry](https://getpromptscript.dev/api-reference/resolver/src/functions/createCompositeRegistry/index.md)
- [createFileSystemRegistry](https://getpromptscript.dev/api-reference/resolver/src/functions/createFileSystemRegistry/index.md)
- [createGitCacheManager](https://getpromptscript.dev/api-reference/resolver/src/functions/createGitCacheManager/index.md)
- [createGitRegistry](https://getpromptscript.dev/api-reference/resolver/src/functions/createGitRegistry/index.md)
- [createHttpRegistry](https://getpromptscript.dev/api-reference/resolver/src/functions/createHttpRegistry/index.md)
- [createResolver](https://getpromptscript.dev/api-reference/resolver/src/functions/createResolver/index.md)
- [createVendorRegistry](https://getpromptscript.dev/api-reference/resolver/src/functions/createVendorRegistry/index.md)
- [detectContentType](https://getpromptscript.dev/api-reference/resolver/src/functions/detectContentType/index.md)
- [discoverNativeContent](https://getpromptscript.dev/api-reference/resolver/src/functions/discoverNativeContent/index.md)
- [expandAlias](https://getpromptscript.dev/api-reference/resolver/src/functions/expandAlias/index.md)
- [extractReservedParams](https://getpromptscript.dev/api-reference/resolver/src/functions/extractReservedParams/index.md)
- [extractSkillFrontmatter](https://getpromptscript.dev/api-reference/resolver/src/functions/extractSkillFrontmatter/index.md)
- [filterBlocks](https://getpromptscript.dev/api-reference/resolver/src/functions/filterBlocks/index.md)
- [filterSkillsBlock](https://getpromptscript.dev/api-reference/resolver/src/functions/filterSkillsBlock/index.md)
- [findFallbackUrl](https://getpromptscript.dev/api-reference/resolver/src/functions/findFallbackUrl/index.md)
- [findRegistryEntry](https://getpromptscript.dev/api-reference/resolver/src/functions/findRegistryEntry/index.md)
- [formatSkillValidationIssues](https://getpromptscript.dev/api-reference/resolver/src/functions/formatSkillValidationIssues/index.md)
- [getCacheKey](https://getpromptscript.dev/api-reference/resolver/src/functions/getCacheKey/index.md)
- [getImportAlias](https://getpromptscript.dev/api-reference/resolver/src/functions/getImportAlias/index.md)
- [getOriginalBlockName](https://getpromptscript.dev/api-reference/resolver/src/functions/getOriginalBlockName/index.md)
- [getSkillFrontmatterLocations](https://getpromptscript.dev/api-reference/resolver/src/functions/getSkillFrontmatterLocations/index.md)
- [getVendorRepositoryRelativePath](https://getpromptscript.dev/api-reference/resolver/src/functions/getVendorRepositoryRelativePath/index.md)
- [getWebUrl](https://getpromptscript.dev/api-reference/resolver/src/functions/getWebUrl/index.md)
- [hashContent](https://getpromptscript.dev/api-reference/resolver/src/functions/hashContent/index.md)
- [hashVendorRepository](https://getpromptscript.dev/api-reference/resolver/src/functions/hashVendorRepository/index.md)
- [interpolateSkillContent](https://getpromptscript.dev/api-reference/resolver/src/functions/interpolateSkillContent/index.md)
- [isGitUrl](https://getpromptscript.dev/api-reference/resolver/src/functions/isGitUrl/index.md)
- [isImportMarker](https://getpromptscript.dev/api-reference/resolver/src/functions/isImportMarker/index.md)
- [isInsideCachePath](https://getpromptscript.dev/api-reference/resolver/src/functions/isInsideCachePath/index.md)
- [isKnownGitHost](https://getpromptscript.dev/api-reference/resolver/src/functions/isKnownGitHost/index.md)
- [isRealPathInside](https://getpromptscript.dev/api-reference/resolver/src/functions/isRealPathInside/index.md)
- [isSemverRange](https://getpromptscript.dev/api-reference/resolver/src/functions/isSemverRange/index.md)
- [isValidVendorManifest](https://getpromptscript.dev/api-reference/resolver/src/functions/isValidVendorManifest/index.md)
- [loadVendorManifest](https://getpromptscript.dev/api-reference/resolver/src/functions/loadVendorManifest/index.md)
- [makeBlock](https://getpromptscript.dev/api-reference/resolver/src/functions/makeBlock/index.md)
- [makeObjectContent](https://getpromptscript.dev/api-reference/resolver/src/functions/makeObjectContent/index.md)
- [makeTextContent](https://getpromptscript.dev/api-reference/resolver/src/functions/makeTextContent/index.md)
- [normalizeGitUrl](https://getpromptscript.dev/api-reference/resolver/src/functions/normalizeGitUrl/index.md)
- [parseGitUrl](https://getpromptscript.dev/api-reference/resolver/src/functions/parseGitUrl/index.md)
- [parseRegistryMarker](https://getpromptscript.dev/api-reference/resolver/src/functions/parseRegistryMarker/index.md)
- [parseSkillMd](https://getpromptscript.dev/api-reference/resolver/src/functions/parseSkillMd/index.md)
- [parseVersionedPath](https://getpromptscript.dev/api-reference/resolver/src/functions/parseVersionedPath/index.md)
- [resolve](https://getpromptscript.dev/api-reference/resolver/src/functions/resolve/index.md)
- [resolveGuardRequires](https://getpromptscript.dev/api-reference/resolver/src/functions/resolveGuardRequires/index.md)
- [resolveInheritance](https://getpromptscript.dev/api-reference/resolver/src/functions/resolveInheritance/index.md)
- [resolveNativeCommands](https://getpromptscript.dev/api-reference/resolver/src/functions/resolveNativeCommands/index.md)
- [resolveNativeSkills](https://getpromptscript.dev/api-reference/resolver/src/functions/resolveNativeSkills/index.md)
- [resolveSkillComposition](https://getpromptscript.dev/api-reference/resolver/src/functions/resolveSkillComposition/index.md)
- [resolveVendoredRepository](https://getpromptscript.dev/api-reference/resolver/src/functions/resolveVendoredRepository/index.md)
- [skillNameFromPath](https://getpromptscript.dev/api-reference/resolver/src/functions/skillNameFromPath/index.md)
- [toSkillResourceValues](https://getpromptscript.dev/api-reference/resolver/src/functions/toSkillResourceValues/index.md)
- [validateAlias](https://getpromptscript.dev/api-reference/resolver/src/functions/validateAlias/index.md)
- [validateRegistriesConfig](https://getpromptscript.dev/api-reference/resolver/src/functions/validateRegistriesConfig/index.md)
- [validateRemoteAccess](https://getpromptscript.dev/api-reference/resolver/src/functions/validateRemoteAccess/index.md)
- [validateSkillFrontmatter](https://getpromptscript.dev/api-reference/resolver/src/functions/validateSkillFrontmatter/index.md)
- [verifyGitRepositoryCheckout](https://getpromptscript.dev/api-reference/resolver/src/functions/verifyGitRepositoryCheckout/index.md)
- [verifyVendoredGitRepository](https://getpromptscript.dev/api-reference/resolver/src/functions/verifyVendoredGitRepository/index.md)
- [versionSatisfiesRange](https://getpromptscript.dev/api-reference/resolver/src/functions/versionSatisfiesRange/index.md)

## References

### bindParams

Re-exports [bindParams](https://getpromptscript.dev/api-reference/core/src/functions/bindParams/index.md)

***

### IMPORT\_MARKER\_PREFIX

Re-exports [IMPORT_MARKER_PREFIX](https://getpromptscript.dev/api-reference/core/src/variables/IMPORT_MARKER_PREFIX/index.md)

***

### interpolateAST

Re-exports [interpolateAST](https://getpromptscript.dev/api-reference/core/src/functions/interpolateAST/index.md)

***

### interpolateContent

Re-exports [interpolateContent](https://getpromptscript.dev/api-reference/core/src/functions/interpolateContent/index.md)

***

### interpolateText

Re-exports [interpolateText](https://getpromptscript.dev/api-reference/core/src/functions/interpolateText/index.md)

***

### isTemplateExpression

Re-exports [isTemplateExpression](https://getpromptscript.dev/api-reference/core/src/functions/isTemplateExpression/index.md)

***

### normalizeBlockAliases

Re-exports [normalizeBlockAliases](https://getpromptscript.dev/api-reference/core/src/functions/normalizeBlockAliases/index.md)

***

### TemplateContext

Re-exports [TemplateContext](https://getpromptscript.dev/api-reference/core/src/interfaces/TemplateContext/index.md)