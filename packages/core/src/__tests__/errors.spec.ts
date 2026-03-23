import { describe, it, expect } from 'vitest';
import {
  PSError,
  ErrorCode,
  ParseError,
  UnexpectedTokenError,
  ResolveError,
  FileNotFoundError,
  CircularDependencyError,
  GitCloneError,
  GitAuthError,
  GitRefNotFoundError,
  ValidationError,
  UnknownAliasError,
  RegistryPathNotFoundError,
  SemverNoMatchError,
  LockfileIntegrityError,
  OfflineResolveError,
  RateLimitError,
} from '../errors/index.js';
import type { SourceLocation } from '../types/index.js';

const mockLocation: SourceLocation = {
  file: 'test.prs',
  line: 10,
  column: 5,
};

describe('PSError', () => {
  it('should create error with message and code', () => {
    const error = new PSError('Test error', ErrorCode.PARSE_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCode.PARSE_ERROR);
    expect(error.name).toBe('PSError');
  });

  it('should include location when provided', () => {
    const error = new PSError('Test error', ErrorCode.PARSE_ERROR, {
      location: mockLocation,
    });
    expect(error.location).toEqual(mockLocation);
  });

  it('should include cause when provided', () => {
    const cause = new Error('Original error');
    const error = new PSError('Wrapped error', ErrorCode.PARSE_ERROR, { cause });
    expect(error.cause).toBe(cause);
  });

  describe('format', () => {
    it('should format error without location', () => {
      const error = new PSError('Test error', ErrorCode.PARSE_ERROR);
      expect(error.format()).toBe('PSError [PS1000]: Test error');
    });

    it('should format error with location', () => {
      const error = new PSError('Test error', ErrorCode.PARSE_ERROR, {
        location: mockLocation,
      });
      expect(error.format()).toBe('PSError [PS1000]: Test error\n  at test.prs:10:5');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const error = new PSError('Test error', ErrorCode.PARSE_ERROR, {
        location: mockLocation,
      });
      expect(error.toJSON()).toEqual({
        name: 'PSError',
        code: ErrorCode.PARSE_ERROR,
        message: 'Test error',
        location: mockLocation,
      });
    });
  });
});

describe('ParseError', () => {
  it('should create parse error', () => {
    const error = new ParseError('Parse failed', mockLocation);
    expect(error.name).toBe('ParseError');
    expect(error.code).toBe(ErrorCode.PARSE_ERROR);
    expect(error.location).toEqual(mockLocation);
  });

  it('should allow custom error code', () => {
    const error = new ParseError('Invalid path', mockLocation, ErrorCode.INVALID_PATH);
    expect(error.code).toBe(ErrorCode.INVALID_PATH);
  });
});

describe('UnexpectedTokenError', () => {
  it('should create error with token', () => {
    const error = new UnexpectedTokenError('foo', mockLocation);
    expect(error.name).toBe('UnexpectedTokenError');
    expect(error.token).toBe('foo');
    expect(error.message).toBe("Unexpected token 'foo'");
  });

  it('should include expected tokens', () => {
    const error = new UnexpectedTokenError('foo', mockLocation, ['@identity', '@context']);
    expect(error.expected).toEqual(['@identity', '@context']);
    expect(error.message).toBe("Unexpected token 'foo', expected: @identity | @context");
  });
});

describe('ResolveError', () => {
  it('should create resolve error', () => {
    const error = new ResolveError('Resolution failed', mockLocation);
    expect(error.name).toBe('ResolveError');
    expect(error.code).toBe(ErrorCode.RESOLVE_ERROR);
  });
});

describe('FileNotFoundError', () => {
  it('should create file not found error', () => {
    const error = new FileNotFoundError('@core/guards', mockLocation);
    expect(error.name).toBe('FileNotFoundError');
    expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(error.path).toBe('@core/guards');
    expect(error.message).toBe('File not found: @core/guards');
  });
});

describe('CircularDependencyError', () => {
  it('should create circular dependency error', () => {
    const chain = ['a.prs', 'b.prs', 'c.prs', 'a.prs'];
    const error = new CircularDependencyError(chain);
    expect(error.name).toBe('CircularDependencyError');
    expect(error.code).toBe(ErrorCode.CIRCULAR_DEPENDENCY);
    expect(error.chain).toEqual(chain);
    expect(error.message).toBe('Circular dependency detected: a.prs → b.prs → c.prs → a.prs');
  });
});

