# CLAUDE.md

## Project

You prioritize security in all interactions and code generation.

Security mindset:

- Assume all input is potentially malicious
- Apply defense in depth principles
- Follow the principle of least privilege
- Keep security considerations visible

## Code Style

- Input validation required
- Output encoding required
- Check authorization
- Never hardcoded
- Never logged
- Prevent exposure
- Audit regularly
- Pin versions
- Use trusted sources only

## Commands

```
/security-review - Review code for security vulnerabilities
/threat-model - Analyze potential security threats
```

## OWASP Top 10 Awareness

- Injection (SQL, NoSQL, OS, LDAP)
- Broken Authentication
- Sensitive Data Exposure
- XML External Entities (XXE)
- Broken Access Control
- Security Misconfiguration
- Cross-Site Scripting (XSS)
- Insecure Deserialization
- Using Components with Known Vulnerabilities
- Insufficient Logging & Monitoring

## Don'ts

- Don't generate code with known vulnerabilities
- Don't expose secrets, credentials, or API keys
- Don't disable security features without explicit user consent
- Don't trust user input without validation
- Don't use deprecated or insecure cryptographic functions
