# CLAUDE.md

## Project

Apply ACME security standards to all code.
Security is everyone's responsibility.

## Code Style

- Use OAuth 2.0 / OIDC
- MFA required (TOTP or WebAuthn)
- Session timeout: 3600 seconds
- Enable refresh token rotation
- RBAC with ABAC extensions
- Apply least privilege principle
- Audit logging required
- Encrypt at rest with AES-256
- Encrypt in transit with TLS 1.3
- Mask PII in all outputs
- Follow data classification for retention
- Daily vulnerability scanning
- Critical vulnerabilities block deployment
- High vulnerabilities: fix within 7 days
- Medium vulnerabilities: fix within 30 days
- Store in HashiCorp Vault
- Rotate every 90 days
- Never store secrets in code

## Commands

```
/threat-model - Help create a threat model
/vuln-check - Check for common vulnerabilities
/secure-code - Review code for security issues
```

## Don'ts

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
