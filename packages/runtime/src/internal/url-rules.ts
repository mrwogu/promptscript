/** Options of {@link refuseUrl}. */
export interface UrlRuleOptions {
  /**
   * When true, private network addresses and names are allowed: `10/8`, `100.64/10`,
   * `172.16/12`, `192.168/16`, `fc00::/7`, `*.local` and `*.internal`. Loopback,
   * unspecified, link-local and metadata hosts are refused either way.
   */
  allowPrivate: boolean;
}

const LOCAL = 'host is local or a metadata endpoint';
const PRIVATE = 'host is private';
const IPV4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;

type Ipv4 = [number, number, number, number];
type Ipv6 = [number, number, number, number, number, number, number, number];

function ipv4Kind([a, b, c, d]: Ipv4): string | undefined {
  if (
    a === 0 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 100 && b === 100 && c === 100 && d === 200) ||
    (a === 168 && b === 63 && c === 129 && d === 16)
  ) {
    return LOCAL;
  }
  if (
    a === 10 ||
    (a === 100 && (b & 0xc0) === 64) ||
    (a === 172 && (b & 0xf0) === 16) ||
    (a === 192 && b === 168)
  ) {
    return PRIVATE;
  }
  return undefined;
}

/** Eight hextets of an IPv6 host in the compressed form the URL parser writes. */
function hextets(text: string): Ipv6 {
  const [head = '', tail] = text.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const zeros = new Array<string>(8 - left.length - right.length).fill('0');
  return [...left, ...zeros, ...right].map((group) => Number.parseInt(group, 16)) as Ipv6;
}

function ipv6Kind([h0, h1, h2, h3, h4, h5, h6, h7]: Ipv6): string | undefined {
  const embedded: Ipv4 = [h6 >> 8, h6 & 0xff, h7 >> 8, h7 & 0xff];
  // ::/96 holds :: and ::1, ::ffff:0:0/96 is IPv4-mapped: both carry an IPv4 address
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && (h5 === 0 || h5 === 0xffff)) {
    return ipv4Kind(embedded);
  }
  const nat64 = h0 === 0x64 && h1 === 0xff9b && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0;
  // fd00:ec2::254 is AWS, fd20:ce::254 Google Cloud on IPv6-only instances
  const metadataPrefix = (h0 === 0xfd00 && h1 === 0xec2) || (h0 === 0xfd20 && h1 === 0xce);
  const metadata = metadataPrefix && h7 === 0x254 && h2 + h3 + h4 + h5 + h6 === 0;
  if (nat64 || metadata || (h0 & 0xffc0) === 0xfe80) return LOCAL;
  return (h0 & 0xfe00) === 0xfc00 ? PRIVATE : undefined;
}

// Loopback names from common hosts files, and the metadata names
const LOCAL_NAMES = new Set([
  'localhost',
  'localhost4',
  'localhost4.localdomain4',
  'localhost6',
  'localhost6.localdomain6',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.goog',
  'metadata.google.internal',
]);

function nameKind(host: string): string | undefined {
  if (LOCAL_NAMES.has(host) || host.endsWith('.localhost')) return LOCAL;
  return host.endsWith('.local') || host.endsWith('.internal') ? PRIVATE : undefined;
}

function hostKind(hostname: string): string | undefined {
  // The URL parser already lowercased the host and wrote IP literals in canonical form
  const host = hostname.endsWith('.') ? hostname.slice(0, -1) : hostname;
  if (host.startsWith('[')) return ipv6Kind(hextets(host.slice(1, -1)));
  const ipv4 = IPV4.exec(host);
  return ipv4 ? ipv4Kind(ipv4.slice(1).map(Number) as Ipv4) : nameKind(host);
}

/**
 * Check a URL against the rules for fetching remote prompt files.
 *
 * The URL must parse, use `https` and carry no user name, password, query or fragment.
 * Its host must not be loopback, unspecified, link-local, NAT64 or a metadata endpoint:
 * `0/8`, `127/8`, `169.254/16`, `100.100.100.200`, `168.63.129.16`, `::`, `::1`,
 * `fe80::/10`, `64:ff9b::/96`, `fd00:ec2::254`, `fd20:ce::254`, the IPv4-mapped forms,
 * `localhost`, `*.localhost`, `localhost4`, `localhost6`, `localhost.localdomain`,
 * `localhost4.localdomain4`, `localhost6.localdomain6`, `ip6-localhost`, `ip6-loopback`,
 * `metadata.goog` and `metadata.google.internal`.
 * With `allowPrivate: false` it must not be private either: `10/8`, `100.64/10`,
 * `172.16/12`, `192.168/16`, `fc00::/7`, `*.local` and `*.internal`. Hosts are compared
 * lowercased with one trailing dot stripped, and IP literals in any form the URL parser
 * accepts are checked as bytes.
 * Names are not resolved, so a public name that points at a private address passes.
 *
 * This file is kept identical in `packages/core/src/url-rules.ts` and
 * `packages/runtime/src/internal/url-rules.ts`; a runtime spec fails when they differ.
 *
 * @param url - The URL text or object to check
 * @param options - Whether private addresses and names are allowed
 * @returns The reason the URL is refused, or `undefined` when it passes
 *
 * @example
 * refuseUrl('http://example.com/', { allowPrivate: true }); // 'scheme is not https'
 * refuseUrl('https://10.0.0.1/', { allowPrivate: false }); // 'host is private'
 * refuseUrl('https://10.0.0.1/', { allowPrivate: true }); // undefined
 */
export function refuseUrl(url: string | URL, options: UrlRuleOptions): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'not a valid URL';
  }
  if (parsed.protocol !== 'https:') return 'scheme is not https';
  if (parsed.username || parsed.password) return 'URL carries credentials';
  if (parsed.search || parsed.hash) return 'URL carries a query or fragment';
  const kind = hostKind(parsed.hostname);
  return kind === PRIVATE && options.allowPrivate ? undefined : kind;
}
