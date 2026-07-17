# GitHub Copilot Character Limit - Matrix Correction

Repository custom instructions character limit was removed in June 2026.

Source: https://github.com/features/copilot/whats-new
Retrieved: 2026-07-17

## Matrix action

`packages/formatters/src/feature-matrix.ts`:

- `github.character-limit`: `planned` -> `not-supported`

No formatter output change required. The GitHub formatter already emits
`.github/copilot-instructions.md` without enforcing a character cap.
