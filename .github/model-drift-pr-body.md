## What this pull request does

The weekly Model Drift workflow drafted new releases of known model
families from [OpenRouter](https://openrouter.ai) into
`packages/core/src/model-profiles.ts` and regenerated
`docs/reference/models.md`. The drafted entries carry the id, the
provider API id (`canonical_slug`), the display name, and the OpenRouter
listing date.

## Checklist before merging

This pull request is a draft for a human: the core catalog tests fail on
purpose until the hardcoded expectations match the values you verified.

- [ ] Verify release dates against the provider pages; OpenRouter reports
      the day it listed the model, not the release day.
- [ ] Verify retirement dates and statuses; OpenRouter rarely carries them.
- [ ] Check successors across families and floating aliases
      (`opus`, `sonnet`, `haiku`, `fable`), then sweep the docs, run
      `pnpm docs:validate --update-outputs`, `./scripts/sync-skill.sh`, and
      `pnpm prs compile` when an alias moved.
- [ ] Check target-specific names against the tool pages; set targets in
      `MODEL_TARGET_SCHEMES` or `promptscript.yaml` when they differ.
- [ ] Update the hardcoded core catalog expectations (floating aliases,
      replacements, pinned snapshots) with the values you verified.
- [ ] Run the model catalog pipeline:
      `pnpm nx run-many -t test -p core,formatters,validator` and
      `pnpm docs:models`.

See [Updating the Model Catalog](../blob/main/CONTRIBUTING.md#updating-the-model-catalog)
in CONTRIBUTING for the full manual process.
