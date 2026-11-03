# MarkerMode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MarkerMode

> **MarkerMode** = `"timestamp"` \| `"static"` \| `"none"`

Defined in: [core/src/utils/markers.ts:93](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/utils/markers.ts#L93)

How generated files are marked.
- `timestamp`: marker with the generation time (honours `SOURCE_DATE_EPOCH`)
- `static`: marker without a time, so output is byte-for-byte reproducible
- `none`: no marker; ownership comes from the generated files manifest