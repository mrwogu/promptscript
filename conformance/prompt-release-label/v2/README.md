# Prompt release label v2 conformance vectors

Vectors for `https://getpromptscript.dev/schema/prompt-release-label/v2.json`. Every reader of a v2 label
must pass them.
v1 labels are unchanged; a v2 file exists only while an entry has an experiment.

## labels.json

`valid` is a list of `{ name, label }`. A reader accepts each label.

`invalid` is a list of `{ name, schema, label }`. A reader refuses each label. `schema` is
`true` when the JSON schema refuses it too. It is `false` for the rules JSON Schema cannot
state: weights sum to 10000, arm names are unique, arm hashes are unique and the control hash
equals the entry hash. A reader checks those itself.

Rules, as the readers enforce them:

- `experiment` is optional per entry. `name` matches `^[a-z0-9][a-z0-9-]{0,63}$`.
- `arms` has 2 to 4 items. The first is `control` and its `contentHash` is the entry hash.
- Other `variant` names match `^[a-z][a-z0-9-]{0,31}$`, are unique and are not `control`.
- Hashes are unique within the entry.
- `weight` is an integer in basis points. The control weight is 1 to 10000. A variant weight is
  0 to 10000, and 0 keeps the arm listed without traffic. The sum is exactly 10000.
- Arms, experiments, entries and the label itself accept no other keys.
