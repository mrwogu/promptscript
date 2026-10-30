# Runtime OpenTelemetry example

This example sends traces for a two-arm prompt experiment to [Phoenix](https://github.com/Arize-ai/phoenix)
with `@promptscript/runtime`. It needs no API key and makes no model call. The model is a fake
that answers with fixed token counts. The only network traffic is OTLP to Phoenix.

What it does:

- The `prod` label of `acme-support/refund-reply` runs an experiment, `small-model`. The control
  arm is `claude-sonnet-5-5` with 70 % of the keys. The `small` arm is the same prompt on
  `claude-haiku-5-5` with 30 %.
- 200 sessions each get a prompt with `client.get(id, { key })`, one traced model call and one
  thumbs feedback. Every fourth session gives a thumbs down.
- Spans go over OTLP (HTTP, protobuf) to the endpoint in `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`.
  Nothing in the app is specific to Phoenix.

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
| `phoenix/compose.yaml`   | Phoenix, pinned by digest                                                                    |
| `phoenix/check.mjs`      | Reads the spans back from Phoenix and checks them                                            |

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
docker compose -f examples/runtime-otel/phoenix/compose.yaml up -d   # podman-compose works the same
cd examples/runtime-otel
npm ci --ignore-scripts
npm install --no-save --offline --ignore-scripts /tmp/runtime/promptscript-runtime-*.tgz
curl -fsS --retry 60 --retry-delay 2 --retry-all-errors -o /dev/null http://localhost:6006/healthz
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:6006/v1/traces node index.mjs > /tmp/run.json
node phoenix/check.mjs --run /tmp/run.json --out /tmp/phoenix-report
docker compose -f phoenix/compose.yaml down
```

Open http://localhost:6006 before `down` to look at the spans. Phoenix keeps no data after `down`,
and `check.mjs` counts spans exactly, so run `down` before a second run. The port is bound to
127.0.0.1 only, because this Phoenix has no login.

`npm install` writes nothing to `package.json` or the lockfile because of `--no-save`.

## What CI checks

The job "Runtime Traces in Phoenix" runs the steps above on a runner. `check.mjs` exits 1 and
lists every failed check when one of these does not hold:

- Phoenix has 200 call spans, all root spans, named after the model of their arm, with the prompt
  id, content hash, label, experiment name and variant, the model, the token counts and the cost.
- No span holds a session key or an input text.
- The calls per arm are the numbers an own copy of the documented bucket rule gives for the 200
  keys, and the numbers `index.mjs` printed. That copy is first checked against
  `conformance/prompt-release-label/v2/assignment.json`. The share of each arm is also within 10
  points of its weight.
- There are 200 feedback spans. Each is a child of one call span in the same trace, has one
  `gen_ai.evaluation.result` event with a score and a matching label, and the hash of its parent.
- Per content hash, the cost sum and the score sum are what the release files and the feedback
  rule give. This is the quality and cost of each prompt version.

`check.mjs` writes `report.json` (per hash) and `mapping.json` to the `--out` directory. The
mapping lists what Phoenix did with these spans: the span kind it gave, which attributes came back
under the same name, which it added, and whether the feedback event is there. CI uploads both.

`prs release build` also runs in this directory in CI and must change nothing, so the committed
release files stay what the CLI writes.
