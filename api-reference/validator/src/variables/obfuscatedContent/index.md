# obfuscatedContent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: obfuscatedContent

> `const` **obfuscatedContent**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/obfuscated-content.ts:620](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/validator/src/rules/obfuscated-content.ts#L620)

PS012: Detect obfuscated content that may hide malicious instructions.

This rule implements a Sanitization Pipeline that:
1. Detects multiple encoding formats (Base64, hex, unicode, URL, HTML entities, binary, ROT13)
2. Decodes the content
3. Checks for security patterns in the decoded content

This approach prevents bypass attacks where malicious content is encoded
to evade signature-based detection.