describe('GitCloneError', () => {
  it('should create git clone error', () => {
    const error = new GitCloneError(
      'Failed to clone repository',
      'https://github.com/org/repo.git',
      mockLocation
    );
    expect(error.name).toBe('GitCloneError');
    expect(error.code).toBe(ErrorCode.GIT_CLONE_ERROR);
    expect(error.url).toBe('https://github.com/org/repo.git');
    expect(error.message).toBe('Failed to clone repository');
    expect(error.location).toEqual(mockLocation);
  });

  it('should include cause when provided', () => {
    const cause = new Error('Network error');
    const error = new GitCloneError(
      'Clone failed',
      'https://github.com/org/repo.git',
      mockLocation,
      cause
    );
    expect(error.cause).toBe(cause);
  });

  it('should work without location', () => {
    const error = new GitCloneError('Clone failed', 'https://github.com/org/repo.git');
    expect(error.location).toBeUndefined();
  });
});

describe('GitAuthError', () => {
  it('should create git auth error', () => {
    const error = new GitAuthError(
      'Authentication required',
      'https://github.com/org/private-repo.git',
      mockLocation
    );
    expect(error.name).toBe('GitAuthError');
    expect(error.code).toBe(ErrorCode.GIT_AUTH_ERROR);
    expect(error.url).toBe('https://github.com/org/private-repo.git');
    expect(error.message).toBe('Authentication required');
    expect(error.location).toEqual(mockLocation);
  });

  it('should work without location', () => {
    const error = new GitAuthError('Auth failed', 'https://github.com/org/repo.git');
    expect(error.location).toBeUndefined();
  });
});

describe('GitRefNotFoundError', () => {
  it('should create git ref not found error', () => {
    const error = new GitRefNotFoundError(
      'feature/branch',
      'https://github.com/org/repo.git',
      mockLocation
    );
    expect(error.name).toBe('GitRefNotFoundError');
    expect(error.code).toBe(ErrorCode.GIT_REF_NOT_FOUND);
    expect(error.ref).toBe('feature/branch');
    expect(error.url).toBe('https://github.com/org/repo.git');
    expect(error.message).toBe(
      'Git ref not found: feature/branch in https://github.com/org/repo.git'
    );
    expect(error.location).toEqual(mockLocation);
  });

  it('should work without location', () => {
    const error = new GitRefNotFoundError('v1.0.0', 'https://github.com/org/repo.git');
    expect(error.location).toBeUndefined();
  });
});

describe('ValidationError', () => {
  it('should create validation error with default severity', () => {
    const error = new ValidationError('Invalid value', 'no-empty');
    expect(error.name).toBe('ValidationError');
    expect(error.ruleId).toBe('no-empty');
    expect(error.severity).toBe('error');
    expect(error.code).toBe('PS3000_no-empty');
  });

  it('should accept custom severity', () => {
    const error = new ValidationError('Warning', 'style-rule', {
      severity: 'warning',
    });
    expect(error.severity).toBe('warning');
  });

  it('should include suggestion', () => {
    const error = new ValidationError('Missing field', 'required-field', {
      suggestion: 'Add the required field',
    });
    expect(error.suggestion).toBe('Add the required field');
  });

  describe('format', () => {
    it('should format with suggestion', () => {
      const error = new ValidationError('Missing field', 'required-field', {
        location: mockLocation,
        suggestion: 'Add the required field',
      });
      const formatted = error.format();
      expect(formatted).toContain('Missing field');
      expect(formatted).toContain('test.prs:10:5');
      expect(formatted).toContain('suggestion: Add the required field');
    });

    it('should format without suggestion', () => {
      const error = new ValidationError('Missing field', 'required-field', {
        location: mockLocation,
      });
      const formatted = error.format();
      expect(formatted).toContain('Missing field');
      expect(formatted).toContain('test.prs:10:5');
      expect(formatted).not.toContain('suggestion:');
    });
  });
});

