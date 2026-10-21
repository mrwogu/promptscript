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
| `source`      | no       | Authored source that compiles to `bundle`. Nothing asserts it yet                 |
| `render`      | no       | Expected rendering for given inputs. Nothing asserts it yet                       |

`source` and `render` are data for later consumers. Today's runner ignores them.

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

| File                       | Shows                                                                      |
| -------------------------- | -------------------------------------------------------------------------- |
| `001-minimal.json`         | One user message, no inputs, one provenance segment                        |
| `002-key-order.json`       | The bundle of 001 with reversed key order, same canonical form and hash    |
| `004-unicode.json`         | Non-ASCII text, U+2028, a control character, quotes, a backslash, an emoji |
| `005-numbers.json`         | `0.2`, `800`, a default of `100.0` stored as `100`, and `1e21` as `1e+21`  |
| `006-excluded-fields.json` | Another `provenance.entry`, same hash as 001                               |
| `007-provenance-file.json` | Another `provenance.segments[0].files`, same hash as 001                   |
| `008-escape.json`          | An escaped slot, a backslash before an escape, and a real slot             |
| `011-hash-mismatch.json`   | A wrong `contentHash` in the bundle, the vector holds the correct one      |

Numbers 003, 009 and 010 are reserved for vectors that need a compiler or a renderer.
