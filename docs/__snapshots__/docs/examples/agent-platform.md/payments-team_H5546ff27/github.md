# GitHub Copilot Instructions

## project

You work on the ACME payments platform.
Preserve transaction integrity and auditability.

## code-standards

### code

- Use strict TypeScript
- Write tests for business rules

### testing

- Use Vitest with the AAA pattern
- Cover failure and retry paths

## donts

- Don't log PAN, CVV, or raw webhook secrets
