# authorityInjection

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: authorityInjection

> `const` **authorityInjection**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/authority-injection.ts:620](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/rules/authority-injection.ts#L620)

PS011: Detect authority injection attempts in content.

This rule identifies patterns commonly used in prompt injection attacks
where malicious content tries to establish false authority or override
existing safety measures by using authoritative-sounding language.