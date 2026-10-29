# refuseUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: refuseUrl()

> **refuseUrl**(`url`, `options`): `string` \| `undefined`

Defined in: [core/src/url-rules.ts:117](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/url-rules.ts#L117)

Check a URL against the rules for fetching remote prompt files.

The URL must parse, use `https` and carry no user name, password, query or fragment.
Its host must not be loopback, unspecified, link-local, NAT64 or a metadata endpoint:
`0/8`, `127/8`, `169.254/16`, `100.100.100.200`, `168.63.129.16`, `::`, `::1`,
`fe80::/10`, `64:ff9b::/96`, `fd00:ec2::254`, `fd20:ce::254`, the IPv4-mapped forms,
`localhost`, `*.localhost`, `localhost4`, `localhost6`, `localhost.localdomain`,
`localhost4.localdomain4`, `localhost6.localdomain6`, `ip6-localhost`, `ip6-loopback`,
`metadata.goog` and `metadata.google.internal`.
With `allowPrivate: false` it must not be private either: `10/8`, `100.64/10`,
`172.16/12`, `192.168/16`, `fc00::/7`, `*.local` and `*.internal`. Hosts are compared
lowercased with one trailing dot stripped, and IP literals in any form the URL parser
accepts are checked as bytes.
Names are not resolved, so a public name that points at a private address passes.

This file is kept identical in `packages/core/src/url-rules.ts` and
`packages/runtime/src/internal/url-rules.ts`; a runtime spec fails when they differ.

## Parameters

### url

`string` \| `URL`

The URL text or object to check

### options

[`UrlRuleOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/UrlRuleOptions/index.md)

Whether private addresses and names are allowed

## Returns

`string` \| `undefined`

The reason the URL is refused, or `undefined` when it passes

## Example

```ts
refuseUrl('http://example.com/', { allowPrivate: true }); // 'scheme is not https'
refuseUrl('https://10.0.0.1/', { allowPrivate: false }); // 'host is private'
refuseUrl('https://10.0.0.1/', { allowPrivate: true }); // undefined
```