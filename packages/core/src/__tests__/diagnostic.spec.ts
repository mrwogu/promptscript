import { describe, it, expect } from 'vitest';
import {
  formatDiagnostic,
  formatDiagnostics,
  createLocation,
  type Diagnostic,
} from '../utils/diagnostic.js';

describe('createLocation', () => {
  it('should create a basic location', () => {
    const loc = createLocation('test.prs', 10, 5);
    expect(loc).toEqual({
      file: 'test.prs',
      line: 10,
      column: 5,
    });
  });

  it('should create a location with offset', () => {
    const loc = createLocation('test.prs', 10, 5, 150);
    expect(loc).toEqual({
      file: 'test.prs',
      line: 10,
      column: 5,
      offset: 150,
    });
  });

  it('should not include offset when undefined', () => {
    const loc = createLocation('test.prs', 1, 1);
    expect(loc).not.toHaveProperty('offset');
  });
});

describe('formatDiagnostic', () => {
  it('should format diagnostic with location', () => {
    const diagnostic: Diagnostic = {
      message: 'Missing required field',
      severity: 'error',
      location: { file: 'project.prs', line: 5, column: 3 },
    };
    const result = formatDiagnostic(diagnostic);
    expect(result).toBe('project.prs:5:3 - error: Missing required field');
  });

  it('should format diagnostic without location', () => {
    const diagnostic: Diagnostic = {
      message: 'General error',
      severity: 'error',
    };
    const result = formatDiagnostic(diagnostic);
    expect(result).toBe('error: General error');
  });

  it('should include diagnostic code', () => {
    const diagnostic: Diagnostic = {
      message: 'Invalid syntax',
      severity: 'error',
      location: { file: 'test.prs', line: 1, column: 1 },
      code: 'E001',
    };
    const result = formatDiagnostic(diagnostic);
    expect(result).toBe('test.prs:1:1 - error E001: Invalid syntax');
  });

  it('should include source', () => {
    const diagnostic: Diagnostic = {
      message: 'Issue found',
      severity: 'warning',
      source: 'meta-validator',
    };
    const result = formatDiagnostic(diagnostic);
    expect(result).toBe('warning: Issue found [meta-validator]');
  });

  it('should format all severity levels', () => {
    const severities = ['error', 'warning', 'info', 'hint'] as const;
    severities.forEach((severity) => {
      const diagnostic: Diagnostic = {
        message: 'Test message',
        severity,
      };
      const result = formatDiagnostic(diagnostic);
      expect(result).toContain(severity);
    });
  });

  it('should apply color when enabled', () => {
    const diagnostic: Diagnostic = {
      message: 'Error message',
      severity: 'error',
    };
    const result = formatDiagnostic(diagnostic, { color: true });
    expect(result).toContain('\x1b[31m'); // Red color
    expect(result).toContain('\x1b[0m'); // Reset
  });

  it('should apply yellow for warnings', () => {
    const diagnostic: Diagnostic = {
      message: 'Warning message',
      severity: 'warning',
    };
    const result = formatDiagnostic(diagnostic, { color: true });
    expect(result).toContain('\x1b[33m'); // Yellow color
  });

  it('should apply blue for info', () => {
    const diagnostic: Diagnostic = {
      message: 'Info message',
      severity: 'info',
    };
    const result = formatDiagnostic(diagnostic, { color: true });
    expect(result).toContain('\x1b[34m'); // Blue color
  });

  it('should apply cyan for hints', () => {
    const diagnostic: Diagnostic = {
      message: 'Hint message',
      severity: 'hint',
    };
    const result = formatDiagnostic(diagnostic, { color: true });
    expect(result).toContain('\x1b[36m'); // Cyan color
  });
});

describe('formatDiagnostics', () => {
  it('should format multiple diagnostics', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Error 1', severity: 'error' },
      { message: 'Error 2', severity: 'warning' },
    ];
    const result = formatDiagnostics(diagnostics);
    expect(result).toBe('error: Error 1\nwarning: Error 2');
  });

  it('should return empty string for empty array', () => {
    const result = formatDiagnostics([]);
    expect(result).toBe('');
  });

  it('should pass options to each diagnostic', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Error 1', severity: 'error' },
      { message: 'Error 2', severity: 'error' },
    ];
    const result = formatDiagnostics(diagnostics, { color: true });
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    lines.forEach((line) => {
      expect(line).toContain('\x1b[31m'); // Red color
    });
  });
});
