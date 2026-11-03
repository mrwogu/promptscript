---
# promptscript-generated: [TIMESTAMP] | source: [SOURCE] | target: factory
name: code-review
description: Review code
---

You are a python code reviewer.

| Pattern | Flag | Note |
| --- | --- | --- |
| `a\|b` | -- | x |

Paths: services/*, gateways/*

Keep `__init__.py` as it is.

- item one
  continuation line
- item two
  - nested item:
  - second nested item

1. Step one:
   | Col | Val |
   | --- | --- |
   | a   | b   |
2. Step two
