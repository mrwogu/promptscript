type EnvironmentVariableProvider = (name: string) => string | undefined;

/**
 * Interpolate environment variables without regex backtracking.
 * Supports ${VAR} and ${VAR:-default} syntax.
 */
export function interpolateEnvVars(
  text: string,
  environmentProvider: EnvironmentVariableProvider
): string {
  let result = '';
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf('${', cursor);
    if (start === -1) {
      result += text.slice(cursor);
      break;
    }

    result += text.slice(cursor, start);
    const nameStart = start + 2;
    const firstCode = text.charCodeAt(nameStart);
    if (
      !(
        (firstCode >= 65 && firstCode <= 90) ||
        (firstCode >= 97 && firstCode <= 122) ||
        firstCode === 95
      )
    ) {
      result += '${';
      cursor = nameStart;
      continue;
    }

    let nameEnd = nameStart + 1;
    while (nameEnd < text.length) {
      const code = text.charCodeAt(nameEnd);
      if (
        !(
          (code >= 65 && code <= 90) ||
          (code >= 97 && code <= 122) ||
          (code >= 48 && code <= 57) ||
          code === 95
        )
      ) {
        break;
      }
      nameEnd += 1;
    }

    let expressionEnd = nameEnd;
    let defaultValue: string | undefined;
    if (text[nameEnd] === '}') {
      expressionEnd += 1;
    } else if (text.startsWith(':-', nameEnd)) {
      const defaultStart = nameEnd + 2;
      const closingBrace = text.indexOf('}', defaultStart);
      if (closingBrace === -1) {
        result += text.slice(start);
        break;
      }
      defaultValue = text.slice(defaultStart, closingBrace);
      expressionEnd = closingBrace + 1;
    } else {
      result += text.slice(start, nameEnd);
      cursor = nameEnd;
      continue;
    }

    const varName = text.slice(nameStart, nameEnd);
    const envValue = environmentProvider(varName);

    if (envValue !== undefined) {
      result += envValue;
    } else if (defaultValue !== undefined) {
      result += defaultValue;
    } else {
      console.warn(`Warning: Environment variable '${varName}' is not set, using empty string`);
    }

    cursor = expressionEnd;
  }

  return result;
}
