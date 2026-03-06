---
name: 'security-auditing'
description: 'Audits code for security vulnerabilities'
---

<!-- PromptScript 2026-03-04T16:49:01.160Z - do not edit -->

## OWASP Top 10 Quick Check

1. **Injection** - Parameterized queries
2. **Authentication** - Strong hashing, rate limiting
3. **Data Exposure** - Encryption, no secrets in code
4. **XXE** - Disable external entities
5. **Access Control** - Check on every request
6. **Misconfiguration** - No debug in prod
7. **XSS** - Output encoding, CSP
8. **Deserialization** - Don't trust input
9. **Dependencies** - Keep updated, audit
10. **Logging** - Log security events
