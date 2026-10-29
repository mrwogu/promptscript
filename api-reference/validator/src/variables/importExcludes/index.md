# importExcludes

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: importExcludes

> `const` **importExcludes**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/import-excludes.ts:55](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/rules/import-excludes.ts#L55)

PS040: Per-import validation excludes must stay bound to the pinned commit.

Suppression of validation findings is declared by the consumer, never by the
scanned content, so an imported file cannot mute its own scan. Every exclude
records the commit it was reviewed at; when the lockfile pins a different
commit, the exclude stops applying and this rule fails the build with a
clear message, forcing the consumer to re-review the new content.