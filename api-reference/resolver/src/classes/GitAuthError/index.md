# GitAuthError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitAuthError

Defined in: [resolver/src/git-registry.ts:143](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L143)

Git authentication error.

## Extends

- `Error`

## Constructors

### Constructor

> **new GitAuthError**(`message`, `url`, `cause?`): `GitAuthError`

Defined in: [resolver/src/git-registry.ts:146](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L146)

#### Parameters

##### message

`string`

##### url

`string`

##### cause?

`Error`

#### Returns

`GitAuthError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `readonly` `optional` **cause?**: `Error`

Defined in: [resolver/src/git-registry.ts:144](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L144)

#### Overrides

`Error.cause`

***

### url

> `readonly` **url**: `string`

Defined in: [resolver/src/git-registry.ts:148](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-registry.ts#L148)