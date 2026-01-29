# GitHub Copilot Instructions

## project

Apply ACME security standards to all code.
Security is everyone's responsibility.

## donts

- Don't store passwords in plain text
- Don't log sensitive data (passwords, tokens, PII)
- Don't use MD5 or SHA1 for security purposes
- Don't disable TLS certificate verification
- Don't use eval() or similar unsafe functions
- Don't trust user input without validation
- Don't expose stack traces in production
- Always use parameterized queries (no SQL concatenation)
- Always validate and sanitize file uploads
- Always implement rate limiting for APIs
