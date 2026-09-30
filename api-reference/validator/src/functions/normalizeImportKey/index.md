# normalizeImportKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeImportKey()

> **normalizeImportKey**(`value`): `string`

Defined in: [validator/src/import-exclusions.ts:14](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/import-exclusions.ts#L14)

Normalize an import source to its lockfile key form.

Strips transport details so `https://github.com/org/repo.git`,
`git@github.com:org/repo`, and `github.com/org/repo` all compare equal.
Mirrors the normalization the compiler applies to lockfile dependency keys.
Implemented with plain string operations so adversarial import strings
cannot trigger regex backtracking (CodeQL js/polynomial-redos, Sonar S8786).

## Parameters

### value

`string`

## Returns

`string`