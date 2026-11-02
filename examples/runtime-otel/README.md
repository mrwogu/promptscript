# Runtime OpenTelemetry example

This example sends traces for a two-arm prompt experiment to [Phoenix](https://github.com/Arize-ai/phoenix)
or [Langfuse](https://github.com/langfuse/langfuse) with `@promptscript/runtime`. It needs no API
key and makes no model call. The model is a fake that answers with fixed token counts. The only
network traffic is OTLP to the backend.

What it does:

- The `prod` label of `acme-support/refund-reply` runs an experiment, `small-model`. The control
  arm is `claude-sonnet-5-5` with 70 % of the keys. The `small` arm is the same prompt on
  `claude-haiku-5-5` with 30 %.
- 200 sessions each get a prompt with `client.get(id, { key })`, one traced model call and one
  thumbs feedback. Every fourth session gives a thumbs down.
- Spans go over OTLP (HTTP, protobuf) to the endpoint in `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`.
  Nothing in the app is specific to one backend.

## Files

| Path                     | What it is                                                                                   |
| :----------------------- | :------------------------------------------------------------------------------------------- |
| `.promptscript/`         | The PromptScript source, one prompt. The model is the one of the `small` arm                 |
| `.promptscript/releases` | Release files from the CLI: both bundles, `pricing.json`, `staging.json`, `prod.json` (v2)   |
| `promptscript.yaml`      | Project config with two environments, `staging` and `prod`                                   |
| `package.json`, lockfile | The OpenTelemetry packages, exact versions. The runtime is not in them, see below            |
| `scenario.mjs`           | Shared facts: the 200 keys, inputs, usage, the feedback rule and the numbers a run must give |
| `fake-model.mjs`         | A fake Anthropic Messages call                                                               |
| `index.mjs`              | The app. Prints a JSON summary with the call counts per arm                                  |
| `checks.mjs`             | The checks both backends run, and the report they write                                      |
| `phoenix/compose.yaml`   | Phoenix, pinned by digest                                                                    |
| `phoenix/check.mjs`      | Reads the spans back from Phoenix and runs the checks                                        |
| `langfuse/compose.yaml`  | Langfuse and the stores it runs on, pinned by digest                                         |
| `langfuse/check.mjs`     | Reads the observations back from Langfuse and runs the checks                                |

The release files were made with these commands, run from the repository root:

```bash
# project.prs with the model claude-sonnet-5-5, the control
pnpm prs release build --cwd examples/runtime-otel
pnpm prs release promote acme-support/refund-reply --to staging --cwd examples/runtime-otel
pnpm prs release promote acme-support/refund-reply --to prod --cwd examples/runtime-otel
# then the model changed to claude-haiku-5-5, the arm
pnpm prs release build --cwd examples/runtime-otel
pnpm prs release promote acme-support/refund-reply --to staging --cwd examples/runtime-otel
pnpm prs release split acme-support/refund-reply --env prod --name small-model \
  --arm small@05d5bfcc68990ebd=30 --cwd examples/runtime-otel
```

## Run it

`@promptscript/runtime` is not published to npm. The example installs a packed build of this
repository, after the OpenTelemetry packages from the lockfile. From the repository root:

```bash
pnpm nx build runtime
mkdir -p /tmp/runtime && npm pack dist/packages/runtime --pack-destination /tmp/runtime
```

### Phoenix

```bash
docker compose -f examples/runtime-otel/phoenix/compose.yaml up -d   # podman-compose works the same
cd examples/runtime-otel
npm ci --ignore-scripts
npm install --no-save --offline --ignore-scripts /tmp/runtime/promptscript-runtime-*.tgz
curl -fsS --retry 60 --retry-delay 2 --retry-all-errors -o /dev/null http://localhost:6006/healthz
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:6006/v1/traces node index.mjs > /tmp/run.json
node phoenix/check.mjs --run /tmp/run.json --out /tmp/phoenix-report
docker compose -f phoenix/compose.yaml down -v
```

Open http://localhost:6006 before `down` to look at the spans. Phoenix keeps no data after `down -v`,
and `check.mjs` counts spans exactly, so run it before a second run. The port is bound to
127.0.0.1 only, because this Phoenix has no login.

### Langfuse

```bash
docker compose -f examples/runtime-otel/langfuse/compose.yaml up -d   # podman-compose works the same
cd examples/runtime-otel
npm ci --ignore-scripts
npm install --no-save --offline --ignore-scripts /tmp/runtime/promptscript-runtime-*.tgz
curl -fsS --retry 150 --retry-delay 2 --retry-all-errors -o /dev/null http://localhost:3030/api/health
curl -fsS --retry 60 --retry-delay 2 --retry-all-errors -o /dev/null \
  -u pk-lf-promptscript-example:sk-lf-promptscript-example \
  'http://localhost:3000/api/public/v2/observations?limit=1'
AUTH=$(printf '%s' 'pk-lf-promptscript-example:sk-lf-promptscript-example' | base64 | tr -d '\n')
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:3000/api/public/otel/v1/traces \
OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Basic%20$AUTH,x-langfuse-ingestion-version=4" \
  node index.mjs > /tmp/run.json
node langfuse/check.mjs --run /tmp/run.json --out /tmp/langfuse-report
docker compose -f langfuse/compose.yaml down -v
```

With the images already pulled, the stack was ready after about 30 seconds on a laptop and used about 2.7 GB of memory. The first start also pulls the images. Log in at
http://localhost:3000 with `admin@example.com` and `example-password` to look at the
observations. The keys in the commands are throwaway values from `langfuse/compose.yaml`. Ports
3000 and 3030 are bound to 127.0.0.1 only. The `x-langfuse-ingestion-version` header is the one Langfuse documents for OTLP spans that should show up as they arrive. The exporter prints a
"could not deserialize response" error for each batch, because Langfuse answers the protobuf
request with JSON. The spans are stored. Langfuse keeps no data after `down -v`, so run it before
a second run.

`npm install` writes nothing to `package.json` or the lockfile because of `--no-save`.

## What CI checks

The job "Runtime Traces in Phoenix" runs the Phoenix steps above on a runner. The job "Runtime
Traces in Langfuse" runs the Langfuse steps every Monday and on pull requests that touch
`packages/runtime` or this directory. `check.mjs` exits 1 and lists every failed check
when one of these does not hold:

- The backend has 200 call spans, all root spans, named after the model of their arm, with the prompt
  id, content hash, label, experiment name and variant, the model, the token counts and the cost.
- No span holds a session key or an input text.
- The calls per arm are the numbers an own copy of the documented bucket rule gives for the 200
  keys, and the numbers `index.mjs` printed. That copy is first checked against
  `conformance/prompt-release-label/v2/assignment.json`. The share of each arm is also within 10
  points of its weight.
- There are 200 feedback spans. Each is a child of one call span in the same trace, has one
  `gen_ai.evaluation.result` event with a score and a matching label, and the hash of its parent.
  Langfuse keeps no span events, so there only the spans, the parent and the hash are checked.
- Per content hash, the cost sum and the score sum are what the release files and the feedback
  rule give. This is the quality and cost of each prompt version. In Langfuse the score sum is not
  checked, because the score is in the event.

`check.mjs` writes `report.json` (per hash) and `mapping.json` to the `--out` directory. The
mapping lists what the backend did with these spans: the span kind it gave, which attributes came
back under the same name, which it added, and whether the feedback event is there. CI uploads both.

In Langfuse:

- The call span is a `GENERATION` with `model`, `usageDetails` (`input`, `output`, `total`) and
  the token counts of the span. The feedback span is a `SPAN`.
- Our attributes come back in `metadata`, with the key prefix `attributes.`, numbers as numbers
  and the finish reasons as an array. `gen_ai.prompt.name` and `gen_ai.prompt.version` are not in
  `metadata`. They are the `input` of the call, as a JSON string, and `check.mjs` reads them from
  there.
- `promptscript.usage.cost_usd` stays in `metadata`. `costDetails` is empty and `totalCost` is
  null, because Langfuse does not know these example models.
- The `gen_ai.evaluation.result` event is not stored. Nothing of it is on the feedback span, so
  the score and the label cannot be read back.

`prs release build` also runs in this directory in CI and must change nothing, so the committed
release files stay what the CLI writes.
