import type { EvalConfig, EvalProviderKind } from '@promptscript/core';
import { EVAL_CODES, EvalProviderError } from './errors.js';
import {
  createAnthropicProvider,
  createOpenAICompatibleProvider,
  refuseProviderUrl,
  type ProviderDeps,
} from './http-provider.js';
import type { EvalProvider, EvalProviderLookup } from './provider.js';
import { isRecord } from './shape.js';

/** A provider the run will call, announced before its first call. */
export interface ProviderUse {
  /** Provider name */
  provider: string;
  /** Environment variable the key is read from */
  keyVariable: string;
  /** Host the key is sent to */
  host: string;
}

/** Options of {@link createProviderFactory}. */
export interface ProviderFactoryOptions extends ProviderDeps {
  /** The `eval` section of promptscript.yaml */
  config?: EvalConfig;
  /** Environment the key variables are read from, at call time */
  env: Readonly<Record<string, string | undefined>>;
  /** Hosts allowed besides the built-in defaults, from `--allow-host` */
  allowedHosts?: readonly string[];
  /** Allow loopback hosts and plain http for them, from `--allow-local` */
  allowLocal?: boolean;
  /**
   * Called once per provider before it is used, so the CLI can print where the
   * key goes. The config names the variable in `apiKeyEnvVar`, so it decides
   * which secret of the environment is sent: review that key like code.
   */
  onUse?: (use: ProviderUse) => void;
}

interface ProviderEntry {
  kind: EvalProviderKind;
  baseUrl: string;
  keyVariable: string;
}

const BUILT_IN: Readonly<Record<string, ProviderEntry>> = {
  anthropic: {
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    keyVariable: 'ANTHROPIC_API_KEY',
  },
  openai: {
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    keyVariable: 'OPENAI_API_KEY',
  },
};
const ENTRY_KEYS = new Set(['kind', 'baseUrl', 'apiKeyEnvVar']);
const KEY_VARIABLE = /^[A-Z_][A-Z0-9_]*$/;
const SECRET_NAME = /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i;
// Shorter values would match ordinary config text by chance
const MIN_SECRET_LENGTH = 8;

function refused(message: string): EvalProviderError {
  return new EvalProviderError(message, EVAL_CODES.CONFIG_KEY_REFUSED);
}

// A built-in key goes only where it belongs: another kind or host must name its own key
function checkBuiltInKey(
  name: string,
  kind: EvalProviderKind,
  url: string | undefined,
  builtIn: ProviderEntry | undefined
): void {
  if (builtIn === undefined || url === undefined) return;
  if (kind === builtIn.kind && hostOf(url) === hostOf(builtIn.baseUrl)) return;
  throw refused(
    `eval.providers.${name} changes the kind or the host of a built-in provider, so set apiKeyEnvVar to the key it should get.`
  );
}

function entryOf(name: string, config: EvalConfig | undefined): ProviderEntry {
  const providers: unknown = config?.providers;
  const raw = isRecord(providers) && Object.hasOwn(providers, name) ? providers[name] : undefined;
  const builtIn = Object.hasOwn(BUILT_IN, name) ? BUILT_IN[name] : undefined;
  if (raw === undefined) {
    if (builtIn !== undefined) return builtIn;
    throw new EvalProviderError(
      `Provider ${name} has no entry; add eval.providers.${name} with kind openai-compatible, baseUrl and apiKeyEnvVar.`,
      EVAL_CODES.PROVIDER_UNCONFIGURED
    );
  }
  if (!isRecord(raw)) throw refused(`eval.providers.${name} must be a mapping.`);
  const extra = Object.keys(raw).find((key) => !ENTRY_KEYS.has(key));
  if (extra !== undefined) {
    throw refused(
      `eval.providers.${name}.${extra.slice(0, 64)} is not allowed; keys come only from the variable in apiKeyEnvVar.`
    );
  }
  const { kind, baseUrl, apiKeyEnvVar } = raw;
  if (kind !== 'anthropic' && kind !== 'openai-compatible') {
    throw refused(`eval.providers.${name}.kind must be anthropic or openai-compatible.`);
  }
  const url = typeof baseUrl === 'string' ? baseUrl : builtIn?.baseUrl;
  if (typeof apiKeyEnvVar !== 'string') checkBuiltInKey(name, kind, url, builtIn);
  const variable = typeof apiKeyEnvVar === 'string' ? apiKeyEnvVar : builtIn?.keyVariable;
  if (url === undefined || variable === undefined) {
    throw new EvalProviderError(
      `eval.providers.${name} needs baseUrl and apiKeyEnvVar.`,
      EVAL_CODES.PROVIDER_UNCONFIGURED
    );
  }
  if (!KEY_VARIABLE.test(variable)) {
    throw refused(
      `eval.providers.${name}.apiKeyEnvVar must be a variable name such as MY_API_KEY.`
    );
  }
  return { kind, baseUrl: url, keyVariable: variable };
}

