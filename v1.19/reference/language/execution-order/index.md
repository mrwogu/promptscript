# Execution Order

Syntax `1.5.0` preserves top-level operation order. This removes ambiguity when imports, local blocks, extensions, and replacements target the same value.

## Resolution Sequence

```
flowchart LR
    A["@meta"] --> B["@inherit"]
    B --> C["@use"]
    C --> D["local blocks"]
    D --> E["@extend"]
    E --> F["@override"]
    F --> G["validate"]
    G --> H["format"]
```

Diagram shows recommended organization, not a fixed phase reordering. Resolver executes declarations in actual source order after metadata.

## Composed Source Graph

Resolver selects operation semantics from the complete reachable graph, not only the entry file. Inherited files, top-level imports, and inline composed operations. Inherited files, top-level imports, inline composed skills, and inline `@use` declarations carried by `@extend` bodies are inspected before resolution. If any reachable source declares syntax `1.5.0` or uses an ordered operation feature, the composed graph uses declaration order. A lower-version entry file remains valid, but PS018 reports the ordered-operation requirement at its source location. If no reachable source requires ordered operations, pre-1.5 projects retain legacy phase ordering. The resolver does not reject mixed-version composition; it applies ordered semantics and leaves PS018 to request a syntax upgrade.

## Order Changes Results

```
@meta { id: "ordered-operations" syntax: "1.5.0" }

@standards {
  testing: ["Use Jest"]
}

@override standards.testing {
  ["Use Vitest"]
}

@extend standards {
  testing: ["Require integration tests"]
}
```

Final value:

```text
testing: ["Use Vitest", "Require integration tests"]
```

Reversing `@extend` and `@override` discards the extension because replacement runs later.

## Rules

- `@override` target must exist when operation runs.
- `@extend` target should exist before extension.
- Local duplicate blocks apply at their source positions.
- Imported source values use import merge policy before later operations.
- Sealed skill properties remain protected regardless of operation order.
- Older syntax using `@override` still resolves deterministically, but PS018 requests syntax `1.5.0`.

## Review Checklist

1. Read declarations from top to bottom.
1. Record target value after every operation.
1. Confirm replacement occurs only where intended.
1. Run `prs validate --strict`.
1. Inspect generated changes with `prs compile --dry-run` or `prs diff`.
