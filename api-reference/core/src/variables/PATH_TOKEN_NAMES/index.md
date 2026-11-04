# PATH_TOKEN_NAMES

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: PATH\_TOKEN\_NAMES

> `const` **PATH\_TOKEN\_NAMES**: readonly \[`"dotDir"`, `"skillsDir"`, `"skillDir"`\]

Defined in: [core/src/utils/path-tokens.ts:9](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/utils/path-tokens.ts#L9)

Names of the target path tokens, written as `{{prs.<name>}}`.

- `dotDir`: the target's dot directory, for example `.claude` or `.factory`
- `skillsDir`: the target's skills directory, for example `.claude/skills`
- `skillDir`: the directory of the skill the text belongs to,
  for example `.claude/skills/review`