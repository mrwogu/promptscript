import { describe, expect, it } from 'vitest';
import { formatDiagnostic } from './run.js';

describe('formatDiagnostic', () => {
  it('strips control characters from the message and file but keeps newlines', () => {
    const text = formatDiagnostic({
      code: 'PS042',
      message: 'Prompt id "x\u001b]8;;https://evil\u0007y" is invalid.\nExample:\n  id: acme',
      location: { file: 'a\u001b[2J.prs' },
    });

    expect(text).toBe(
      'PS042: Prompt id "x]8;;https://evily" is invalid.\nExample:\n  id: acme (a[2J.prs)'
    );
  });
});
