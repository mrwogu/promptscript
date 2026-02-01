# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

We provide security updates for the latest minor version of the 1.x release line.

## Reporting a Vulnerability

We take the security of PromptScript seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**github@wogu.pl**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, command injection, path traversal, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.

2. **Assessment**: We will assess the vulnerability and determine its severity within 7 days.

3. **Resolution Timeline**:
   - Critical vulnerabilities: Fix within 7 days
   - High severity: Fix within 14 days
   - Medium severity: Fix within 30 days
   - Low severity: Fix in next scheduled release

4. **Disclosure**: We will coordinate with you on the timing of public disclosure. We aim to disclose vulnerabilities within 90 days of initial report, or sooner if a fix is available.

5. **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous).

## Security Best Practices

When using PromptScript in your organization:

### Registry Security

- Use private Git registries for sensitive configurations
- Authenticate with tokens stored in environment variables
- Review registry changes through pull requests

### CI/CD Integration

- Validate `.prs` files in CI pipelines before merging
- Use `prs validate --strict` to catch issues early
- Pin registry versions for production stability

### Credential Management

- Never hardcode credentials in `.prs` files
- Use environment variable substitution: `${PUBLIC_KEY}`
- Keep `.env` files out of version control

## Scope

This security policy applies to:

- The `@promptscript/cli` npm package
- The PromptScript Docker images
- The PromptScript GitHub repository

Third-party packages, plugins, or external registries are not covered by this policy.

## Security Updates

Security advisories are published via:

- [GitHub Security Advisories](https://github.com/mrwogu/promptscript/security/advisories)
- Release notes in [CHANGELOG.md](CHANGELOG.md)

Subscribe to the repository's security alerts to be notified of new advisories.
