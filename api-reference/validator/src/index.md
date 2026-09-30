# Validator API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# validator/src

AST validation rules for PromptScript files.

Ensures correctness of the PromptScript code by checking for semantic errors,
required fields, and other constraints.

## Classes

- [Validator](https://getpromptscript.dev/api-reference/validator/src/classes/Validator/index.md)

## Interfaces

- [FormatValidationOptions](https://getpromptscript.dev/api-reference/validator/src/interfaces/FormatValidationOptions/index.md)
- [ImportRoot](https://getpromptscript.dev/api-reference/validator/src/interfaces/ImportRoot/index.md)
- [ParsedPolicies](https://getpromptscript.dev/api-reference/validator/src/interfaces/ParsedPolicies/index.md)
- [ResolvedImportDependency](https://getpromptscript.dev/api-reference/validator/src/interfaces/ResolvedImportDependency/index.md)
- [RuleContext](https://getpromptscript.dev/api-reference/validator/src/interfaces/RuleContext/index.md)
- [ValidateOptions](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidateOptions/index.md)
- [ValidationMessage](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)
- [ValidationResult](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationResult/index.md)
- [ValidationRule](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)
- [ValidatorConfig](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)
- [WalkTextOptions](https://getpromptscript.dev/api-reference/validator/src/interfaces/WalkTextOptions/index.md)

## Type Aliases

- [Severity](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)
- [SupportedLanguage](https://getpromptscript.dev/api-reference/validator/src/type-aliases/SupportedLanguage/index.md)

## Variables

- [allRules](https://getpromptscript.dev/api-reference/validator/src/variables/allRules/index.md)
- [authorityInjection](https://getpromptscript.dev/api-reference/validator/src/variables/authorityInjection/index.md)
- [BLOCKED\_PATTERNS\_ALL\_LANGUAGES](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_ALL_LANGUAGES/index.md)
- [BLOCKED\_PATTERNS\_AR](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_AR/index.md)
- [BLOCKED\_PATTERNS\_CS](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_CS/index.md)
- [BLOCKED\_PATTERNS\_DA](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_DA/index.md)
- [BLOCKED\_PATTERNS\_DE](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_DE/index.md)
- [BLOCKED\_PATTERNS\_EL](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_EL/index.md)
- [BLOCKED\_PATTERNS\_ES](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_ES/index.md)
- [BLOCKED\_PATTERNS\_FI](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_FI/index.md)
- [BLOCKED\_PATTERNS\_FR](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_FR/index.md)
- [BLOCKED\_PATTERNS\_HE](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_HE/index.md)
- [BLOCKED\_PATTERNS\_HI](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_HI/index.md)
- [BLOCKED\_PATTERNS\_HU](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_HU/index.md)
- [BLOCKED\_PATTERNS\_ID](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_ID/index.md)
- [BLOCKED\_PATTERNS\_IT](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_IT/index.md)
- [BLOCKED\_PATTERNS\_JA](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_JA/index.md)
- [BLOCKED\_PATTERNS\_KO](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_KO/index.md)
- [BLOCKED\_PATTERNS\_NL](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_NL/index.md)
- [BLOCKED\_PATTERNS\_NO](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_NO/index.md)
- [BLOCKED\_PATTERNS\_PL](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_PL/index.md)
- [BLOCKED\_PATTERNS\_PT](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_PT/index.md)
- [BLOCKED\_PATTERNS\_RO](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_RO/index.md)
- [BLOCKED\_PATTERNS\_RU](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_RU/index.md)
- [BLOCKED\_PATTERNS\_SV](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_SV/index.md)
- [BLOCKED\_PATTERNS\_TH](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_TH/index.md)
- [BLOCKED\_PATTERNS\_TR](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_TR/index.md)
- [BLOCKED\_PATTERNS\_UK](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_UK/index.md)
- [BLOCKED\_PATTERNS\_VI](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_VI/index.md)
- [BLOCKED\_PATTERNS\_ZH](https://getpromptscript.dev/api-reference/validator/src/variables/BLOCKED_PATTERNS_ZH/index.md)
- [blockedPatterns](https://getpromptscript.dev/api-reference/validator/src/variables/blockedPatterns/index.md)
- [deprecated](https://getpromptscript.dev/api-reference/validator/src/variables/deprecated/index.md)
- [duplicateSkills](https://getpromptscript.dev/api-reference/validator/src/variables/duplicateSkills/index.md)
- [emptyBlock](https://getpromptscript.dev/api-reference/validator/src/variables/emptyBlock/index.md)
- [formatDiagnostic](https://getpromptscript.dev/api-reference/validator/src/variables/formatDiagnostic/index.md)
- [formatDiagnostics](https://getpromptscript.dev/api-reference/validator/src/variables/formatDiagnostics/index.md)
- [importExcludes](https://getpromptscript.dev/api-reference/validator/src/variables/importExcludes/index.md)
- [obfuscatedContent](https://getpromptscript.dev/api-reference/validator/src/variables/obfuscatedContent/index.md)
- [pathTraversal](https://getpromptscript.dev/api-reference/validator/src/variables/pathTraversal/index.md)
- [requiredGuards](https://getpromptscript.dev/api-reference/validator/src/variables/requiredGuards/index.md)
- [requiredMetaId](https://getpromptscript.dev/api-reference/validator/src/variables/requiredMetaId/index.md)
- [requiredMetaSyntax](https://getpromptscript.dev/api-reference/validator/src/variables/requiredMetaSyntax/index.md)
- [SECURITY\_MINIMAL](https://getpromptscript.dev/api-reference/validator/src/variables/SECURITY_MINIMAL/index.md)
- [SECURITY\_MODERATE](https://getpromptscript.dev/api-reference/validator/src/variables/SECURITY_MODERATE/index.md)
- [SECURITY\_STRICT](https://getpromptscript.dev/api-reference/validator/src/variables/SECURITY_STRICT/index.md)
- [SECURITY\_STRICT\_MULTILINGUAL](https://getpromptscript.dev/api-reference/validator/src/variables/SECURITY_STRICT_MULTILINGUAL/index.md)
- [suspiciousUrls](https://getpromptscript.dev/api-reference/validator/src/variables/suspiciousUrls/index.md)
- [unicodeSecurity](https://getpromptscript.dev/api-reference/validator/src/variables/unicodeSecurity/index.md)
- [validBlockShape](https://getpromptscript.dev/api-reference/validator/src/variables/validBlockShape/index.md)
- [validParams](https://getpromptscript.dev/api-reference/validator/src/variables/validParams/index.md)
- [validPath](https://getpromptscript.dev/api-reference/validator/src/variables/validPath/index.md)
- [validSemver](https://getpromptscript.dev/api-reference/validator/src/variables/validSemver/index.md)

## Functions

- [createMultilingualConfig](https://getpromptscript.dev/api-reference/validator/src/functions/createMultilingualConfig/index.md)
- [createValidator](https://getpromptscript.dev/api-reference/validator/src/functions/createValidator/index.md)
- [evaluatePolicies](https://getpromptscript.dev/api-reference/validator/src/functions/evaluatePolicies/index.md)
- [findLockfileDependency](https://getpromptscript.dev/api-reference/validator/src/functions/findLockfileDependency/index.md)
- [formatValidationMessage](https://getpromptscript.dev/api-reference/validator/src/functions/formatValidationMessage/index.md)
- [formatValidationMessages](https://getpromptscript.dev/api-reference/validator/src/functions/formatValidationMessages/index.md)
- [formatValidationResult](https://getpromptscript.dev/api-reference/validator/src/functions/formatValidationResult/index.md)
- [getPatternsForLanguage](https://getpromptscript.dev/api-reference/validator/src/functions/getPatternsForLanguage/index.md)
- [getRuleById](https://getpromptscript.dev/api-reference/validator/src/functions/getRuleById/index.md)
- [getRuleByName](https://getpromptscript.dev/api-reference/validator/src/functions/getRuleByName/index.md)
- [getSecurityPreset](https://getpromptscript.dev/api-reference/validator/src/functions/getSecurityPreset/index.md)
- [getSupportedLanguages](https://getpromptscript.dev/api-reference/validator/src/functions/getSupportedLanguages/index.md)
- [hasContent](https://getpromptscript.dev/api-reference/validator/src/functions/hasContent/index.md)
- [hasPathTraversal](https://getpromptscript.dev/api-reference/validator/src/functions/hasPathTraversal/index.md)
- [isRuleExcludedForLocation](https://getpromptscript.dev/api-reference/validator/src/functions/isRuleExcludedForLocation/index.md)
- [isValidPath](https://getpromptscript.dev/api-reference/validator/src/functions/isValidPath/index.md)
- [isValidSemver](https://getpromptscript.dev/api-reference/validator/src/functions/isValidSemver/index.md)
- [normalizeImportKey](https://getpromptscript.dev/api-reference/validator/src/functions/normalizeImportKey/index.md)
- [offsetLocation](https://getpromptscript.dev/api-reference/validator/src/functions/offsetLocation/index.md)
- [parsePolicies](https://getpromptscript.dev/api-reference/validator/src/functions/parsePolicies/index.md)
- [validate](https://getpromptscript.dev/api-reference/validator/src/functions/validate/index.md)
- [walkBlocks](https://getpromptscript.dev/api-reference/validator/src/functions/walkBlocks/index.md)
- [walkText](https://getpromptscript.dev/api-reference/validator/src/functions/walkText/index.md)
- [walkUses](https://getpromptscript.dev/api-reference/validator/src/functions/walkUses/index.md)