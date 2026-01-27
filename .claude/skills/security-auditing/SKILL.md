---
name: 'security-auditing'
description: 'Audits code for security vulnerabilities and OWASP issues. Use when reviewing security, checking for vulnerabilities, or when asked to audit code security.'
---

<!-- PromptScript 2026-01-27T11:20:31.603Z - do not edit -->

# Security Auditing

## OWASP Top 10 Checklist

### 1. Injection

- [ ] SQL queries use parameterized statements
- [ ] Shell commands don't include user input
- [ ] LDAP/XPath queries are sanitized

```typescript
// VULNERABLE - SQL injection
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// SAFE - parameterized query
db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 2. Broken Authentication

- [ ] Passwords hashed with bcrypt/argon2
- [ ] Session tokens are secure random
- [ ] Rate limiting on auth endpoints
- [ ] MFA supported for sensitive operations

### 3. Sensitive Data Exposure

- [ ] No secrets in code or logs
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted at rest
- [ ] PII masked in logs

### 4. XML External Entities (XXE)

- [ ] XML parsers disable external entities
- [ ] DTD processing disabled

### 5. Broken Access Control

- [ ] Authorization checked on every request
- [ ] No direct object references exposed
- [ ] CORS configured correctly

### 6. Security Misconfiguration

- [ ] Debug mode disabled in production
- [ ] Default credentials changed
- [ ] Security headers configured

### 7. Cross-Site Scripting (XSS)

- [ ] Output encoding applied
- [ ] CSP headers configured
- [ ] User input sanitized
- [ ] Use textContent instead of innerHTML for user data

### 8. Insecure Deserialization

- [ ] No untrusted data deserialized
- [ ] Type checking on deserialized data

### 9. Known Vulnerabilities

- [ ] Dependencies up to date
- [ ] `npm audit` / `pip check` clean
- [ ] No deprecated packages

### 10. Insufficient Logging

- [ ] Security events logged
- [ ] No sensitive data in logs
- [ ] Log integrity protected

## Quick Checks

```bash
# Check for secrets in code
grep -r "password\|secret\|api_key\|token" --include="*.ts" src/

# Check dependencies
npm audit
```

## Report Format

```markdown
## [SEVERITY] Vulnerability Title

**Location**: `file:line`
**Type**: OWASP category
**Impact**: What an attacker could do
**Fix**: How to remediate
```