describe('ErrorCode', () => {
  it('should have parse error codes', () => {
    expect(ErrorCode.PARSE_ERROR).toBe('PS1000');
    expect(ErrorCode.UNEXPECTED_TOKEN).toBe('PS1001');
    expect(ErrorCode.UNTERMINATED_STRING).toBe('PS1002');
    expect(ErrorCode.INVALID_PATH).toBe('PS1003');
  });

  it('should have resolve error codes', () => {
    expect(ErrorCode.RESOLVE_ERROR).toBe('PS2000');
    expect(ErrorCode.FILE_NOT_FOUND).toBe('PS2001');
    expect(ErrorCode.CIRCULAR_DEPENDENCY).toBe('PS2002');
    expect(ErrorCode.INVALID_INHERIT).toBe('PS2003');
  });

  it('should have validation error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('PS3000');
    expect(ErrorCode.REQUIRED_FIELD).toBe('PS3001');
    expect(ErrorCode.INVALID_VALUE).toBe('PS3002');
    expect(ErrorCode.BLOCKED_PATTERN).toBe('PS3003');
    expect(ErrorCode.MISSING_GUARD).toBe('PS3004');
  });
});

describe('Registry errors', () => {
  it('should create UnknownAliasError with alias', () => {
    const error = new UnknownAliasError('myalias', mockLocation);
    expect(error.name).toBe('UnknownAliasError');
    expect(error.alias).toBe('myalias');
    expect(error.code).toBe(ErrorCode.UNKNOWN_ALIAS);
    expect(error.message).toContain('myalias');
    expect(error.message).toContain('prs registry list');
  });

  it('should create RegistryPathNotFoundError with available paths', () => {
    const error = new RegistryPathNotFoundError('@org/missing', ['@org/a', '@org/b'], mockLocation);
    expect(error.name).toBe('RegistryPathNotFoundError');
    expect(error.importPath).toBe('@org/missing');
    expect(error.available).toEqual(['@org/a', '@org/b']);
    expect(error.message).toContain('@org/missing');
    expect(error.message).toContain('@org/a, @org/b');
  });

  it('should create RegistryPathNotFoundError with no available paths', () => {
    const error = new RegistryPathNotFoundError('@org/missing', []);
    expect(error.message).not.toContain('Available');
  });

  it('should create SemverNoMatchError with latest version', () => {
    const error = new SemverNoMatchError(
      '^2.0.0',
      'https://github.com/org/reg',
      '1.5.0',
      mockLocation
    );
    expect(error.name).toBe('SemverNoMatchError');
    expect(error.range).toBe('^2.0.0');
    expect(error.latest).toBe('1.5.0');
    expect(error.message).toContain('^2.0.0');
    expect(error.message).toContain('1.5.0');
  });

  it('should create SemverNoMatchError without latest version', () => {
    const error = new SemverNoMatchError('^3.0.0', 'https://github.com/org/reg');
    expect(error.latest).toBeUndefined();
    expect(error.message).not.toContain('Latest');
  });

  it('should create LockfileIntegrityError', () => {
    const error = new LockfileIntegrityError('@org/base', mockLocation);
    expect(error.name).toBe('LockfileIntegrityError');
    expect(error.importPath).toBe('@org/base');
    expect(error.message).toContain('@org/base');
    expect(error.message).toContain('prs update');
  });

  it('should create OfflineResolveError', () => {
    const error = new OfflineResolveError('@org/offline', mockLocation);
    expect(error.name).toBe('OfflineResolveError');
    expect(error.importPath).toBe('@org/offline');
    expect(error.message).toContain('no network');
    expect(error.message).toContain('prs vendor sync');
  });

  it('should create RateLimitError with retry time', () => {
    const error = new RateLimitError('https://api.github.com', 15, mockLocation);
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfterMinutes).toBe(15);
    expect(error.message).toContain('15 minutes');
    expect(error.message).toContain('GITHUB_TOKEN');
  });

  it('should create RateLimitError without retry time', () => {
    const error = new RateLimitError('https://api.github.com');
    expect(error.retryAfterMinutes).toBeUndefined();
    expect(error.message).toContain('GITHUB_TOKEN');
    expect(error.message).not.toContain('minutes');
  });
});
