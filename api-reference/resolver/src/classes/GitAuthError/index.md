# GitAuthError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitAuthError

Defined in: [resolver/src/git-registry.ts:143](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L143)

Git authentication error.

## Extends

- `Error`

## Constructors

### Constructor

> **new GitAuthError**(`message`, `url`, `cause?`): `GitAuthError`

Defined in: [resolver/src/git-registry.ts:146](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L146)

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

Defined in: [resolver/src/git-registry.ts:144](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L144)

#### Overrides

`Error.cause`

***

### url

> `readonly` **url**: `string`

Defined in: [resolver/src/git-registry.ts:148](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-registry.ts#L148)