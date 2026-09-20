# CLAUDE.md

## Code Style

- Test approved, declined, timeout, and retry paths
- Tokenize payment data
- Verify {{provider}} webhook signatures
- Use idempotency keys
- Bound {{provider}} retries to {{maxRetries}} attempts with backoff

## Don'ts

- Don't log PAN, CVV, access tokens, or raw webhook secrets
- Don't exceed {{maxRetries}} {{provider}} payment retries
