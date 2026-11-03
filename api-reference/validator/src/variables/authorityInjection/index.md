# authorityInjection

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: authorityInjection

> `const` **authorityInjection**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/authority-injection.ts:620](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/validator/src/rules/authority-injection.ts#L620)

PS011: Detect authority injection attempts in content.

This rule identifies patterns commonly used in prompt injection attacks
where malicious content tries to establish false authority or override
existing safety measures by using authoritative-sounding language.