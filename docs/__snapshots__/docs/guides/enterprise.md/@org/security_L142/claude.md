# CLAUDE.md

## Project

Apply ACME security standards to all code.

## Code Style

- MFA required
- Session timeout: 3600 seconds
- RBAC with least privilege principle
- Encrypt with AES-256
- Mask PII in logs
- Weekly vulnerability scanning

## Security Resources

- Security guidelines: https://wiki.acme.com/security
- Vulnerability reporting: security@acme.com
- Security review checklist: https://wiki.acme.com/security-checklist

## Don'ts

- Don't store passwords in plain text
- Don't log sensitive data
- Don't disable security features
- Don't use eval() or similar unsafe functions
- Always validate and sanitize user input
- Always use parameterized queries
