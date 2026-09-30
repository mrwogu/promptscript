# collectSkillResources()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectSkillResources()

> **collectSkillResources**(`skillMdPath`, `parsed`, `logger?`): `Promise`\<[`CollectedSkillResources`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CollectedSkillResources/index.md)\>

Defined in: [resolver/src/skill-resources.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/skill-resources.ts#L41)

Collect every file that travels with a SKILL.md.

Combines the three sources a skill can pull resources from: files discovered
alongside SKILL.md, `references:` frontmatter entries, and `scripts:`
frontmatter entries. Later entries win on a relative-path clash, so explicit
frontmatter overrides a discovered file.

Discovery failures are logged and skipped; failures for explicitly declared
references and scripts are returned so callers can surface them.

## Parameters

### skillMdPath

`string`

Absolute path to the SKILL.md file

### parsed

[`ParsedSkillMd`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedSkillMd/index.md)

Parsed SKILL.md metadata

### logger?

[`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Optional logger for reporting skipped files

## Returns

`Promise`\<[`CollectedSkillResources`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CollectedSkillResources/index.md)\>

Deduplicated resources and any resource errors