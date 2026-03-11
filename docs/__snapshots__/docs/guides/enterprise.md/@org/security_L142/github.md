# GitHub Copilot Instructions

## project

Apply ACME security standards to all code.

## code-standards

### security

- MFA required
- Session timeout: 3600 seconds
- RBAC with least privilege principle
- Encrypt with AES-256
- Mask PII in logs
- Weekly vulnerability scanning

## donts

- Don't store passwords in plain text
- Don't log sensitive data
- Don't disable security features
- Don't use eval() or similar unsafe functions
- Always validate and sanitize user input
- Always use parameterized queries
