# CLAUDE.md

## Code Style

- Test approved, declined, timeout, and retry paths
- Tokenize payment data
- Verify webhook signatures
- Use idempotency keys
- Bound retries with backoff

## Don'ts

- Don't log PAN, CVV, access tokens, or raw webhook secrets
- Don't retry a payment without an idempotency key
