# UrlRuleOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UrlRuleOptions

Defined in: [core/src/url-rules.ts:2](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/url-rules.ts#L2)

Options of [refuseUrl](https://getpromptscript.dev/api-reference/core/src/functions/refuseUrl/index.md).

## Properties

### allowPrivate

> **allowPrivate**: `boolean`

Defined in: [core/src/url-rules.ts:8](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/url-rules.ts#L8)

When true, private network addresses and names are allowed: `10/8`, `100.64/10`,
`172.16/12`, `192.168/16`, `fc00::/7`, `*.local` and `*.internal`. Loopback,
unspecified, link-local and metadata hosts are refused either way.