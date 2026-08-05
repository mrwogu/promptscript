import { interpolateEnvVars } from '../utils/interpolate-env.js';

describe('interpolateEnvVars', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should leave text without expressions unchanged', () => {
    expect(interpolateEnvVars('plain text', () => undefined)).toBe('plain text');
  });

  it('should replace values from the environment provider', () => {
    const provider = (name: string): string | undefined =>
      name === 'PROJECT_ID' ? 'promptscript' : undefined;

    expect(interpolateEnvVars('id=${PROJECT_ID}', provider)).toBe('id=promptscript');
  });

  it('should use defaults for missing variables', () => {
    expect(interpolateEnvVars('${MISSING_VAR:-fallback}', () => undefined)).toBe('fallback');
  });

  it('should warn and use an empty string without a default', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(interpolateEnvVars('${MISSING_VAR}', () => undefined)).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      "Warning: Environment variable 'MISSING_VAR' is not set, using empty string"
    );
  });

  it.each(['${1INVALID}', '${VAR:invalid}', '${VAR', '${VAR:-unterminated'])(
    'should preserve malformed expression %s',
    (text) => {
      expect(interpolateEnvVars(`prefix ${text} suffix`, () => undefined)).toBe(
        `prefix ${text} suffix`
      );
    }
  );

  it('should preserve nested-looking default text', () => {
    expect(interpolateEnvVars('${MISSING_VAR:-a${OTHER_VAR}}', () => undefined)).toBe(
      'a${OTHER_VAR}'
    );
  });
});
