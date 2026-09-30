# unicodeSecurity

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: unicodeSecurity

> `const` **unicodeSecurity**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/unicode-security.ts:236](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/rules/unicode-security.ts#L236)

PS014: Detect Unicode-based security attacks.

This rule identifies potentially malicious use of Unicode features that
can hide or disguise content:

1. Bidirectional override characters (RTL/LTR overrides)
2. Zero-width characters that can break pattern matching
3. Homograph attacks (Cyrillic/Greek characters mixed with Latin)
4. Excessive combining characters (Zalgo text)

Note: Legitimate multilingual content (pure Arabic, Hebrew, Russian, etc.)
is NOT flagged. Only suspicious patterns are reported.