# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

We provide security updates for the latest minor version of the 1.x release line.

## Reporting a Vulnerability

Do not open a public issue for suspected vulnerabilities.

Use
[GitHub Security Advisories](https://github.com/mrwogu/promptscript/security/advisories/new)
to submit a private report. Include:

- Affected version or commit
- Reproduction steps
- Expected security impact
- Suggested mitigation, if known

Do not include real credentials or unrelated private data.

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
