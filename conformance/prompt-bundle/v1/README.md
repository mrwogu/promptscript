# Prompt bundle v1 conformance vectors

These files pin the bytes of a prompt bundle, version 1. Any implementation that
reads, writes or hashes bundles must agree with every vector here.

The bundle shape is defined by `schema/prompt-bundle-v1.json`. The index that lists
bundles is defined by `schema/prompt-bundle-index-v1.json`.

## Vector format

One JSON object per file, named `NNN-<name>.json`.

| Field         | Required | Meaning                                                                           |
| ------------- | -------- | --------------------------------------------------------------------------------- |
| `description` | yes      | What the vector shows                                                             |
| `bundle`      | yes      | A bundle object, exactly as it would be read from a file                          |
| `canonical`   | yes      | The hash input: the exact RFC 8785 text described below                           |
| `contentHash` | yes      | The correct hash of `canonical`: `sha256-` plus 64 lowercase hex characters       |
| `slots`       | yes      | Result of the slot scanner over the messages, `[]` when none                      |
| `error`       | no       | Set when a consumer must reject `bundle`. The only value in v1 is `hash-mismatch` |
| `source`      | no       | Authored source that compiles to `bundle`, as `{ entry, files }`                  |
| `render`      | no       | Expected rendering for given inputs: one case, or a list of cases                 |
| `warnings`    | no       | Rule codes the compile of `source` must report, for example `PS046`               |
| `variants`    | no       | Changed copies of `bundle` with their own hash input and hash                     |

A compiler passes a vector with a `source` when compiling it with the `bundle` target gives
`bundle` byte for byte, as `JSON.stringify(bundle, null, 2)` plus a newline. It must give the same
bytes for the source with LF line endings and with CRLF line endings. `entry` is a path relative
to the project root, and `files` maps paths to file contents.

A `variant` is `{ description, set, canonical, contentHash }`. `set` replaces top-level fields of
`bundle`. `canonical` and `contentHash` are what the hash input and hash of the changed bundle
must be.

`render` is data for a renderer. Nothing asserts it yet. A case is:

| Field      | Meaning                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `name`     | Optional label of the case                                                                               |
| `inputs`   | The values a caller passes, by input name                                                                |
| `messages` | The rendered messages, when the render succeeds                                                          |
| `error`    | Set instead of `messages` when the render must fail: `missing-input`, `invalid-type` or `invalid-option` |

A renderer inserts each value as text in one pass and never scans an inserted value again. It
writes numbers in RFC 8785 form (`100`, `0.2`, `1e+21`) and booleans as `true` or `false`. It
rejects a missing input that has no default, a value of the wrong type and a value outside
`options`. It also rejects a non-finite number, though no vector can carry one, because JSON has none.

## Hash input

1. Take the bundle object.
2. Remove `contentHash` and `provenance`. Every other field stays, `$schema` included.
3. Serialize it as RFC 8785 canonical JSON: no whitespace, object keys sorted by
   UTF-16 code units at every depth, strings and numbers in ECMAScript form.
4. Encode the text as UTF-8 and hash it with SHA-256.

`contentHash` is `sha256-` followed by the digest in lowercase hex.

Because `$schema` is inside the hash input, it works as the version tag: a bundle of
another version never shares a hash with a v1 bundle. Because `provenance` is outside
it, renaming a source file or moving identical text between layers keeps the hash.
Fields added in later v1 releases are absent when unused, so an unchanged prompt keeps
its hash.

## Slots

A slot is exactly `{{input.<name>}}` with `<name>` matching `[A-Za-z_][A-Za-z0-9_]*`.
`\{{` is an escape. Any other unescaped `{{` is invalid. Each entry of `slots` is:

```json
{ "message": 1, "kind": "slot", "name": "amount", "offset": 7, "length": 16 }
```

- `message` is the index in `bundle.messages`.
- `kind` is `slot`, `escaped` or `invalid`.
- `name` is the input name for a slot and `null` otherwise.
- `offset` and `length` count UTF-16 code units in the message content.

Entries are in message order, then text order.

## Consumer rules

- Recompute `contentHash` from the bundle and reject the bundle on a mismatch.
  Vector `011-hash-mismatch` carries a wrong `contentHash` in `bundle` and
  `error: "hash-mismatch"`.
- Validate the structure before using any field.
- Never fetch the URL in `$schema`. It is a version tag, not a download link.
- Never deep-merge bundle JSON into defaults.

## Files

| File                            | Shows                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `001-minimal.json`              | One user message, no inputs, one provenance segment                                         |
| `002-key-order.json`            | The bundle of 001 with reversed key order, same canonical form and hash                     |
| `003-crlf.json`                 | A CRLF source: the description and the user message span two lines and compile to LF        |
| `004-unicode.json`              | Non-ASCII text, U+2028, a control character, quotes, a backslash, an emoji                  |
| `005-numbers.json`              | `0.2`, `800`, a default of `100.0` stored as `100`, and `1e21` as `1e+21`                   |
| `006-excluded-fields.json`      | Another `provenance.entry`; variants for `contentHash` (same hash) and `$schema` (new hash) |
| `007-provenance-file.json`      | Another `provenance.segments[0].files`, same hash as 001                                    |
| `008-escape.json`               | An escaped slot, a backslash before an escape, and a real slot                              |
| `009-no-rescan.json`            | An input that holds a slot is inserted verbatim, never scanned again                        |
| `010-literals-and-errors.json`  | `${HOME}` stays text, number and boolean rendering, and the three render errors             |
| `011-hash-mismatch.json`        | A wrong `contentHash` in the bundle, the vector holds the correct one                       |
| `012-compose-identity.json`     | `compose: [identity]`: plain text first, a slot-like `{{greeting}}` escaped                 |
| `013-compose-context.json`      | `compose: [context]`: properties as bullets under a Context heading                         |
| `014-compose-knowledge.json`    | `compose: [knowledge]`: text under a Knowledge heading                                      |
| `015-compose-standards.json`    | `compose: [standards]`: keys as bullets under a Standards heading                           |
| `016-compose-restrictions.json` | `compose: [restrictions]`: bullets under a Restrictions heading                             |
| `017-compose-examples.json`     | `compose: [examples]`: fenced input and output under an Examples heading                    |
| `018-compose-order.json`        | All six blocks listed in reverse: the message keeps the fixed order                         |
| `019-slot-in-system.json`       | A slot in the system message is live, and compiling it reports `PS046`                      |
| `020-prototype-input.json`      | A slot named `constructor` with no such input fails with `missing-input`                    |
