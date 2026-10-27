---
title: Application Prompts
description: Write the prompts of an application in .prs files and compile them to content-hashed JSON bundles and Markdown previews with the bundle and prompt-text targets.
---

# Application Prompts

PromptScript compiles instructions for coding agents. With syntax `1.6.0` it also compiles the
prompts that an application sends to a model. You write each prompt as an entry of the
[`@prompts`](../reference/language.md#prompts) block, and two opt-in targets turn the entries into
files:

| Target        | Writes                                        | For                                              |
| ------------- | --------------------------------------------- | ------------------------------------------------ |
| `bundle`      | `prompts/<key>.json` and `prompts/index.json` | Applications. One content-hashed file per prompt |
| `prompt-text` | `prompts/<key>.md` and `prompts/README.md`    | People. A Markdown preview of the system message |

Neither target is part of an "all targets" default. Add them to `targets` when you want them. A
program without `@prompts` entries writes nothing for either target. The coding agent targets skip
the `@prompts` block and their output does not change.

## Write a Prompt

A prompt is an entry of `@prompts`. It can reuse the blocks of the same program: the
`compose` list names the blocks that become part of the system message.

```promptscript
@meta {
  id: "acme-support"
  syntax: "1.6.0"
  owner: "team-support"
  risk: "medium"
}

@identity {
  """
  You work for the Acme support team.
  """
}

@restrictions {
  - "Never promise a refund before it is approved."
}

@prompts {
  refund-reply: {
    description: "Answer a customer refund request"
    risk: "high"
    dataClasses: ["pii"]
    compose: [identity, restrictions]
    model: { ref: "claude-sonnet-5-5", maxTokens: 800 }
    inputs: { message: { type: "string", description: "Customer message" } }
    output: {
      decision: { type: "enum", options: ["approve", "escalate"], description: "What to do next" }
    }
    system: "You answer refund requests for Acme customers."
    user: """
      Customer wrote: {{input.message}}
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMjPgFo4AVzRpm1LPLES4AT3YZCs+QEYKANgoAGPeMHMA7qxjVzIDqVUatOo4S1BBwANZefFIQaiSOAL5iYtzSnFgQWIbC+nIgenlOAJrMaoIu2mGCYNqCuDCCAIJK9eqa2li1MKQUOfkJSazc1PBYIYzpbHDZTsq5AHIwAG4egjTMJKH1QsNgaqxSggBGMNXDkh2hghia1MzLUj0FiazJa2RYU6JOO3tSysPkQyyL4SCRSeCMEJoCasLwNVhwFwrISMNRwLDrFY-faCYYARzUIyCoJC4S8OAgAHMcMSwdgMABhKAYOBweCyZDyNAQCDyAC6OQkLDIzDZHNS7AyhjouJGYxhcAFTgkJGY4KgwNlYC8jGZanBqjY7iwygArGb5DKSKYACrMMKcOCyAAcdjsgmeoMkrDQag+mr4rIwlJgmsyaFDuXRIVYlMtgnBcEhEGhEDYXgZaIxfGogkDcGDMHkHo9gucft9WGBZbBMEYoTTsOEtUMEa8nFi8eYqcmHPk1zWy3j8ghGGZHH5MsTyZ7TfkAHUcNhaswE6v3IRdCBS8qd16jOiYCQvMVShgEUjc9iDvjCeipqdGs1BKj0ZjaI8y2iPF4+ruJJmb45mUtwcMCwAQD6foUPmhbxJ6oJ9AUEjPPEIDxHyDBpNQhj4EQpDkDAVC0CADDLLQjb4BY6FAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The reference for every field is in the [language reference](../reference/language.md#prompts).
The file must declare `syntax: "1.6.0"` or later. Both targets refuse a lower version, a prerelease below it and a missing syntax, and
`prs validate` warns about `@prompts` entries below it (an error with `--strict`).

## Compile

Name the targets in `promptscript.yaml`:

```yaml
version: '1'
project:
  id: acme-support
targets:
  - bundle
  - prompt-text
```

Then run `prs compile`. The compile prints, for each prompt that uses `compose`, the blocks it
composed and the files they came from:

```text
Composed prompts (this text is public once shipped):
  acme-support/refund-reply
    identity: .promptscript/project.prs
    restrictions: .promptscript/project.prs
```

A target `output` moves the primary file, and the other files sit next to it. The target owns that
directory, so `output` must name one, for example `build/ai/index.json`.

The browser compiler used by the playground refuses a prompt target when it is created with
environment variables, because it interpolates them while it parses and the bundle would differ
from the one the CLI writes. Compile prompt targets without `envVars`.

## The Bundle

The example above compiles to `prompts/refund-reply.json`:

```json
{
  "$schema": "https://getpromptscript.dev/schema/prompt-bundle/v1.json",
  "id": "acme-support/refund-reply",
  "description": "Answer a customer refund request",
  "contentHash": "sha256-46efd8667a8cbc47257eff6ea29ffb0eedd192898c7dfacd72edf77cafc9024a",
  "messages": [
    {
      "role": "system",
      "content": "You work for the Acme support team.\n\n## Restrictions\n\n- Never promise a refund before it is approved.\n\nYou answer refund requests for Acme customers."
    },
    {
      "role": "user",
      "content": "Customer wrote: {{input.message}}"
    }
  ],
  "inputs": {
    "message": {
      "type": "string",
      "description": "Customer message",
      "required": true
    }
  },
  "output": {
    "type": "object",
    "properties": {
      "decision": {
        "type": "string",
        "description": "What to do next",
        "enum": ["approve", "escalate"]
      }
    },
    "required": ["decision"],
    "additionalProperties": false
  },
  "model": {
    "ref": "claude-sonnet-5-5",
    "profile": "claude-sonnet-5-5",
    "provider": "anthropic",
    "apiId": "claude-sonnet-5-5",
    "params": {
      "maxTokens": 800
    }
  },
  "governance": {
    "risk": "high",
    "owner": "team-support",
    "dataClasses": ["pii"]
  },
  "provenance": {
    "entry": ".promptscript/project.prs",
    "segments": [
      {
        "message": "system",
        "path": "identity",
        "files": [".promptscript/project.prs"]
      },
      {
        "message": "system",
        "path": "restrictions",
        "files": [".promptscript/project.prs"]
      },
      {
        "message": "system",
        "path": "prompts.refund-reply.system",
        "files": [".promptscript/project.prs"]
      },
      {
        "message": "user",
        "path": "prompts.refund-reply.user",
        "files": [".promptscript/project.prs"]
      }
    ]
  }
}
```

| Field         | Meaning                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `$schema`     | Schema URL, always the first key. It is the version tag of the bundle. See [Verify before use](#verify-before-use) |
| `id`          | `<@meta.id>/<key>`                                                                                                 |
| `contentHash` | `sha256-` plus 64 lowercase hex characters                                                                         |
| `messages`    | One or two messages, system first. Slots are left unrendered                                                       |
| `inputs`      | Declared inputs. `required` is true for an input without a default                                                 |
| `output`      | The output contract as a JSON Schema subset. Every property is required and extra properties are not allowed       |
| `model`       | The reference as written, plus the catalog profile, provider and API id it resolved to, and the parameters         |
| `governance`  | The effective governance values of the prompt                                                                      |
| `provenance`  | Where each message segment came from. Informational                                                                |

The files follow the schemas `schema/prompt-bundle-v1.json` and `schema/prompt-bundle-index-v1.json`.
They are written with two-space indentation and a final newline, and hold no timestamp, so the same
source always gives the same bytes. Line endings in the source do not matter: every string in a
bundle has `\r\n` and `\r` turned into `\n`.

`prompts/index.json` lists the bundles, sorted by id, with the `contentHash` of each.

### Messages and composition

With `compose`, the system message is built from the listed blocks in a fixed order, whatever order
you list them in: identity, context, knowledge, standards, restrictions, examples. The prompt's own
`system` text comes last. Segments are joined with one blank line and trailing spaces are trimmed.
Without `compose`, the system message is the prompt's own text.

- `identity` is plain text. The other blocks sit under a heading such as `## Restrictions`.
- Properties of `context` and `standards` become `- key: value` bullets, and lists are indented
  one level.
- `restrictions` become `- ` bullets, and `examples` become an input and an output in fenced code.
- Inside a block, its text, its list items and its properties are separate groups, in that order,
  divided by one blank line.
- `@header` titles are ignored.

Every `{{` in a composed block is escaped as `\{{`, so a composed block never carries a live
slot. Only the prompt's own `system` and `user` text can. A `compose` name must exist in the
resolved program.

### Runtime slots

`{{input.name}}` marks a value the application supplies when it calls the model. The name must be
a declared input. The bundle keeps the slot as written. `\{{` stands for two literal braces.
PromptScript does not render slots, so nothing in this guide describes how an application fills them.

### Governance

A prompt takes its own `risk`, `owner`, `domain`, `dataClasses` and `reviewers`, and falls back to
the values in `@meta`. `dataClasses` is the union of both. Lists are sorted by UTF-16 code units and
have no duplicates. [Prompt policies](policy-engine.md#prompt-policies) in `promptscript.yaml` read
these values: they can require fields, raise the risk from data classes, limit models and check
the text.

### Model

`model.ref` must name a model in the catalog, or a profile you declare under `models.profiles` in
`promptscript.yaml`. A floating alias such as `sonnet` resolves to the release it points at when you
compile. The resolved `profile`, `provider` and `apiId` are part of the content hash, so a catalog
change cannot move the served model under a hash you pinned. `prs validate` warns about a floating
alias with PS042.

## Content Hash

`contentHash` is SHA-256 over the RFC 8785 canonical JSON of the bundle without `contentHash` and
without `provenance`, written as `sha256-` plus the digest. `$schema` is inside the hash. A bundle of
another schema version never shares a hash with a version 1 bundle.

Moving a source file, or moving identical text between layers, changes `provenance` and keeps the
hash. A change to any message, input, output, model or governance value changes it. The
[conformance vectors](https://github.com/mrwogu/promptscript/tree/main/conformance/prompt-bundle/v1)
pin the bytes.

### Verify before use

A bundle is data from a file. A program that reads one should:

- recompute `contentHash` and reject the bundle when it does not match;
- validate the structure against the schema before it uses any field;
- never fetch the URL in `$schema`, because it is a version tag and not a download link;
- never deep-merge bundle JSON into defaults.

## Previews

The `prompt-text` target writes the composed system message of each prompt to
`prompts/<key>.md`, under a comment that holds the `contentHash` of the bundle. `prompts/README.md`
lists the key, description and file of each preview. A prompt without a system message is skipped
with warning PS4002.

A preview is for reading. It is not an approved artifact, and it still holds the slots and the
escapes of the bundle. The CLI does not reformat these files and does not add a configured header
to them.

## Generated Files

Bundles and previews are generated output.

- A bundle or index is recognised by its first key, `"$schema"` with a prompt bundle URL. A JSON
  file that only quotes the URL somewhere is never claimed.
- When a prompt leaves the source, `prs compile` removes its files from the target directory. It
  removes a bundle only when the file parses, its `contentHash` verifies and its name is the one
  the target gives it, so a renamed copy or a hand-edited bundle stays. An index is removed only
  under the name the target gives it, `index.json` unless `output` names another file. It does not
  enter subdirectories.
- The output directory belongs to the target. A verified bundle from another project that you save
  there is removed on the next compile.
- A prompt key may not equal the file name of the output, as in key `all` with
  `output: prompts/all.json`. The compile fails and asks you to rename one of them.
- A file at the path of a bundle that PromptScript did not generate is not overwritten without
  `--force`.
- When the last prompt leaves the source, the target writes nothing and `prs compile` removes the
  files of the earlier compile by the same rule. A bundle you edited stays.

## What PromptScript Does Not Do

Read this before you ship a bundle.

- **Input values.** PromptScript never escapes, delimits or filters the values an application puts
  into a slot. Text a user supplies reaches the model as written. Treat it as untrusted.
- **Responses.** Output schemas are not enforced. The application validates the response of the
  model.
- **Secrecy.** A system prompt is extractable by a user who interacts with the model. Composed
  text is public once shipped, so do not compose a block that holds anything you would not
  publish. The compile prints which blocks it composed for this reason.
- **Text blocks.** A line that starts with `#` inside `"""` is prompt text, not a comment.
- **Environment variables.** The bundle targets never interpolate `${VAR}`. It stays text in the
  message.
- **Checks on authored text.** The security rules of `prs validate` look at the text you wrote.
  They do not look at the values an application supplies at run time.
- **Provenance.** It is informational. File names can reveal internal git hosts and project
  layout. A policy must evaluate the recompiled source, never the provenance of an artifact.
- **Personal data.** `owner` and `reviewers` put names or addresses into production artifacts.
  Use team names when that matters.

Run `prs validate --strict` in CI, so a warning such as a slot in the system message (PS046) stops
the build.

## See Also

- [Application prompt examples](../examples/application-prompts.md)
- [Releasing application prompts](releases.md) - promote bundles through environments with `prs release`
- [`@prompts` in the language reference](../reference/language.md#prompts)
- [Bundle formatter](../reference/formatters/bundle.md) and [prompt-text formatter](../reference/formatters/prompt-text.md)
- [Security guide](security.md)
- [Configuration reference](../reference/config.md)
