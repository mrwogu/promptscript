# GitHub Copilot Instructions

## code-standards

### testing

- Test approved, declined, timeout, and retry paths

### security

- Tokenize payment data
- Verify webhook signatures

### reliability

- Use idempotency keys
- Bound retries with backoff

## donts

- Don't log PAN, CVV, access tokens, or raw webhook secrets
- Don't retry a payment without an idempotency key
