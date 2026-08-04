# GitHub Copilot Instructions

## code-standards

### testing

- Test approved, declined, timeout, and retry paths

### security

- Tokenize payment data
- Verify {{provider}} webhook signatures

### reliability

- Use idempotency keys
- Bound {{provider}} retries to {{maxRetries}} attempts with backoff

## donts

- Don't log PAN, CVV, access tokens, or raw webhook secrets
- Don't exceed {{maxRetries}} {{provider}} payment retries
