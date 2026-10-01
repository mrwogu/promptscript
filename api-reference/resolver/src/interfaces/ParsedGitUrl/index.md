# ParsedGitUrl

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParsedGitUrl

Defined in: [resolver/src/git-url-utils.ts:17](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L17)

Parsed Git URL structure.

## Properties

### host

> **host**: `string`

Defined in: [resolver/src/git-url-utils.ts:23](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L23)

Host (e.g., github.com, gitlab.com)

***

### original

> **original**: `string`

Defined in: [resolver/src/git-url-utils.ts:19](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L19)

Full original URL

***

### owner

> **owner**: `string`

Defined in: [resolver/src/git-url-utils.ts:25](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L25)

Repository owner/organization

***

### port?

> `optional` **port?**: `number`

Defined in: [resolver/src/git-url-utils.ts:29](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L29)

Port number (if specified)

***

### protocol

> **protocol**: `"ssh"` \| `"git"` \| `"https"`

Defined in: [resolver/src/git-url-utils.ts:21](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L21)

Protocol (https, ssh, git)

***

### repo

> **repo**: `string`

Defined in: [resolver/src/git-url-utils.ts:27](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L27)

Repository name (without .git)