---
name: pdf-processing
description: Extract PDF text, fill forms, merge files. Use when handling PDFs.
license: Apache-2.0
compatibility: Requires Python 3.14+ and uv
metadata:
  author: example-org
  version: '1.0'
allowed-tools: Bash(git:*) Bash(jq:*) Read
---

# PDF Processing

Extract text and tables from PDF files, fill PDF forms, and merge multiple
PDFs. Use when working with PDF documents or when the user mentions PDFs,
forms, or document extraction.

## Steps

1. Load the PDF via `scripts/extract.py`.
2. Extract text and table regions.
3. Fill form fields or merge sources as requested.
4. Write the result to the requested output path.

See [the reference guide](references/REFERENCE.md) for details.
