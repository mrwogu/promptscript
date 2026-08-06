# @promptscript/telemetry

Node-only anonymous telemetry client used by PromptScript CLI.

Responsibilities:

- resolve privacy vetoes
- append bounded NDJSON spool records
- aggregate records into collector batches
- send queued records from detached CLI processes
- reject free-form telemetry dimensions through versioned allowlists

No workspace package dependencies. CLI bundles this package into published output.

## Commands

```bash
pnpm nx build telemetry
pnpm nx lint telemetry
pnpm nx test telemetry
pnpm nx typecheck telemetry
```
