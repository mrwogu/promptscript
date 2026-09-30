# suspiciousUrls

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: suspiciousUrls

> `const` **suspiciousUrls**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/suspicious-urls.ts:288](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/rules/suspicious-urls.ts#L288)

PS010: Detect suspicious URLs that may indicate security risks.

This rule flags:
- HTTP URLs (non-HTTPS) which may expose data in transit
- URL shorteners which can obscure malicious destinations
- URLs with suspicious query parameters that may exfiltrate credentials
- IDN homograph attacks (punycode domains impersonating popular services)
- Mixed script domains (Latin + Cyrillic) that may be deceptive