import { describe, it, expect } from 'vitest';
import { isGitTimeoutError } from '../git-timeout.js';

describe('isGitTimeoutError', () => {
  it('classifies an ETIMEDOUT error code', () => {
    const error = Object.assign(new Error('connect failed'), { code: 'ETIMEDOUT' });

    expect(isGitTimeoutError(error)).toBe(true);
  });

  it('classifies an ETIMEDOUT code on the cause', () => {
    const cause = Object.assign(new Error('connect failed'), { code: 'etimedout' });
    const error = new Error('clone failed', { cause });

    expect(isGitTimeoutError(error)).toBe(true);
  });

  it('classifies a simple-git block timeout message', () => {
    const error = new Error('block timeout reached');

    expect(isGitTimeoutError(error)).toBe(true);
  });

  it('classifies a timeout message on the cause', () => {
    const error = new Error('clone failed', { cause: new Error('operation timed out') });

    expect(isGitTimeoutError(error)).toBe(true);
  });

  it('does not classify a repository URL containing timeout', () => {
    const error = new Error('Authentication failed for https://example.com/timeout-repo');

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('does not classify an SSH remote containing timeout', () => {
    const error = new Error('could not read from remote git@example.com:org/timeout.git');

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('does not classify a missing ref named timeout', () => {
    const error = new Error("Could not find remote ref 'timeout'");

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('does not classify a remote branch named timeout', () => {
    const error = new Error("remote branch 'timeout' not found");

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('does not classify an unrelated failure', () => {
    const error = new Error('Authentication failed');

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('does not classify a non-string error code', () => {
    const error = Object.assign(new Error('clone failed'), { code: 128 });

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('does not classify a non-Error cause', () => {
    const error = new Error('clone failed', { cause: 'timed out' });

    expect(isGitTimeoutError(error)).toBe(false);
  });

  it('classifies a timeout word bounded by punctuation', () => {
    const error = new Error('fetch failed (timeout).');

    expect(isGitTimeoutError(error)).toBe(true);
  });
});