// Every variable whose value must never be in the config: the key variables
// and anything in the environment that is named like a secret.
function secretVariables(
  config: EvalConfig | undefined,
  env: Readonly<Record<string, string | undefined>>
): string[] {
  const names = new Set(Object.values(BUILT_IN).map((entry) => entry.keyVariable));
  for (const name of Object.keys(env)) if (SECRET_NAME.test(name)) names.add(name);
  const providers: unknown = config?.providers;
  for (const raw of isRecord(providers) ? Object.values(providers) : []) {
    if (isRecord(raw) && typeof raw['apiKeyEnvVar'] === 'string') names.add(raw['apiKeyEnvVar']);
  }
  return [...names];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'of the base URL';
  }
}

/**
 * Build the provider lookup of a run from the `eval` config, the environment
 * and the host flags. `anthropic` and `openai` have built-in URLs and key
 * variables; other providers need an `eval.providers` entry. Keys are read
 * from the environment at call time, never from the config. A key value, or
 * the value of any variable named like a secret, that appears anywhere in the
 * config refuses the whole run; `secretIn` lets `runEval` run the same check
 * over the models of each suite. A built-in provider moved to another kind or
 * host must name its key in `apiKeyEnvVar`. Error echoes leave out every
 * environment value of 8 or more characters, not only the key.
 *
 * @param options - Config, environment, host flags and the use callback
 * @returns A lookup that creates each provider once, on first use
 * @throws EvalProviderError `PS6307` when a key value appears in the config
 */
export function createProviderFactory(options: ProviderFactoryOptions): EvalProviderLookup {
  const { config, env } = options;
  const secretIn = (text: string): string | undefined =>
    secretVariables(config, env).find((variable) => {
      const value = env[variable];
      return value !== undefined && value.length >= MIN_SECRET_LENGTH && text.includes(value);
    });
  const found = secretIn(JSON.stringify(config ?? {}));
  if (found !== undefined) {
    throw new EvalProviderError(
      `The value of ${found} appears in the eval config, \${VAR} in baseUrl included; keep secrets only in the environment.`,
      EVAL_CODES.KEY_IN_CONFIG
    );
  }
  // Every longer value of the environment stays out of error echoes, longest first
  const secrets = (): string[] =>
    Object.values(env)
      .filter((value): value is string => value !== undefined && value.length >= MIN_SECRET_LENGTH)
      .sort((a, b) => b.length - a.length);

  const created = new Map<string, EvalProvider>();
  const lookup = (name: string): EvalProvider => {
    const existing = created.get(name);
    if (existing !== undefined) return existing;
    const entry = entryOf(name, config);
    const host = hostOf(entry.baseUrl);
    const why = refuseProviderUrl(entry.baseUrl, options);
    if (why !== undefined) {
      throw new EvalProviderError(
        `eval.providers.${name}.baseUrl: host ${host} is refused: ${why}.`,
        EVAL_CODES.URL_REFUSED
      );
    }
    if (env[entry.keyVariable] === undefined || env[entry.keyVariable] === '') {
      throw new EvalProviderError(
        `${entry.keyVariable} is not set; export it to call provider ${name}.`,
        EVAL_CODES.KEY_MISSING
      );
    }
    const providerConfig = {
      name,
      baseUrl: entry.baseUrl,
      apiKey: (): string => env[entry.keyVariable] ?? '',
      secrets,
      allowedHosts: options.allowedHosts ?? [],
      allowLocal: options.allowLocal ?? false,
      ...(config?.timeoutMs === undefined ? {} : { timeoutMs: config.timeoutMs }),
    };
    const deps = options.fetch === undefined ? {} : { fetch: options.fetch };
    const provider =
      entry.kind === 'anthropic'
        ? createAnthropicProvider(providerConfig, deps)
        : createOpenAICompatibleProvider(providerConfig, deps);
    options.onUse?.({ provider: name, keyVariable: entry.keyVariable, host });
    created.set(name, provider);
    return provider;
  };
  return Object.assign(lookup, { secretIn });
}
