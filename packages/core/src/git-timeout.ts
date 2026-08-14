/**
 * Classify an error as a Git operation timeout.
 *
 * simple-git surfaces its block timeout as a plain message rather than a typed
 * error, so the message is inspected as well as `code`. URLs, ref names, and
 * branch names are stripped first: a repository or ref literally called
 * "timeout" must not be mistaken for a timed-out operation, because callers use
 * this classification to stop retrying with other credentials.
 */
export function isGitTimeoutError(error: Error): boolean {
  const errorWithCode = error as Error & { code?: unknown; cause?: unknown };
  const code = typeof errorWithCode.code === 'string' ? errorWithCode.code.toLowerCase() : '';
  const cause = errorWithCode.cause;
  const causeCode =
    cause instanceof Error &&
    'code' in cause &&
    typeof (cause as { code?: unknown }).code === 'string'
      ? (cause as { code: string }).code.toLowerCase()
      : '';

  return (
    code === 'etimedout' ||
    containsTimeoutMessage(error.message) ||
    (cause instanceof Error && containsTimeoutMessage(cause.message)) ||
    causeCode === 'etimedout'
  );
}

function containsTimeoutMessage(message: string): boolean {
  const withoutUrlsAndRefs = message
    .toLowerCase()
    .replace(/\b[a-z][a-z\d+.-]*:\/\/[^\s'"]+|git@[\w.-]+:[^\s'"]+/g, '')
    .replace(/\b(?:remote\s+)?ref(?:erence)?\s+["']?[^\s"']+/g, '')
    .replace(/\bremote\s+branch\s+["']?[^\s"']+/g, '');
  return /(?:^|[\s:()[\],.!?])(timeout|timed out|etimedout)(?=$|[\s:()[\],.!?])/i.test(
    withoutUrlsAndRefs
  );
}
